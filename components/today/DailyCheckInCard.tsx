import { StyleSheet, TextInput, View } from "react-native";
import type { DailyCheckInInput } from "../../features/checkins/types";
import AppText from "../ui/AppText";
import SymptomSliderCard from "./SymptomSliderCard";

export type DailyCheckInDraft = {
  fatigue: number | null;
  pain: number | null;
  brain_fog: number | null;
  mood: number | null;
  mobility: number | null;
  stress: number | null;
  sleep_hours: string;
  water_glasses: string;
  notes: string;
};

type DailyCheckInCardProps = {
  draft: DailyCheckInDraft;
  onChange: (next: DailyCheckInDraft) => void;
  saveState: "idle" | "saving" | "saved" | "error";
};

export function normalizeCheckInInput(draft: DailyCheckInDraft): DailyCheckInInput {
  const sleepHours = draft.sleep_hours.trim();
  const waterGlasses = draft.water_glasses.trim();

  return {
    fatigue: draft.fatigue,
    pain: draft.pain,
    brain_fog: draft.brain_fog,
    mood: draft.mood,
    mobility: draft.mobility,
    stress: draft.stress,
    sleep_hours: sleepHours ? Number(sleepHours) : null,
    water_glasses: waterGlasses ? Number(waterGlasses) : null,
    notes: draft.notes.trim() || null,
    mood_tags: [],
  };
}

export function getEmptyCheckInDraft(): DailyCheckInDraft {
  return {
    fatigue: null,
    pain: null,
    brain_fog: null,
    mood: null,
    mobility: null,
    stress: null,
    sleep_hours: "",
    water_glasses: "",
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
          <AppText style={styles.subtitle}>
            Track symptoms, sleep, hydration, and a quick reflection for today.
          </AppText>
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
        label="Fatigue"
        value={draft.fatigue}
        onChange={(fatigue) => onChange({ ...draft, fatigue })}
      />
      <SymptomSliderCard
        label="Mood"
        value={draft.mood}
        onChange={(mood) => onChange({ ...draft, mood })}
      />
      <SymptomSliderCard
        label="Stress"
        value={draft.stress}
        onChange={(stress) => onChange({ ...draft, stress })}
      />
      <SymptomSliderCard
        label="Pain"
        value={draft.pain}
        onChange={(pain) => onChange({ ...draft, pain })}
      />
      <SymptomSliderCard
        label="Brain fog"
        value={draft.brain_fog}
        onChange={(brain_fog) => onChange({ ...draft, brain_fog })}
      />
      <SymptomSliderCard
        label="Mobility"
        value={draft.mobility}
        onChange={(mobility) => onChange({ ...draft, mobility })}
      />

      <View style={styles.habitsCard}>
        <AppText style={styles.sectionTitle}>Sleep and habits</AppText>
        <View style={styles.fieldGroup}>
          <AppText style={styles.fieldLabel}>Hours of sleep last night</AppText>
          <TextInput
            keyboardType="decimal-pad"
            placeholder="e.g. 7.5"
            placeholderTextColor="#9ca3af"
            value={draft.sleep_hours}
            onChangeText={(sleep_hours) => onChange({ ...draft, sleep_hours })}
            style={styles.fieldInput}
          />
        </View>
        <View style={styles.fieldGroup}>
          <AppText style={styles.fieldLabel}>Water glasses today</AppText>
          <TextInput
            keyboardType="number-pad"
            placeholder="e.g. 6"
            placeholderTextColor="#9ca3af"
            value={draft.water_glasses}
            onChangeText={(water_glasses) => onChange({ ...draft, water_glasses })}
            style={styles.fieldInput}
          />
        </View>
      </View>

      <View style={styles.notesCard}>
        <AppText style={styles.sectionTitle}>Reflection notes</AppText>
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
  habitsCard: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#f3dfd1",
    padding: 16,
    gap: 10,
  },
  notesCard: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#f3dfd1",
    padding: 16,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 14,
    color: "#4b5563",
  },
  fieldInput: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5d6cb",
    backgroundColor: "#fffaf6",
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: "#374151",
  },
  notesInput: {
    minHeight: 108,
    fontSize: 16,
    color: "#374151",
  },
});
