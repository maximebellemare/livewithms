import { useEffect, useMemo, useState } from "react";
import { router } from "expo-router";
import { ScrollView, StyleSheet, View } from "react-native";
import AppButton from "../../../../components/ui/AppButton";
import AppScreen from "../../../../components/ui/AppScreen";
import AppText from "../../../../components/ui/AppText";

type Program = {
  id: string;
  title: string;
  description: string;
  durationLabel: string;
  durationSeconds: number;
  steps: string[];
};

const PROGRAMS: Program[] = [
  {
    id: "reset",
    title: "5-minute reset",
    description: "A short reset to help you slow things down and steady your energy.",
    durationLabel: "5 minutes",
    durationSeconds: 5 * 60,
    steps: [
      "Sit or stand in a comfortable position.",
      "Let your shoulders drop and unclench your jaw.",
      "Take a slow breath in for 4 and out for 6.",
      "Notice one thing that feels supportive right now.",
      "Choose one small next step for the rest of your day.",
    ],
  },
  {
    id: "breathing",
    title: "Breathing exercise",
    description: "A simple breathing pattern to help create a little more calm.",
    durationLabel: "3 minutes",
    durationSeconds: 3 * 60,
    steps: [
      "Breathe in gently through your nose for 4.",
      "Pause for a moment if it feels comfortable.",
      "Exhale slowly for 6.",
      "Repeat at a pace that feels easy, not forced.",
      "When you finish, notice whether your body feels even slightly softer.",
    ],
  },
  {
    id: "calm",
    title: "Calm your nervous system",
    description: "A few grounding steps for days that feel overstimulating or heavy.",
    durationLabel: "4 minutes",
    durationSeconds: 4 * 60,
    steps: [
      "Place both feet on the floor or notice your body being supported.",
      "Name 3 things you can see and 2 things you can feel.",
      "Take one slower exhale than your inhale.",
      "Relax your hands, forehead, and shoulders.",
      "Remind yourself: this moment can be taken one step at a time.",
    ],
  },
];

function formatTime(secondsRemaining: number) {
  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export default function ProgramsScreen() {
  const [activeTimerId, setActiveTimerId] = useState<string | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);

  const activeProgram = useMemo(
    () => PROGRAMS.find((program) => program.id === activeTimerId) ?? null,
    [activeTimerId],
  );

  useEffect(() => {
    if (!activeTimerId || secondsRemaining === null) {
      return;
    }

    if (secondsRemaining <= 0) {
      setActiveTimerId(null);
      setSecondsRemaining(null);
      return;
    }

    const timeoutId = setTimeout(() => {
      setSecondsRemaining((current) => (current === null ? current : current - 1));
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [activeTimerId, secondsRemaining]);

  const startTimer = (program: Program) => {
    setActiveTimerId(program.id);
    setSecondsRemaining(program.durationSeconds);
  };

  const clearTimer = () => {
    setActiveTimerId(null);
    setSecondsRemaining(null);
  };

  return (
    <AppScreen
      title="Programs"
      subtitle="Simple guided tools for steadier days, calmer moments, and a little more support."
    >
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.navCard}>
          <AppText style={styles.cardTitle}>Move between sections</AppText>
          <View style={styles.navButtons}>
            <AppButton label="Go to Coach" onPress={() => router.push("/coach")} variant="secondary" />
            <AppButton label="Go to Today" onPress={() => router.push("/today")} variant="secondary" />
          </View>
        </View>

        <View style={styles.introCard}>
          <AppText style={styles.cardTitle}>A few gentle tools</AppText>
          <AppText style={styles.cardBody}>
            Pick one that fits your day. These are meant to feel light, supportive, and easy to return to.
          </AppText>
        </View>

        {activeProgram && secondsRemaining !== null ? (
          <View style={styles.timerCard}>
            <AppText style={styles.timerTitle}>{activeProgram.title}</AppText>
            <AppText style={styles.timerValue}>{formatTime(secondsRemaining)}</AppText>
            <AppText style={styles.timerBody}>Take the next few minutes slowly. There’s no need to rush.</AppText>
            <AppButton label="Stop timer" onPress={clearTimer} variant="secondary" />
          </View>
        ) : null}

        {PROGRAMS.map((program) => (
          <View key={program.id} style={styles.programCard}>
            <View style={styles.programHeader}>
              <View style={styles.programHeaderText}>
                <AppText style={styles.programTitle}>{program.title}</AppText>
                <AppText style={styles.programDuration}>{program.durationLabel}</AppText>
              </View>
              <AppButton label="Start timer" onPress={() => startTimer(program)} variant="secondary" />
            </View>

            <AppText style={styles.programDescription}>{program.description}</AppText>

            <View style={styles.stepsList}>
              {program.steps.map((step, index) => (
                <View key={step} style={styles.stepRow}>
                  <View style={styles.stepBadge}>
                    <AppText style={styles.stepBadgeText}>{index + 1}</AppText>
                  </View>
                  <AppText style={styles.stepText}>{step}</AppText>
                </View>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 120,
    gap: 16,
  },
  navCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#f1e1d4",
    padding: 18,
    gap: 12,
  },
  navButtons: {
    gap: 10,
  },
  introCard: {
    backgroundColor: "#fff4ec",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#f2d8c4",
    padding: 18,
    gap: 8,
  },
  timerCard: {
    backgroundColor: "#eef7f3",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#d6e9dd",
    padding: 18,
    gap: 10,
  },
  timerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1f2937",
  },
  timerValue: {
    fontSize: 34,
    lineHeight: 42,
    fontWeight: "800",
    color: "#166534",
  },
  timerBody: {
    color: "#4b5563",
    lineHeight: 22,
  },
  programCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#f1e1d4",
    padding: 18,
    gap: 12,
  },
  programHeader: {
    gap: 12,
  },
  programHeaderText: {
    gap: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
  },
  cardBody: {
    color: "#4b5563",
    lineHeight: 22,
  },
  programTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1f2937",
  },
  programDuration: {
    fontSize: 13,
    color: "#c25d10",
    fontWeight: "600",
  },
  programDescription: {
    color: "#4b5563",
    lineHeight: 22,
  },
  stepsList: {
    gap: 10,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  stepBadge: {
    width: 24,
    height: 24,
    borderRadius: 999,
    backgroundColor: "#fff4ec",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  stepBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#c25d10",
  },
  stepText: {
    flex: 1,
    color: "#374151",
    lineHeight: 21,
  },
});
