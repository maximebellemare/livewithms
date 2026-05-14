import { useEffect, useMemo, useRef, useState } from "react";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import AppButton from "../../../../components/ui/AppButton";
import AppScreen from "../../../../components/ui/AppScreen";
import AppText from "../../../../components/ui/AppText";
import { useAuth } from "../../../../features/auth/hooks";
import { useCheckInOverview } from "../../../../features/checkins/hooks";
import { useGrowthState } from "../../../../features/growth/hooks";

type ToolSection = "Calm" | "Energy" | "Planning" | "Reflection";

type ProgramTool = {
  id: string;
  title: string;
  section: ToolSection;
  whenToUse: string;
  durationLabel: string;
  durationSeconds?: number;
  description: string;
  steps: string[];
  completionMessage: string;
};

const TOOLS: ProgramTool[] = [
  {
    id: "breathing-reset",
    title: "60-second breathing reset",
    section: "Calm",
    whenToUse: "When your body feels tense or your mind feels busy.",
    durationLabel: "1 minute",
    durationSeconds: 60,
    description: "A short breathing cue to help the moment feel a little less intense.",
    steps: [
      "Let your shoulders soften and place both feet on the floor if you can.",
      "Breathe in gently for 4.",
      "Breathe out a little longer for 6.",
      "Repeat slowly until the timer ends.",
    ],
    completionMessage: "You took one small step today.",
  },
  {
    id: "body-scan",
    title: "2-minute body scan",
    section: "Calm",
    whenToUse: "When you need to check in without pushing yourself.",
    durationLabel: "2 minutes",
    durationSeconds: 120,
    description: "A gentle scan to notice tension, effort, and what your body may need.",
    steps: [
      "Notice your jaw, shoulders, hands, and stomach one by one.",
      "Ask: what feels tight, tired, or tender right now?",
      "See if one part of your body can soften even 5%.",
      "End by choosing the gentlest next step for the next hour.",
    ],
    completionMessage: "You took one small step today.",
  },
  {
    id: "low-energy-checklist",
    title: "Low-energy day checklist",
    section: "Energy",
    whenToUse: "When fatigue is high and the day needs to feel smaller.",
    durationLabel: "2 minutes",
    description: "A quick reminder of what helps on heavier days.",
    steps: [
      "Pick only one priority for today.",
      "Move one non-urgent task out of the way.",
      "Keep water, snacks, and anything supportive nearby.",
      "Choose rest before you fully crash, not after.",
    ],
    completionMessage: "You took one small step today.",
  },
  {
    id: "one-priority-planner",
    title: "One-priority planner",
    section: "Planning",
    whenToUse: "When everything feels important and you need a clearer next step.",
    durationLabel: "2 minutes",
    description: "A small planning reset to make the day feel more manageable.",
    steps: [
      "Name the one thing that matters most today.",
      "Write down one thing that can wait.",
      "Choose one support action that makes the priority easier.",
      "Give yourself permission to stop once the main thing is done.",
    ],
    completionMessage: "You took one small step today.",
  },
  {
    id: "hard-moment-reflection",
    title: "Hard moment reflection",
    section: "Reflection",
    whenToUse: "When you want to process the day without overthinking it.",
    durationLabel: "3 minutes",
    description: "A short reflection to make a hard moment feel clearer and a little lighter.",
    steps: [
      "What felt hardest today?",
      "What helped, even a little?",
      "What can you let go of before tonight?",
      "What would make tomorrow 5% easier?",
    ],
    completionMessage: "You took one small step today.",
  },
];

const SECTIONS: ToolSection[] = ["Calm", "Energy", "Planning", "Reflection"];

