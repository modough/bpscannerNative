import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useScanHistory } from "../../src/hooks/useScanHistory";
import { parseBoardingPass } from "../../src/lib/boardingPassParser";
import { colors, radius, spacing } from "../../src/theme";

type SortKey = "sequence" | "lastname" | "seat";
type SortDir = "asc" | "desc";

export default function PassengerList() {
  const { rawItems, totalCount } = useScanHistory();
  const [sortKey, setSortKey] = useState<SortKey>("sequence");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const parsed = useMemo(() => {
    return rawItems
      .map((it) => ({ item: it, bp: parseBoardingPass(it.data, "") }))
      .filter((p) => !!p.bp);
  }, [rawItems]);

  const sorted = useMemo(() => {
    const arr = [...parsed];
    arr.sort((a, b) => {
      let av = "";
      let bv = "";
      if (sortKey === "sequence") {
        av = a.bp!.sequenceNumber;
        bv = b.bp!.sequenceNumber;
      } else if (sortKey === "lastname") {
        av = a.bp!.lastName;
        bv = b.bp!.lastName;
      } else {
        av = a.bp!.seat;
        bv = b.bp!.seat;
      }
      const r = av.localeCompare(bv, undefined, { numeric: true });
      return sortDir === "asc" ? r : -r;
    });
    return arr;
  }, [parsed, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const arrow = (key: SortKey) =>
    sortKey === key ? (sortDir === "asc" ? " ↑" : " ↓") : "";

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Passengers</Text>
        <Text style={styles.subtitle}>{totalCount} boarded</Text>
      </View>

      {/* Header row */}
      <View style={styles.tableHeader}>
        <HeaderCell
          label={`Seq${arrow("sequence")}`}
          icon="barcode-outline"
          onPress={() => toggleSort("sequence")}
          flex={1.2}
          testID="sort-sequence"
        />
        <HeaderCell
          label={`Name${arrow("lastname")}`}
          icon="person-outline"
          onPress={() => toggleSort("lastname")}
          flex={3}
          testID="sort-lastname"
        />
        <HeaderCell
          label={`Seat${arrow("seat")}`}
          icon="grid-outline"
          onPress={() => toggleSort("seat")}
          flex={1}
          testID="sort-seat"
        />
      </View>

      {sorted.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="people-outline" size={40} color={colors.textSecondary} />
          <Text style={styles.emptyTxt}>No passengers yet</Text>
          <Text style={styles.emptyHint}>Scanned passengers will appear here</Text>
        </View>
      ) : (
        <FlatList
          data={sorted}
          keyExtractor={(p) => p.item.id}
          contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: spacing.lg }}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) => (
            <View style={styles.row} testID={`passenger-row-${item.bp!.sequenceNumber}`}>
              <Text style={[styles.cell, { flex: 1.2, color: colors.primary, fontFamily: "Courier", fontWeight: "700" }]}>
                {item.bp!.sequenceNumber || "—"}
              </Text>
              <Text style={[styles.cell, { flex: 3 }]} numberOfLines={1}>
                {`${item.bp!.firstName} ${item.bp!.lastName}`.trim() || "—"}
              </Text>
              <Text style={[styles.cell, { flex: 1, fontWeight: "700" }]}>
                {item.bp!.seat || "—"}
              </Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

function HeaderCell({
  label,
  icon,
  onPress,
  flex,
  testID,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  flex: number;
  testID: string;
}) {
  return (
    <TouchableOpacity
      style={[styles.headerCell, { flex }]}
      onPress={onPress}
      testID={testID}
    >
      <Ionicons name={icon} size={12} color={colors.textSecondary} />
      <Text style={styles.headerLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  title: { color: colors.textPrimary, fontSize: 24, fontWeight: "800" },
  subtitle: { color: colors.textSecondary, fontSize: 13, marginTop: 2 },
  tableHeader: {
    flexDirection: "row",
    marginHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  headerCell: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  headerLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  row: {
    flexDirection: "row",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    alignItems: "center",
  },
  cell: {
    color: colors.textPrimary,
    fontSize: 13,
  },
  separator: { height: spacing.xs },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingBottom: 80,
  },
  emptyTxt: { color: colors.textPrimary, fontSize: 16, fontWeight: "600" },
  emptyHint: { color: colors.textSecondary, fontSize: 12 },
});
