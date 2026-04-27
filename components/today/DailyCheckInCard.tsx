import { StyleSheet, TextInput, View } from "react-native";
import type { DailyCheckInInput } from "../../features/checkins/types";
import AppText from "../ui/AppText";
import SymptomSliderCard from "./SymptomSliderCard";

export type DailyCheckInDraft = {
  mood: number | null;
  energy: number | null;
  pain: number | null;
  fatigue: number | null;
  mobility: number | null;
  notes: string;
};

type DailyCheckInCardProps = {
  draft: DailyCheckInDraft;
  onChange: (next: DailyCheckInDraft) => void;
  saveState: "idle" | "saving" | "saved" | "error";
};

export function normalizeCheckInInput(draft: DailyCheckInDraft): DailyCheckInInput {
  return {
    mood: draft.mood,
    energy: draft.energy,
    pain: draft.pain,
    fatigue: draft.fatigue,
    mobility: draft.mobility,
    notes: draft.notes.trim() || null,
  };
}

export function getEmptyCheckInDraft(): DailyCheckInDraft {
  return {
    mood: null,
    energy: null,
    pain: null,
    fatigue: null,
    mobility: null,
    notes: "",
  };
}

export default function DailyCheckInCard({
  draft,
  onChange,
  saveState,
}: DailyCheckInCardProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <AppText style={styles.title}>Daily check-in</AppText>
          <AppText style={styles.subtitle}>A quick snapshot of how you feel today.</AppText>
        </View>
        <AppText style={styles.status}>
          {saveState === "saving"
            ? "Saving..."
            : saveState === "saved"
              ? "Saved"
              : saveState === "error"
                ? "Not saved"
                : "Ready"}
        </AppText>
      </View>

      <SymptomSliderCard
        label="Mood"
        value={draft.mood}
        onChange={(mood) => onChange({ ...draft, mood })}
      />
      <SymptomSliderCard
        label="Energy"
        value={draft.energy}
        onChange={(energy) => onChange({ ...draft, energy })}
      />
      <SymptomSliderCard
        label="Pain"
        value={draft.pain}
        onChange={(pain) => onChange({ ...draft, pain })}
      />
      <SymptomSliderCard
        label="Fatigue"
        value={draft.fatigue}
        onChange={(fatigue) => onChange({ ...draft, fatigue })}
      />
      <SymptomSliderCard
        label="Mobility"
        value={draft.mobility}
        onChange={(mobility) => onChange({ ...draft, mobility })}
      />

      <View style={styles.notesCard}>
        <AppText style={styles.notesLabel}>Notes</AppText>
        <TextInput
          multiline
          placeholder="Anything you want to remember about today?"
          placeholderTextColor="#9ca3af"
          value={draft.notes}
          onChangeText={(notes) => onChange({ ...draft, notes })}
          style={styles.notesInput}
          textAlignVertical="top"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 16,
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1f2937",
  },
  subtitle: {
    color: "#6b7280",
  },
  status: {
    color: "#e8751a",
    fontSize: 14,
    fontWeight: "600",
  },
  notesCard: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#f3dfd1",
    padding: 16,
    gap: 10,
  },
  notesLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
  },
  notesInput: {
    minHeight: 108,
    fontSize: 16,
    color: "#374151",
  },
});