function formatTime(secondsRemaining: number) {
  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export default function ProgramsScreen() {
  const scrollRef = useRef<ScrollView>(null);
  const { user } = useAuth();
  const overviewQuery = useCheckInOverview(user?.id);
  const growth = useGrowthState({
    totalCheckIns: overviewQuery.data?.length ?? 0,
  });
  const [selectedToolId, setSelectedToolId] = useState<string | null>(null);
  const [activeTimerId, setActiveTimerId] = useState<string | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);
  const [completedToolId, setCompletedToolId] = useState<string | null>(null);
  const [completedToolIds, setCompletedToolIds] = useState<string[]>([]);

  const selectedTool = useMemo(
    () => TOOLS.find((tool) => tool.id === selectedToolId) ?? null,
    [selectedToolId],
  );

  const activeTool = useMemo(
    () => TOOLS.find((tool) => tool.id === activeTimerId) ?? null,
    [activeTimerId],
  );

  useEffect(() => {
    if (!activeTimerId || secondsRemaining === null) {
      return;
    }

    if (secondsRemaining <= 0) {
      setCompletedToolId(activeTimerId);
      setCompletedToolIds((current) =>
        current.includes(activeTimerId) ? current : [...current, activeTimerId],
      );
      setActiveTimerId(null);
      setSecondsRemaining(null);
      return;
    }

    const timeoutId = setTimeout(() => {
      setSecondsRemaining((current) => (current === null ? current : current - 1));
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [activeTimerId, secondsRemaining]);

  useEffect(() => {
    if (!selectedToolId) {
      return;
    }

    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [selectedToolId]);

  const groupedTools = useMemo(
    () =>
      SECTIONS.map((section) => ({
        section,
        items: TOOLS.filter((tool) => tool.section === section),
      })),
    [],
  );

  const startTool = (tool: ProgramTool) => {
    setCompletedToolId(null);

    if (tool.durationSeconds) {
      setActiveTimerId(tool.id);
      setSecondsRemaining(tool.durationSeconds);
    }
  };

  const completeTool = (tool: ProgramTool) => {
    setCompletedToolId(tool.id);
    setCompletedToolIds((current) => (current.includes(tool.id) ? current : [...current, tool.id]));
    if (activeTimerId === tool.id) {
      setActiveTimerId(null);
      setSecondsRemaining(null);
    }

    void growth.recordEvent("program_completed", {
      toolId: tool.id,
    });
    void growth.maybePromptForReview();
  };

  const stopTimer = () => {
    setActiveTimerId(null);
    setSecondsRemaining(null);
  };

  const isSelectedToolCompleted = selectedTool ? completedToolIds.includes(selectedTool.id) : false;

  return (
    <AppScreen
      title="Support tools"
      subtitle="Small exercises for hard moments, low energy days, and daily reset."
    >
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <AppText style={styles.heroTitle}>A calm library for harder days</AppText>
          <AppText style={styles.heroBody}>
            Pick one small tool that matches the moment. You do not need to do everything.
          </AppText>
        </View>

        <View style={styles.navCard}>
          <AppText style={styles.cardTitle}>Quick links</AppText>
          <View style={styles.navButtons}>
            <AppButton label="Go to Coach" onPress={() => router.push("/coach")} variant="secondary" />
            <AppButton label="Go to Today" onPress={() => router.push("/today")} variant="secondary" />
          </View>
        </View>

        {activeTool && secondsRemaining !== null ? (
          <View style={styles.timerCard}>
            <AppText style={styles.timerKicker}>In progress</AppText>
            <AppText style={styles.timerTitle}>{activeTool.title}</AppText>
            <AppText style={styles.timerValue}>{formatTime(secondsRemaining)}</AppText>
            <AppText style={styles.timerBody}>
              Stay with the next gentle step. There is no need to rush this.
            </AppText>
            <AppButton label="Stop timer" onPress={stopTimer} variant="secondary" />
          </View>
        ) : null}

        {selectedTool && completedToolId === selectedTool.id ? (
          <View style={styles.completionCard}>
            <AppText style={styles.completionTitle}>You took one small step today.</AppText>
            <AppText style={styles.completionBody}>
              Even a short reset can change the feel of a moment.
            </AppText>
          </View>
        ) : null}

        {selectedTool ? (
          <View style={styles.detailCard}>
            <View style={styles.detailHeader}>
              <View style={styles.detailHeaderText}>
                <AppText style={styles.detailSectionLabel}>{selectedTool.section}</AppText>
                <AppText style={styles.detailTitle}>{selectedTool.title}</AppText>
              </View>
              <Pressable
                onPress={() => setSelectedToolId(null)}
                style={({ pressed }) => [styles.closeButton, pressed && styles.closeButtonPressed]}
              >
                <AppText style={styles.closeButtonText}>Close</AppText>
              </Pressable>
            </View>

            <View style={styles.metaRow}>
              <View style={styles.metaPill}>
                <AppText style={styles.metaPillText}>{selectedTool.durationLabel}</AppText>
              </View>
              <View style={styles.metaPill}>
                <AppText style={styles.metaPillText}>When to use it</AppText>
              </View>
            </View>

            <AppText style={styles.whenToUse}>{selectedTool.whenToUse}</AppText>
            <AppText style={styles.detailBody}>{selectedTool.description}</AppText>

            <View style={styles.stepsList}>
              {selectedTool.steps.map((step, index) => (
                <View key={`${selectedTool.id}-${index}`} style={styles.stepRow}>
                  <View style={styles.stepBadge}>
                    <AppText style={styles.stepBadgeText}>{index + 1}</AppText>
                  </View>
                  <AppText style={styles.stepText}>{step}</AppText>
                </View>
              ))}
            </View>

            <View style={styles.detailActions}>
              <AppButton
                label={isSelectedToolCompleted ? "Completed" : selectedTool.durationSeconds ? "Start" : "Mark complete"}
                onPress={() =>
                  isSelectedToolCompleted
                    ? null
                    : selectedTool.durationSeconds
                      ? startTool(selectedTool)
                      : completeTool(selectedTool)
                }
                disabled={isSelectedToolCompleted}
              />
              <AppButton
                label={isSelectedToolCompleted ? "Completed" : "Complete"}
                onPress={() => (isSelectedToolCompleted ? null : completeTool(selectedTool))}
                variant="secondary"
                disabled={isSelectedToolCompleted}
              />
            </View>
          </View>
        ) : null}

        {groupedTools.map(({ section, items }) => (
          <View key={section} style={styles.section}>
            <AppText style={styles.sectionTitle}>{section}</AppText>
            <View style={styles.sectionList}>
              {items.map((tool) => (
                <Pressable
                  key={tool.id}
                  onPress={() => setSelectedToolId(tool.id)}
                  style={({ pressed }) => [styles.toolCard, pressed && styles.toolCardPressed]}
                >
                  <View style={styles.toolTopRow}>
                    <AppText style={styles.toolTitle}>{tool.title}</AppText>
                    <AppText style={styles.toolDuration}>{tool.durationLabel}</AppText>
                  </View>
                  <AppText style={styles.toolWhenToUse}>{tool.whenToUse}</AppText>
                  <AppText style={styles.toolDescription}>{tool.description}</AppText>
                  <View style={styles.toolFooter}>
                    <AppText style={styles.toolOpenLabel}>Open tool</AppText>
                  </View>
                </Pressable>
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
    gap: 18,
  },
  heroCard: {
    backgroundColor: "#fff4ec",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#f2d8c4",
    padding: 18,
    gap: 8,
  },
  heroTitle: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: "700",
    color: "#1f2937",
  },
  heroBody: {
    color: "#4b5563",
    lineHeight: 22,
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
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
  },
  timerCard: {
    backgroundColor: "#eef7f3",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#d6e9dd",
    padding: 18,
    gap: 10,
  },
  timerKicker: {
    fontSize: 13,
    fontWeight: "700",
    color: "#166534",
    textTransform: "uppercase",
  },
  timerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1f2937",
  },
  timerValue: {
    fontSize: 34,
    lineHeight: 46,
    fontWeight: "800",
    color: "#166534",
  },
  timerBody: {
    color: "#4b5563",
    lineHeight: 22,
  },
  completionCard: {
    backgroundColor: "#f7fbf7",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#d7ead7",
    padding: 16,
    gap: 6,
  },
  completionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#166534",
  },
  completionBody: {
    color: "#3f5f46",
    lineHeight: 21,
  },
  detailCard: {
    backgroundColor: "#ffffff",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#f1e1d4",
    padding: 18,
    gap: 14,
  },
  detailHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  detailHeaderText: {
    flex: 1,
    gap: 4,
  },
  detailSectionLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#c25d10",
    textTransform: "uppercase",
  },
  detailTitle: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: "700",
    color: "#1f2937",
  },
  closeButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#ead9cb",
    backgroundColor: "#fffaf6",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  closeButtonPressed: {
    opacity: 0.82,
  },
  closeButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#8b6a4f",
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  metaPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#f3dfd1",
    backgroundColor: "#fffaf6",
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  metaPillText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#8b6a4f",
  },
  whenToUse: {
    color: "#4b5563",
    lineHeight: 22,
    fontWeight: "600",
  },
  detailBody: {
    color: "#4b5563",
    lineHeight: 22,
  },
  stepsList: {
    gap: 12,
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
  detailActions: {
    gap: 10,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1f2937",
  },
  sectionList: {
    gap: 12,
  },
  toolCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#f1e1d4",
    padding: 16,
    gap: 8,
  },
  toolCardPressed: {
    opacity: 0.84,
  },
  toolTopRow: {
    gap: 4,
  },
  toolTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
  },
  toolDuration: {
    fontSize: 13,
    fontWeight: "700",
    color: "#c25d10",
  },
  toolWhenToUse: {
    color: "#4b5563",
    lineHeight: 21,
    fontWeight: "600",
  },
  toolDescription: {
    color: "#6b7280",
    lineHeight: 21,
  },
  toolFooter: {
    paddingTop: 4,
  },
  toolOpenLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#c25d10",
  },
});
