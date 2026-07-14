import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BoardingPassCard } from "@/src/components/BoardingPassCard";
import { useFlight } from "../../src/context/FlightContext";
import { useScanHistory } from "../../src/hooks/useScanHistory";
import {
  BoardingPassData,
  parseBoardingPass,
} from "../../src/lib/boardingPassParser";
import { colors, radius, spacing } from "@/src/theme";
import { SearchBar } from "@/src/components/SearchBar";

export default function ScanScreen() {
  const { flight } = useFlight();
  const { items, totalCount, addScan, isDuplicate, removeItem, searchQuery, setSearchQuery } =
    useScanHistory();
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const scanLock = useRef(false);
  const lastScan = useRef<{ value: string; time: number } | null>(null);
  const scanLineY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isScanning) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineY, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scanLineY, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [isScanning, scanLineY]);

  const showResult = useCallback((success: boolean, message: string) => {
    if (scanLock.current) return;
    scanLock.current = true;
    setResult({ success, message });
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(
        success
          ? Haptics.NotificationFeedbackType.Success
          : Haptics.NotificationFeedbackType.Error,
      ).catch(() => {});
    }
    setTimeout(() => {
      scanLock.current = false;
      setResult(null);
    }, 1800);
  }, []);

  const handleBarcode = useCallback(
    async (raw: string | undefined) => {
      if (!raw) return;
      console.log("raw", raw);
      const now = Date.now();
      if (
        lastScan.current &&
        lastScan.current.value === raw &&
        now - lastScan.current.time < 2000
      )
        return;
      lastScan.current = { value: raw, time: now };

      const bp = parseBoardingPass(raw, flight.airlineCode);
      console.log("bp", bp);
      if (!bp) return showResult(false, "Not a boarding pass");

      if (flight.routing && bp.routing !== flight.routing)
        return showResult(false, "Wrong routing");
      if (flight.airlineCode && bp.carrierCode !== flight.airlineCode)
        return showResult(false, "Wrong airline");
      if (flight.flightNumber && bp.flightNumber !== flight.flightNumber)
        return showResult(false, "Wrong flight");

      if (flight.date && bp.date && bp.date !== flight.date)
        return showResult(false, "Wrong date");

      if (!bp.seat || !/[A-Z]/.test(bp.seat))
        return showResult(false, "No seat assigned!");

      if (isDuplicate(raw)) return showResult(false, "Already scanned!");

      const res = await addScan(raw);
      showResult(
        !res.duplicate && res.success,
        res.duplicate ? "Already scanned!" : "Scan successful!",
      );
    },
    [flight, addScan, isDuplicate, showResult],
  );

  async function startScanning() {
    if (!permission?.granted) {
      const res = await requestPermission();
      if (!res.granted) {
        showResult(false, "Camera permission denied");
        return;
      }
    }
    setIsScanning(true);
  }

  const translateY = scanLineY.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 260],
  });

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Scan Boarding Pass</Text>
          <Text style={styles.subtitle}>
            {totalCount} scanned ·{" "}
            {flight.airlineCode
              ? `${flight.airlineCode}${flight.flightNumber}`
              : "No flight"}
          </Text>
        </View>
      </View>

      <View style={styles.viewfinderWrap}>
        <View style={styles.viewfinder} testID="scanner-viewfinder">
          {isScanning && permission?.granted ? (
            <>
              <CameraView
                style={StyleSheet.absoluteFill}
                facing="back"
                onBarcodeScanned={(scanResult) => {
                  console.log("scan",scanResult.raw)
                 
                  

                  handleBarcode(scanResult.raw);
                }}
                barcodeScannerSettings={{
                  barcodeTypes: [
                    "pdf417",
                    "aztec",
                    "qr",
                    "code128",
                    "code39",
                    "datamatrix",
                  ],
                }}
              />
              <Animated.View
                style={[styles.scanLine, { transform: [{ translateY }] }]}
              />
            </>
          ) : (
            <View style={styles.cameraOff}>
              <Ionicons
                name="scan-outline"
                size={56}
                color={colors.textSecondary}
              />
              <Text style={styles.cameraOffText}>Camera off</Text>
              <Text style={styles.cameraOffHint}>
                Tap below to start scanning
              </Text>
            </View>
          )}

          {/* Corner brackets */}
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />

          {result && (
            <View
              style={[
                styles.resultOverlay,
                {
                  backgroundColor: result.success
                    ? "rgba(48,209,88,0.2)"
                    : "rgba(255,69,58,0.2)",
                },
              ]}
              testID="scan-result"
            >
              <View
                style={[
                  styles.resultPill,
                  {
                    backgroundColor: result.success
                      ? colors.success
                      : colors.error,
                  },
                ]}
              >
                <Ionicons
                  name={result.success ? "checkmark-circle" : "close-circle"}
                  size={18}
                  color="#000"
                />
                <Text style={styles.resultText}>{result.message}</Text>
              </View>
            </View>
          )}
        </View>

        {!isScanning ? (
          <TouchableOpacity
            style={styles.scanBtn}
            onPress={startScanning}
            testID="btn-start-scan"
          >
            <Ionicons name="camera-outline" size={20} color="#000" />
            <Text style={styles.scanBtnText}>Start Scanning</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.scanBtn, styles.stopBtn]}
            onPress={() => setIsScanning(false)}
            testID="btn-stop-scan"
          >
            <Ionicons name="stop-circle-outline" size={20} color="#fff" />
            <Text style={[styles.scanBtnText, { color: "#fff" }]}>
              Stop Scanning
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {!isScanning && (
        <View style={styles.historyWrap}>
          <Text style={styles.sectionTitle}>Scan History</Text>
          {totalCount > 0 && (
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                resultCount={items.length}
                totalCount={totalCount}
              />
            )}
          {items.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons
                name="document-text-outline"
                size={32}
                color={colors.textSecondary}
              />
              <Text style={styles.emptyTxt}>No scans yet</Text>
            </View>
          ) : (
            <FlatList
              data={items.slice(0, 20)}
              keyExtractor={(it) => it.id}
              contentContainerStyle={{ paddingBottom: 120 }}
              renderItem={({ item }) => {
                const bp = parseBoardingPass(item.data, "") as BoardingPassData;
                if (!bp) return null;
                return (
                  <BoardingPassCard
                    data={bp}
                    timestamp={item.timestamp}
                    onRemove={() => removeItem(item.id)}
                  />
                );
              }}
            />
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const VIEWFINDER = 280;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  title: { color: colors.textPrimary, fontSize: 22, fontWeight: "800" },
  subtitle: { color: colors.textSecondary, fontSize: 13, marginTop: 2 },
  viewfinderWrap: {
    alignItems: "center",
    paddingVertical: spacing.lg,
    gap: spacing.lg,
  },
  viewfinder: {
    width: VIEWFINDER,
    height: VIEWFINDER,
    borderRadius: radius.lg,
    backgroundColor: "#000",
    overflow: "hidden",
    position: "relative",
  },
  cameraOff: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.surface,
  },
  cameraOffText: { color: colors.textSecondary, fontSize: 14 },
  cameraOffHint: { color: colors.textSecondary, fontSize: 11, opacity: 0.7 },
  scanLine: {
    position: "absolute",
    left: 10,
    right: 10,
    top: 10,
    height: 2,
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 8,
  },
  corner: {
    position: "absolute",
    width: 28,
    height: 28,
    borderColor: colors.primary,
    borderWidth: 3,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: radius.lg,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: radius.lg,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: radius.lg,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: radius.lg,
  },
  resultOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  resultPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  resultText: { color: "#000", fontWeight: "700", fontSize: 14 },
  scanBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: spacing.xl,
    paddingVertical: 14,
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
  },
  stopBtn: { backgroundColor: colors.error },
  scanBtnText: { color: "#000", fontWeight: "700", fontSize: 15 },
  historyWrap: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: spacing.md,
  },
  empty: {
    alignItems: "center",
    padding: spacing.xl,
    gap: 8,
  },
  emptyTxt: { color: colors.textSecondary, fontSize: 13 },
});
