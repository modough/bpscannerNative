import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { BoardingPassData, formatRouting } from "../lib/boardingPassParser";
import { colors, radius, spacing } from "../theme";

interface Props {
  data: BoardingPassData;
  timestamp: number;
  onRemove: () => void;
}

function formatTimestamp(ts: number): string {
  const now = Date.now();
  const diff = now - ts;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString();
}

export function BoardingPassCard({ data, timestamp, onRemove }: Props) {
  const { from, to } = formatRouting(data.routing);

  return (
    <View style={styles.wrapper} testID={`boarding-pass-${data.sequenceNumber}`}>
      <LinearGradient
        colors={["rgba(255,159,10,0.15)", colors.surfaceElevated, colors.surface]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.iconBox}>
              <Ionicons name="airplane" size={18} color={colors.primary} />
            </View>
            <View>
              <Text style={styles.tinyLabel}>FLIGHT</Text>
              <Text style={styles.flightNum}>{data.flightNumber}</Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={onRemove}
            hitSlop={10}
            testID={`delete-pass-${data.sequenceNumber}`}
          >
            <Ionicons name="trash-outline" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Route */}
        <View style={styles.routeRow}>
          <View style={styles.routeCol}>
            <Text style={styles.routeCode}>{from || "---"}</Text>
            <Text style={styles.tinyLabel}>FROM</Text>
          </View>
          <View style={styles.routeMiddle}>
            <View style={styles.dot} />
            <View style={styles.line} />
            <Ionicons name="airplane" size={14} color={colors.primary} />
            <View style={styles.line} />
            <View style={styles.dot} />
          </View>
          <View style={styles.routeCol}>
            <Text style={styles.routeCode}>{to || "---"}</Text>
            <Text style={styles.tinyLabel}>TO</Text>
          </View>
        </View>

        {/* Notch + dashed divider */}
        <View style={styles.notchRow}>
          <View style={[styles.notch, styles.notchLeft]} />
          <View style={styles.dashed} />
          <View style={[styles.notch, styles.notchRight]} />
        </View>

        {/* Info grid */}
        <View style={styles.grid}>
          <InfoCell icon="person-outline" label="Passenger" value={`${data.firstName} ${data.lastName}`.trim()} />
          <InfoCell icon="pricetag-outline" label="PNR" value={data.pnr || "—"} mono />
          <InfoCell icon="grid-outline" label="Seat" value={data.seat || "—"} />
          <InfoCell icon="barcode-outline" label="Seq" value={data.sequenceNumber || "—"} mono />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>{formatTimestamp(timestamp)}</Text>
        </View>
      </LinearGradient>
    </View>
  );
}

function InfoCell({
  icon,
  label,
  value,
  mono,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <View style={styles.cell}>
      <Ionicons name={icon} size={14} color={colors.textSecondary} />
      <View style={{ flex: 1 }}>
        <Text style={styles.tinyLabel}>{label}</Text>
        <Text
          style={[styles.cellValue, mono && { fontFamily: "Courier" }]}
          numberOfLines={1}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.md,
  },
  card: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: "rgba(255,159,10,0.3)",
    padding: spacing.lg,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  tinyLabel: {
    color: colors.textSecondary,
    fontSize: 10,
    letterSpacing: 1,
    fontWeight: "700",
  },
  flightNum: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "700",
  },
  routeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  routeCol: { alignItems: "center", minWidth: 70 },
  routeCode: { color: colors.textPrimary, fontSize: 28, fontWeight: "800" },
  routeMiddle: { flexDirection: "row", alignItems: "center", gap: 4, flex: 1, justifyContent: "center" },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary },
  line: { width: 24, height: 1.5, backgroundColor: colors.primary, opacity: 0.6 },
  notchRow: { flexDirection: "row", alignItems: "center", marginVertical: spacing.md },
  notch: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.background,
  },
  notchLeft: { marginLeft: -spacing.lg - 10 },
  notchRight: { marginRight: -spacing.lg - 10 },
  dashed: {
    flex: 1,
    borderTopWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "rgba(142,142,147,0.4)",
  },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  cell: {
    width: "50%",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  cellValue: { color: colors.textPrimary, fontSize: 13, fontWeight: "600" },
  footer: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    
    alignItems: "flex-end",
  },
  footerText: { color: colors.textSecondary, fontSize: 11 },
});
