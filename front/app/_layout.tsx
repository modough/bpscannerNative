import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { FlightProvider } from "../src/context/FlightContext";
import { ScanHistoryProvider } from "../src/hooks/useScanHistory";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: "#090A0C" }}>
      <SafeAreaProvider>
        <FlightProvider>
          <ScanHistoryProvider>
            <StatusBar style="light" />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: "#090A0C" },
              }}
            />
          </ScanHistoryProvider>
        </FlightProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
