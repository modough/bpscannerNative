import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { parseBoardingPass } from "../lib/boardingPassParser";
import { colors, radius, spacing } from "../theme";
import { ScanItem } from "../hooks/useScanHistory";

const MIN_SIZE = 10;
const MAX_SIZE = 250;
const DEFAULT_SIZE = 50;
const STORAGE_KEY = "@bps/board_size";

interface Props {
  items: ScanItem[];
}

export default function BingoBoard({ items }: Props) {
  const [boardSize, setBoardSize] = useState<number>(DEFAULT_SIZE);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setBoardSize(Number(raw));
      } catch {}
      setLoaded(true);
    })();
  }, []);

  const update = async (n: number) => {
    const clamped = Math.max(MIN_SIZE, Math.min(MAX_SIZE, n));
    setBoardSize(clamped);
    await AsyncStorage.setItem(STORAGE_KEY, String(clamped));
  };

  const numbers = useMemo(
    () =>
      Array.from({ length: boardSize }, (_, i) =>
        String(i + 1).padStart(4, "0"),
      ),
    [boardSize],
  );

  const matched = useMemo(() => {
    const set = new Set<string>();
    for (const it of items) {
      const bp = parseBoardingPass(it.data, "");
      if (bp?.sequenceNumber)
        set.add(String(bp.sequenceNumber).padStart(4, "0"));
    }
    return set;
  }, [items]);

  if (!loaded) {
    return (
      <View style={styles.loading}>
        <Text style={{ color: colors.textSecondary }}>Loading board...</Text>
      </View>
    );
  }

  return (
    <View style={{ gap: spacing.md }}>
      <Text style={styles.sectionLabel}>SEQUENCE BOARD</Text>

      <LinearGradient
        colors={["rgba(255,159,10,0.1)", colors.surfaceElevated]}
        style={styles.boardWrap}
      >
        <View style={styles.grid}>
          {numbers.map((num) => {
            const isMatched = matched.has(num);
            return (
              <View
                key={num}
                style={[styles.cell, isMatched ? styles.cellFilled : styles.cellEmpty]}
                testID={`bingo-cell-${num}`}
              >
                <Text style={[styles.cellText, isMatched && styles.cellTextFilled]}>
                  {num.slice(-3)}
                </Text>
              </View>
            );
          })}
        </View>
      </LinearGradient>

      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.controlBtn}
          onPress={() => update(boardSize - 10)}
          disabled={boardSize <= MIN_SIZE}
          testID="bingo-decrement"
        >
          <Ionicons name="remove" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.controlText}>Max: {boardSize}</Text>
        <TouchableOpacity
          style={styles.controlBtn}
          onPress={() => update(boardSize + 10)}
          disabled={boardSize >= MAX_SIZE}
          testID="bingo-increment"
        >
          <Ionicons name="add" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { padding: spacing.xl, alignItems: "center" },
  sectionLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    letterSpacing: 1.5,
    fontWeight: "700",
  },
  boardWrap: {
    padding: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "rgba(255,159,10,0.3)",
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 4 },
  cell: {
    width: "9%",
    aspectRatio: 1,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  cellEmpty: {
    backgroundColor: colors.surface,
    borderColor: "rgba(255,255,255,0.05)",
  },
  cellFilled: {
    backgroundColor: "rgba(255,159,10,0.2)",
    borderColor: "rgba(255,159,10,0.6)",
  },
  cellText: { color: colors.textSecondary, fontSize: 10, fontFamily: "Courier" },
  cellTextFilled: { color: colors.primary, fontWeight: "700" },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  controlBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  controlText: {
    color: colors.textPrimary,
    fontWeight: "600",
    minWidth: 80,
    textAlign: "center",
  },
});
