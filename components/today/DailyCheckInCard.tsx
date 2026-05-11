import { useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import AppButton from "../ui/AppButton";
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
  onSave: () => void;
  postSaveInsight: string;
  onViewInsights: () => void;
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
  onSave,
  postSaveInsight,
  onViewInsights,
}: DailyCheckInCardProps) {
  const [showBodySignals, setShowBodySignals] = useState(false);
  const [showNotes, setShowNotes] = useState(false);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <AppText style={styles.title}>Daily check-in</AppText>
          <AppText style={styles.subtitle}>
            Start with the basics. Add details only if you want.
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

      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <AppText style={styles.sectionTitle}>How are you today?</AppText>
          <AppText style={styles.sectionHelper}>Start with fatigue, mood, and stress.</AppText>
        </View>

        <SymptomSliderCard
          label="Fatigue"
          value={draft.fatigue}
          onChange={(fatigue) => onChange({ ...draft, fatigue })}
          lowLabel="0 = No fatigue"
          highLabel="5 = Extreme fatigue"
          midpointLabel="Moderate"
        />
        <SymptomSliderCard
          label="Mood"
          value={draft.mood}
          onChange={(mood) => onChange({ ...draft, mood })}
          lowLabel="0 = Very low"
          highLabel="5 = Very good"
          midpointLabel="Okay"
        />
        <SymptomSliderCard
          label="Stress"
          value={draft.stress}
          onChange={(stress) => onChange({ ...draft, stress })}
          lowLabel="0 = No stress"
          highLabel="5 = Very high stress"
          midpointLabel="Moderate"
        />
      </View>

      <View style={styles.sectionCard}>
        <Pressable
          onPress={() => setShowBodySignals((current) => !current)}
          style={({ pressed }) => [styles.sectionToggle, pressed && styles.sectionTogglePressed]}
        >
          <View style={styles.sectionToggleHeader}>
            <AppText style={styles.sectionTitle}>Body signals</AppText>
            <AppText style={styles.sectionHelper}>
              Add pain, brain fog, mobility, sleep, and hydration if helpful.
            </AppText>
          </View>
          <AppText style={styles.sectionToggleText}>{showBodySignals ? "Hide" : "Add"}</AppText>
        </Pressable>

        {showBodySignals ? (
          <View style={styles.sectionContent}>
            <SymptomSliderCard
              label="Pain"
              value={draft.pain}
              onChange={(pain) => onChange({ ...draft, pain })}
              lowLabel="0 = No pain"
              highLabel="5 = Severe pain"
              midpointLabel="Moderate"
            />
            <SymptomSliderCard
              label="Brain fog"
              value={draft.brain_fog}
              onChange={(brain_fog) => onChange({ ...draft, brain_fog })}
              lowLabel="0 = Clear"
              highLabel="5 = Very foggy"
              midpointLabel="Moderate"
            />
            <SymptomSliderCard
              label="Mobility"
              value={draft.mobility}
              onChange={(mobility) => onChange({ ...draft, mobility })}
              lowLabel="0 = No issues"
              highLabel="5 = Severe difficulty"
              midpointLabel="Moderate"
            />

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
        ) : null}
      </View>

      <View style={styles.sectionCard}>
        <Pressable
          onPress={() => setShowNotes((current) => !current)}
          style={({ pressed }) => [styles.sectionToggle, pressed && styles.sectionTogglePressed]}
        >
          <View style={styles.sectionToggleHeader}>
            <AppText style={styles.sectionTitle}>Notes</AppText>
            <AppText style={styles.sectionHelper}>
              Add symptoms or a short reflection if you want to remember more.
            </AppText>
          </View>
          <AppText style={styles.sectionToggleText}>{showNotes ? "Hide" : "Add"}</AppText>
        </Pressable>

        {showNotes ? (
          <View style={styles.sectionContent}>
            <View style={styles.fieldGroup}>
              <AppText style={styles.fieldLabel}>Reflection notes</AppText>
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
        ) : null}
      </View>

      <View style={styles.actionSection}>
        <AppButton
          label={saveState === "saving" ? "Saving..." : "Save Check-In"}
          onPress={onSave}
          disabled={saveState === "saving"}
        />
        {saveState === "saved" ? (
          <View style={styles.savedCard}>
            <View style={styles.successRow}>
              <AppText style={styles.successBadge}>✓</AppText>
              <View style={styles.successCopy}>
                <AppText style={styles.successText}>Saved</AppText>
                <AppText style={styles.successSubtext}>You&apos;re building your baseline</AppText>
              </View>
            </View>
            <AppText style={styles.savedInsight}>{postSaveInsight}</AppText>
            <AppButton label="View Insights" onPress={onViewInsights} variant="secondary" />
          </View>
        ) : null}
        {saveState === "error" ? (
          <AppText style={styles.errorText}>We couldn’t save your check-in. Please try again.</AppText>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
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
    lineHeight: 22,
  },
  status: {
    color: "#e8751a",
    fontSize: 14,
    fontWeight: "600",
  },
  sectionCard: {
    backgroundColor: "#fffaf6",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#f3dfd1",
    padding: 16,
    gap: 14,
  },
  sectionHeader: {
    gap: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
  },
  sectionHelper: {
    fontSize: 13,
    lineHeight: 18,
    color: "#6b7280",
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
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5d6cb",
    backgroundColor: "#fffaf6",
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  actionSection: {
    gap: 10,
    paddingBottom: 16,
  },
  savedCard: {
    backgroundColor: "#f6fbf7",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#d7f0dc",
    padding: 14,
    gap: 12,
  },
  sectionToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  sectionTogglePressed: {
    opacity: 0.82,
  },
  sectionToggleHeader: {
    flex: 1,
    gap: 4,
  },
  sectionToggleText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#c25d10",
  },
  sectionContent: {
    gap: 12,
  },
  successRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  successCopy: {
    flex: 1,
    gap: 2,
  },
  successBadge: {
    width: 22,
    height: 22,
    borderRadius: 999,
    textAlign: "center",
    textAlignVertical: "center",
    overflow: "hidden",
    backgroundColor: "#dcfce7",
    color: "#166534",
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 22,
  },
  successText: {
    fontSize: 14,
    color: "#166534",
    fontWeight: "600",
  },
  successSubtext: {
    fontSize: 13,
    lineHeight: 18,
    color: "#4b5563",
  },
  savedInsight: {
    fontSize: 13,
    lineHeight: 20,
    color: "#6b7280",
  },
  errorText: {
    fontSize: 14,
    color: "#b91c1c",
  },
});
