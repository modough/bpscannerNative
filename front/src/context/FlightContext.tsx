import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

export interface FlightConfig {
  airlineCode: string;
  flightNumber: string;
  routing: string;
  date: string;
}

const DEFAULT_FLIGHT: FlightConfig = {
  airlineCode: "",
  flightNumber: "",
  routing: "",
  date: "",
};

const STORAGE_KEY = "@bps/flight_config";

interface FlightContextValue {
  flight: FlightConfig;
  setFlight: (config: FlightConfig) => Promise<void>;
  loading: boolean;
}

const FlightContext = createContext<FlightContextValue | undefined>(undefined);

export const FlightProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [flight, setFlightState] = useState<FlightConfig>(DEFAULT_FLIGHT);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setFlightState(JSON.parse(raw));
      } catch (e) {
        console.warn("Failed to load flight config", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const setFlight = async (config: FlightConfig) => {
    setFlightState(config);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  };

  return (
    <FlightContext.Provider value={{ flight, setFlight, loading }}>
      {children}
    </FlightContext.Provider>
  );
};

export function useFlight() {
  const ctx = useContext(FlightContext);
  if (!ctx) throw new Error("useFlight must be used within FlightProvider");
  return ctx;
}
