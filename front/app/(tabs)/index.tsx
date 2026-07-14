import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import BingoBoard from "@/src/components/BingoBoard";
import { FlightConfig, useFlight } from "../../src/context/FlightContext";
import { useScanHistory } from "../../src/hooks/useScanHistory";
import { colors, radius, spacing } from "@/src/theme";

export default function FlightConfigScreen() {
  const { flight, setFlight } = useFlight();
  const { rawItems, totalCount, clearHistory } = useScanHistory();
  const [form, setForm] = useState<FlightConfig>(flight);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setForm(flight);
  }, [flight]);

  function updateField(key: keyof FlightConfig, value: string) {
    setForm((prev) => ({ ...prev, [key]: value.toUpperCase() }));
  }

  async function save() {
    await setFlight(form);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2000);
  }

  const hasScans = totalCount > 0;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Flight Configuration</Text>
              <Text style={styles.subtitle}>
                {hasScans
                  ? `${totalCount} passenger${totalCount === 1 ? "" : "s"} scanned`
                  : "Set up your flight to start scanning"}
              </Text>
            </View>
            {hasScans && (
              <TouchableOpacity
                onPress={clearHistory}
                style={styles.clearBtn}
                testID="btn-clear-history"
              >
                <Ionicons name="trash-outline" size={16} color={colors.error} />
                <Text style={styles.clearTxt}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>

          {!hasScans ? (
            <View style={styles.form}>
              <Field
                label="Airline Code (e.g. FR)"
                value={form.airlineCode}
                onChange={(v) => updateField("airlineCode", v)}
                testID="input-airline-code"
                maxLength={3}
              />
              <Field
                label="Flight Number (e.g. 4408)"
                value={form.flightNumber}
                onChange={(v) => updateField("flightNumber", v)}
                testID="input-flight-number"
                keyboardType="numeric"
                maxLength={5}
              />
              <Field
                label="Routing (e.g. XCRRAK)"
                value={form.routing}
                onChange={(v) => updateField("routing", v)}
                testID="input-routing"
                maxLength={6}
              />
              <Field
                label="Date (YYYY-MM-DD)"
                value={form.date}
                onChange={(v) => setForm((p) => ({ ...p, date: v }))}
                testID="input-date"
                placeholder="2026-02-15"
                autoCapitalize="none"
              />

              <TouchableOpacity
                style={styles.saveBtn}
                onPress={save}
                testID="btn-save-flight"
              >
                <Ionicons name="save-outline" size={18} color="#000" />
                <Text style={styles.saveTxt}>Save Flight</Text>
              </TouchableOpacity>

              {success && (
                <View style={styles.successBanner} testID="flight-save-success">
                  <Ionicons
                    name="checkmark-circle"
                    size={18}
                    color={colors.success}
                  />
                  <Text style={styles.successTxt}>
                    Flight initialized successfully!
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <View style={{ gap: spacing.lg }}>
              <View style={styles.flightSummary} testID="flight-summary">
                <Text style={styles.summaryTitle}>
                  {flight.airlineCode}
                  {flight.flightNumber}
                </Text>
                <Text style={styles.summarySub}>
                  {flight.routing.substring(0, 3)} →{" "}
                  {flight.routing.substring(3, 6)} · {flight.date}
                </Text>
              </View>
              <BingoBoard items={rawItems} />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({
  label,
  value,
  onChange,
  testID,
  placeholder,
  keyboardType,
  maxLength,
  autoCapitalize = "characters",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  testID: string;
  placeholder?: string;
  keyboardType?: "default" | "numeric";
  maxLength?: number;
  autoCapitalize?: "none" | "characters";
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        maxLength={maxLength}
        style={styles.input}
        testID={testID}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingBottom: 100, gap: spacing.lg },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  title: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 4,
  },
  clearBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.error,
    backgroundColor: colors.errorBg,
  },
  clearTxt: { color: colors.error, fontSize: 12, fontWeight: "600" },
  form: { gap: spacing.lg },
  field: { gap: 6 },
  label: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: Platform.OS === "ios" ? 14 : 10,
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "600",
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: radius.md,
    marginTop: spacing.sm,
  },
  saveTxt: { color: "#000", fontSize: 16, fontWeight: "700" },
  successBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.successBg,
    borderWidth: 1,
    borderColor: colors.success,
  },
  successTxt: { color: colors.success, fontSize: 13, fontWeight: "600" },
  flightSummary: {
    padding: spacing.lg,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "rgba(255,159,10,0.3)",
  },
  summaryTitle: {
    color: colors.primary,
    fontSize: 28,
    fontWeight: "800",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  summarySub: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 4,
    fontWeight: "600",
  },
});
