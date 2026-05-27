import { useMemo, useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import AppButton from "../ui/AppButton";
import type { DailyCheckInInput } from "../../features/checkins/types";
import AppText from "../ui/AppText";
import SymptomSliderCard from "./SymptomSliderCard";
import { deriveEmotionallySafeErrors } from "../../lib/operational-excellence/calm-error-states/deriveEmotionallySafeErrors";
import { deriveReflectionSupport } from "../../features/today/reflection-regulation";

const SLEEP_PRESETS = ["5", "6", "7", "8"];
const WATER_PRESETS = ["4", "6", "8"];
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
  saveMomentTitle?: string;
  saveMomentBody?: string;
  postSaveInsight?: string;
  onViewInsights: () => void;
  saveFooterText?: string;
  supportMode?: "default" | "low-energy";
  compressionMode?: "standard" | "reduced";
  noteStarterLimit?: number;
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

function getHydrationNote(waterGlasses: string) {
  const value = Number(waterGlasses.trim());

  if (!Number.isFinite(value) || waterGlasses.trim().length === 0 || value < 0) {
    return null;
  }

  if (value <= 2) {
    return "Hydration looks lower today.";
  }

  if (value <= 5) {
    return "Hydration is moderate today.";
  }

  return "Hydration has stayed more consistent today.";
}

export default function DailyCheckInCard({
  draft,
  onChange,
  saveState,
  onSave,
  saveMomentTitle,
  saveMomentBody,
  postSaveInsight,
  onViewInsights,
  saveFooterText,
  supportMode = "default",
  compressionMode = "standard",
  noteStarterLimit = 3,
}: DailyCheckInCardProps) {
  const [showBodySignals, setShowBodySignals] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const saveErrorCopy = deriveEmotionallySafeErrors({ category: "sync", retryable: true });
  const reduced = compressionMode === "reduced";
  const reflectionSupport = useMemo(
    () =>
      deriveReflectionSupport({
        fatigue: draft.fatigue,
        stress: draft.stress,
        brainFog: draft.brain_fog,
        mood: draft.mood,
        lowEnergyMode: supportMode === "low-energy",
        compressionMode,
        hasExistingNotes: draft.notes.trim().length > 0,
        noteStarterLimit,
      }),
    [
      compressionMode,
      draft.brain_fog,
      draft.fatigue,
      draft.mood,
      draft.notes,
      draft.stress,
      noteStarterLimit,
      supportMode,
    ],
  );
  const activeReflectionPrompt = reflectionSupport.prompt;
  const hydrationNote = getHydrationNote(draft.water_glasses);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <AppText style={styles.title}>Daily check-in</AppText>
          <AppText style={styles.subtitle}>
            {supportMode === "low-energy"
              ? "Use the shortest check-in that works today."
              : reduced
                ? "Start with the basics."
                : "Start with the basics. Add details only if you want."}
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
          <AppText style={styles.sectionHelper}>
            {supportMode === "low-energy"
              ? "Start with the clearest signals and skip the rest if needed."
              : "Start with fatigue, mood, and stress."}
          </AppText>
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
              {reduced
                ? "Add more only if it feels useful."
                : "Add pain, brain fog, mobility, sleep, and hydration if helpful."}
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
              <View style={styles.quickChoices}>
                {SLEEP_PRESETS.map((option) => (
                  <Pressable
                    key={option}
                    onPress={() => onChange({ ...draft, sleep_hours: option })}
                    style={({ pressed }) => [
                      styles.quickChoice,
                      draft.sleep_hours === option && styles.quickChoiceActive,
                      pressed && styles.quickChoicePressed,
                    ]}
                  >
                    <AppText style={[styles.quickChoiceText, draft.sleep_hours === option && styles.quickChoiceTextActive]}>
                      {option}h
                    </AppText>
                  </Pressable>
                ))}
              </View>
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
              <AppText style={styles.fieldLabel}>Hydration</AppText>
              <View style={styles.quickChoices}>
                {WATER_PRESETS.map((option) => (
                  <Pressable
                    key={option}
                    onPress={() => onChange({ ...draft, water_glasses: option })}
                    style={({ pressed }) => [
                      styles.quickChoice,
                      draft.water_glasses === option && styles.quickChoiceActive,
                      pressed && styles.quickChoicePressed,
                    ]}
                  >
                    <AppText style={[styles.quickChoiceText, draft.water_glasses === option && styles.quickChoiceTextActive]}>
                      {option}
                    </AppText>
                  </Pressable>
                ))}
              </View>
              <TextInput
                keyboardType="number-pad"
                placeholder="e.g. 6"
                placeholderTextColor="#9ca3af"
                value={draft.water_glasses}
                onChangeText={(water_glasses) => onChange({ ...draft, water_glasses })}
                style={styles.fieldInput}
              />
              {hydrationNote ? <AppText style={styles.fieldNote}>{hydrationNote}</AppText> : null}
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
            <AppText style={styles.sectionTitle}>Today's reflection</AppText>
            <AppText style={styles.sectionHelper}>{reflectionSupport.helper}</AppText>
          </View>
          <AppText style={styles.sectionToggleText}>{showNotes ? "Hide" : "Add"}</AppText>
        </Pressable>

        {showNotes ? (
          <View style={styles.sectionContent}>
            <View style={styles.reflectionPromptCard}>
              <AppText style={styles.reflectionPromptLabel}>Today's question</AppText>
              <AppText style={styles.reflectionPromptText}>{activeReflectionPrompt.question}</AppText>
            </View>
            <View style={styles.fieldGroup}>
              <AppText style={styles.fieldLabel}>Your note</AppText>
              <TextInput
                multiline
                placeholder={activeReflectionPrompt.placeholder}
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
          label={saveState === "saving" ? "Saving..." : reduced ? "Save" : "Save Check-In"}
          onPress={onSave}
          disabled={saveState === "saving"}
        />
        {saveState === "saved" ? (
          <View style={styles.savedCard}>
            <View style={styles.successRow}>
              <AppText style={styles.successBadge}>✓</AppText>
              <View style={styles.successCopy}>
                <AppText style={styles.successText}>{saveMomentTitle ?? "Checked in"}</AppText>
                <AppText style={styles.successSubtext}>{saveMomentBody ?? "Saved."}</AppText>
              </View>
            </View>
            {postSaveInsight ? <AppText style={styles.savedInsight}>{postSaveInsight}</AppText> : null}
            {saveFooterText ? <AppText style={styles.savedReturnText}>{saveFooterText}</AppText> : null}
            <AppButton label="View Insights" onPress={onViewInsights} variant="secondary" />
          </View>
        ) : null}
        {saveState === "error" ? (
          <AppText style={styles.errorText}>{saveErrorCopy.message}</AppText>
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
  quickChoices: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  quickChoice: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#ead9cb",
    backgroundColor: "#ffffff",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  quickChoiceActive: {
    borderColor: "#e8751a",
    backgroundColor: "#fff0e2",
  },
  quickChoicePressed: {
    opacity: 0.86,
  },
  quickChoiceText: {
    color: "#8b6a4f",
    fontSize: 13,
    fontWeight: "600",
  },
  quickChoiceTextActive: {
    color: "#9a4a11",
  },
  fieldLabel: {
    fontSize: 14,
    color: "#4b5563",
    lineHeight: 20,
  },
  fieldNote: {
    fontSize: 13,
    lineHeight: 18,
    color: "#6b7280",
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
    lineHeight: 24,
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
  reflectionPromptCard: {
    borderRadius: 14,
    backgroundColor: "#fff6ee",
    borderWidth: 1,
    borderColor: "#f4dfcb",
    paddingHorizontal: 12,
    paddingVertical: 11,
    gap: 5,
  },
  reflectionPromptLabel: {
    fontSize: 11,
    lineHeight: 15,
    color: "#9a6a43",
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  reflectionPromptText: {
    color: "#7c5a40",
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "700",
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
  savedReturnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#4b5563",
  },
  errorText: {
    fontSize: 14,
    color: "#b91c1c",
  },
});
