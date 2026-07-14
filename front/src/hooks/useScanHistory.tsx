import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import uuid from "react-native-uuid";

import { BoardingPassData, parseBoardingPass } from "../lib/boardingPassParser";

export interface ScanItem {
  id: string;
  data: string;
  timestamp: number;
  type: "url" | "text" | "boarding-pass" | "other";
}

const EXPIRE_MS = 36 * 60 * 60 * 1000;
const STORAGE_KEY = "@bps/scan_history";

interface ScanHistoryValue {
  items: ScanItem[];
  rawItems: ScanItem[];
  totalCount: number;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  addScan: (
    input: string | BoardingPassData,
  ) => Promise<{ success: boolean; duplicate: boolean }>;
  removeItem: (id: string) => Promise<void>;
  clearHistory: () => Promise<void>;
  isDuplicate: (data: string) => boolean;
  loading: boolean;
}

const ScanHistoryContext = createContext<ScanHistoryValue | undefined>(undefined);

async function persist(items: ScanItem[]) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export const ScanHistoryProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [items, setItems] = useState<ScanItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        const parsed: ScanItem[] = raw ? JSON.parse(raw) : [];
        const now = Date.now();
        const fresh = parsed.filter((it) => now - it.timestamp < EXPIRE_MS);
        setItems(fresh);
        if (fresh.length !== parsed.length) await persist(fresh);
      } catch (e) {
        console.warn("Failed to load scan history", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const isDuplicate = useCallback(
    (data: string) => {
      const bp = parseBoardingPass(data, "");
      if (!bp?.sequenceNumber) return false;
      return items.some((item) => {
        const existing = parseBoardingPass(item.data, "");
        return existing?.sequenceNumber === bp.sequenceNumber;
      });
    },
    [items],
  );

  const addScan = useCallback(
    async (input: string | BoardingPassData) => {
      let bp: BoardingPassData | null = null;
      if (typeof input === "string") bp = parseBoardingPass(input, "");
      else bp = input;
      if (!bp) return { success: false, duplicate: false };

      const dup = items.some((item) => {
        const existing = parseBoardingPass(item.data, "");
        return existing?.sequenceNumber === bp!.sequenceNumber;
      });
      if (dup) return { success: false, duplicate: true };

      const newItem: ScanItem = {
        id: String(uuid.v4()),
        data: bp.rawData || "MANUAL_ENTRY",
        timestamp: Date.now(),
        type: "boarding-pass",
      };
      const next = [newItem, ...items];
      setItems(next);
      await persist(next);
      return { success: true, duplicate: false };
    },
    [items],
  );

  const removeItem = useCallback(
    async (id: string) => {
      const next = items.filter((it) => it.id !== id);
      setItems(next);
      await persist(next);
    },
    [items],
  );

  const clearHistory = useCallback(async () => {
    setItems([]);
    await persist([]);
  }, []);

  const filteredItems = useMemo(() => {
    const q = searchQuery.toLowerCase();
    if (!q) return items;
    return items.filter((it) => it.data.toLowerCase().includes(q));
  }, [items, searchQuery]);

  const value: ScanHistoryValue = {
    items: filteredItems,
    rawItems: items,
    totalCount: items.length,
    searchQuery,
    setSearchQuery,
    addScan,
    removeItem,
    clearHistory,
    isDuplicate,
    loading,
  };

  return (
    <ScanHistoryContext.Provider value={value}>
      {children}
    </ScanHistoryContext.Provider>
  );
};

export function useScanHistory() {
  const ctx = useContext(ScanHistoryContext);
  if (!ctx)
    throw new Error("useScanHistory must be used within ScanHistoryProvider");
  return ctx;
}
