import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
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

import { useFlight } from "../../src/context/FlightContext";
import { useScanHistory } from "../../src/hooks/useScanHistory";
import {
    dateToJulian,
    formatDateToDDMMMYY,
} from "../../src/lib/boardingPassParser";
import { colors, radius, spacing } from "@/src/theme";

interface ManualForm {
  firstName: string;
  lastName: string;
  pnr: string;
  seat: string;
  sequenceNumber: string;
}

const INITIAL: ManualForm = {
  firstName: "",
  lastName: "",
  pnr: "",
  seat: "",
  sequenceNumber: "",
};

function buildBoardingPass(form: ManualForm, flight: {
  airlineCode: string;
  flightNumber: string;
  routing: string;
  date: string;
}): string {
  // Minimal IATA-style BCBP synthesis that our parser can re-parse.
  // Format: M1LAST/FIRST<space>PNR<space> ROUTING CARRIER FLIGHT JULIANY<seat><seq>
  const name = `M1${form.lastName}/${form.firstName}`;
  const pnr = form.pnr ? form.pnr.padEnd(6, "X") : "ABCDEF";
  const routing = flight.routing.padEnd(6, "X");
  const carrier = flight.airlineCode.padEnd(3, " ");
  const flightNum = flight.flightNumber.padStart(4, "0");
  const julian = flight.date ? dateToJulian(flight.date) : "001";
  const seatNum = form.seat.replace(/[^0-9]/g, "").padStart(3, "0");
  const seatLetter = (form.seat.match(/[A-Z]/)?.[0] || "A").toUpperCase();
  const seq = form.sequenceNumber.padStart(4, "0");

  return `${name} ${pnr} ${routing}${carrier}${flightNum} ${julian}Y${seatNum}${seatLetter}${seq}`;
}

export default function ManualEntryScreen() {
  const { flight } = useFlight();
  const { addScan } = useScanHistory();
  const [form, setForm] = useState<ManualForm>(INITIAL);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const update = (k: keyof ManualForm, v: string) =>
    setForm((p) => ({
      ...p,
      [k]: k === "firstName" || k === "lastName" ? v.toUpperCase() : v.toUpperCase(),
    }));

  async function submit() {
    if (!flight.airlineCode || !flight.flightNumber || !flight.routing) {
      setResult({ ok: false, msg: "Configure flight first" });
      return;
    }
    if (
      !form.firstName ||
      !form.lastName ||
      !form.seat ||
      !form.sequenceNumber
    ) {
      setResult({ ok: false, msg: "Missing required fields" });
      return;
    }

    const raw = buildBoardingPass(form, flight);
    const res = await addScan(raw);
    if (res.duplicate) {
      setResult({ ok: false, msg: "Already scanned!" });
    } else if (!res.success) {
      setResult({ ok: false, msg: "Failed to add entry" });
    } else {
      setResult({ ok: true, msg: "Passenger added" });
      setForm(INITIAL);
    }
    setTimeout(() => setResult(null), 3500);
  }

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
          <Text style={styles.title}>Manual Entry</Text>
          <Text style={styles.subtitle}>
            {flight.airlineCode
              ? `${flight.airlineCode}${flight.flightNumber} · ${flight.routing} · ${formatDateToDDMMMYY(flight.date)}`
              : "No flight configured"}
          </Text>

          <View style={styles.row}>
            <Field
              label="First Name"
              value={form.firstName}
              onChange={(v) => update("firstName", v)}
              testID="input-first-name"
            />
            <Field
              label="Last Name"
              value={form.lastName}
              onChange={(v) => update("lastName", v)}
              testID="input-last-name"
            />
          </View>

          <Field
            label="PNR"
            value={form.pnr}
            onChange={(v) => update("pnr", v)}
            testID="input-pnr"
            maxLength={6}
          />

          <View style={styles.row}>
            <Field
              label="Seat (e.g. 12A)"
              value={form.seat}
              onChange={(v) => update("seat", v)}
              testID="input-seat"
              maxLength={4}
            />
            <Field
              label="Sequence #"
              value={form.sequenceNumber}
              onChange={(v) => update("sequenceNumber", v)}
              testID="input-sequence"
              keyboardType="numeric"
              maxLength={4}
            />
          </View>

          <TouchableOpacity
            style={styles.submitBtn}
            onPress={submit}
            testID="btn-submit-manual"
          >
            <Ionicons name="add-circle-outline" size={18} color="#000" />
            <Text style={styles.submitTxt}>Add Passenger</Text>
          </TouchableOpacity>

          {result && (
            <View
              style={[
                styles.banner,
                {
                  backgroundColor: result.ok ? colors.successBg : colors.errorBg,
                  borderColor: result.ok ? colors.success : colors.error,
                },
              ]}
              testID="manual-result"
            >
              <Ionicons
                name={result.ok ? "checkmark-circle" : "alert-circle"}
                size={18}
                color={result.ok ? colors.success : colors.error}
              />
              <Text
                style={{
                  color: result.ok ? colors.success : colors.error,
                  fontWeight: "600",
                }}
              >
                {result.msg}
              </Text>
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
  keyboardType,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  testID: string;
  keyboardType?: "default" | "numeric";
  maxLength?: number;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        autoCapitalize="characters"
        keyboardType={keyboardType}
        maxLength={maxLength}
        placeholderTextColor={colors.textSecondary}
        style={styles.input}
        testID={testID}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingBottom: 120, gap: spacing.md },
  title: { color: colors.textPrimary, fontSize: 22, fontWeight: "800" },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    marginBottom: spacing.md,
  },
  row: { flexDirection: "row", gap: spacing.md },
  field: { flex: 1, gap: 4, marginBottom: spacing.sm },
  label: {
    color: colors.textSecondary,
    fontSize: 10,
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
    fontSize: 15,
    fontWeight: "600",
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: radius.md,
    marginTop: spacing.md,
  },
  submitTxt: { color: "#000", fontWeight: "700", fontSize: 15 },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    marginTop: spacing.sm,
  },
});
