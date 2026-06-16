import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { Alert, Animated, Easing, Linking, Pressable, ScrollView, Share, StyleSheet, TextInput, View } from "react-native";
import GentleExercisesSection from "../../../../components/exercises/GentleExercisesSection";
import AppButton from "../../../../components/ui/AppButton";
import AppScreen from "../../../../components/ui/AppScreen";
import AppText from "../../../../components/ui/AppText";
import ErrorState from "../../../../components/ui/ErrorState";
import LoadingState from "../../../../components/ui/LoadingState";
import { buildAdaptiveProfile } from "../../../../features/adaptive/logic";
import { useAuth } from "../../../../features/auth/hooks";
import { useCheckInHistory, useCheckInOverview } from "../../../../features/checkins/hooks";
import { getCheckInsInLastDays } from "../../../../features/checkins/consistency";
import { useGrowthState } from "../../../../features/growth/hooks";
import { applyLowEnergyModeOverride, useLowEnergyMode } from "../../../../features/low-energy-mode/hooks";
import { useCalmEnvironment } from "../../../../features/calm-environment/hooks";
import { buildLifecycleProfile } from "../../../../features/lifecycle/logic";
import { canAccessPremiumFeature } from "../../../../features/premium/entitlements";
import { usePremium } from "../../../../features/premium/hooks";
import { deriveLowEnergyAssist } from "../../../../features/premium/low-energy-assist";
import { getExerciseById, type ExerciseId } from "../../../../features/exercises/catalog";
import { getCalmAudioSessionByToolId } from "../../../../features/audio-support/library";
import type { CalmAudioSessionProgress } from "../../../../features/audio-support/types";
import {
  PROGRAM_LIBRARY_CATEGORIES,
  PROGRAM_MODULES,
  PROGRAM_SECTIONS,
  getProgramModuleById,
  getProgramToolById,
  getProgramToolsByModuleId,
} from "../../../../features/programs/catalog";
import { useProgramProgress } from "../../../../features/programs/hooks";
import type { ProgramModule, ProgramTool } from "../../../../features/programs/types";
import {
  deriveProgramCategoryLabel,
  deriveProgramSectionLabel,
  deriveProgramSectionSubtitle,
  derivePremiumProgramsCopy,
  deriveRecommendedProgramCopy,
} from "../../../../features/programs/polish";
import { deriveCognitiveSupport } from "../../../../features/programs/cognitive-support";
import { deriveCalmGuidance } from "../../../../features/programs/calm-guidance";
import { deriveCommunicationSupport } from "../../../../features/programs/communication-support";
import { deriveDifficultDaySupport } from "../../../../features/programs/difficult-day-support";
import { deriveEmotionalReset } from "../../../../features/programs/emotional-reset";
import { deriveMentalExhaustionSupport } from "../../../../features/programs/mental-exhaustion";
import { deriveRecoveryRhythm } from "../../../../features/programs/recovery-rhythm";
import { deriveSetbackRecovery } from "../../../../features/programs/setback-recovery";
import { deriveSleepRecoverySupport } from "../../../../features/programs/sleep-recovery";
import { deriveTransitionSupport } from "../../../../features/programs/transition-support";
import { deriveFutureStability } from "../../../../features/programs/future-stability";
import { deriveEmotionalRegulationToolkit, deriveToolkitTimeOfDay } from "../../../../features/programs/toolkit";
import { detectRoutineDisruption } from "../../../../lib/behavior-support/disruption-recovery/detectRoutineDisruption";
import { deriveRecoveryExperience } from "../../../../lib/behavior-support/disruption-recovery/deriveRecoveryExperience";
import { deriveFlexibleRoutineState } from "../../../../lib/behavior-support/low-pressure-routines/deriveFlexibleRoutineState";
import { deriveResumableProgramFlow } from "../../../../lib/behavior-support/low-pressure-routines/deriveResumableProgramFlow";
import { deriveSupportPrograms } from "../../../../lib/guided-programs/calm-paths/deriveSupportPrograms";
import { deriveRecoveryPaths } from "../../../../lib/guided-programs/calm-paths/deriveRecoveryPaths";
import { derivePauseResumeState } from "../../../../lib/guided-programs/interruptible-architecture/derivePauseResumeState";
import { normalizeProgramInterruptions } from "../../../../lib/guided-programs/interruptible-architecture/normalizeProgramInterruptions";
import { deriveProgramIntensity } from "../../../../lib/guided-programs/adaptive-pacing/deriveProgramIntensity";
import { deriveLowEnergyProgramMode } from "../../../../lib/guided-programs/adaptive-pacing/deriveLowEnergyProgramMode";
import { deriveGroundingSupport } from "../../../../lib/guided-programs/nervous-system-guidance/deriveGroundingSupport";
import { preventMotivationalPressure } from "../../../../lib/guided-programs/nervous-system-guidance/preventMotivationalPressure";
import { deriveSoftProgression } from "../../../../lib/guided-programs/gentle-progression/deriveSoftProgression";
import { preventCompletionPressure } from "../../../../lib/guided-programs/gentle-progression/preventCompletionPressure";
import { deriveRecoverySupport } from "../../../../lib/guided-programs/recovery-oriented-design/deriveRecoverySupport";
import { deriveDifficultPeriodPrograms } from "../../../../lib/guided-programs/recovery-oriented-design/deriveDifficultPeriodPrograms";
import { exportHealthSummary } from "../../../../lib/exportHealthSummary";
import { getSoundCueDurationMs, playSoundCue, startAmbientLoop, stopAmbientLoop, type AmbientDebugState } from "../../../../features/sound-effects/player";

function formatTime(secondsRemaining: number) {
  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function deriveBreathingPhase(input: { secondsRemaining: number; totalSeconds: number }) {
  const elapsedSeconds = Math.max(0, input.totalSeconds - input.secondsRemaining);
  const phaseSecond = elapsedSeconds % 12;

  if (phaseSecond < 4) {
    return {
      label: "Inhale",
      instruction: "Inhale slowly for 4 seconds.",
    };
  }

  if (phaseSecond < 6) {
    return {
      label: "Hold",
      instruction: "Hold for 2 seconds.",
    };
  }

  return {
    label: "Exhale",
    instruction: "Exhale slowly for 6 seconds.",
  };
}

function deriveAdaptiveStatePrimary(input: {
  lowEnergyMode: boolean;
  stressTrend: "elevated" | "steady" | "lighter" | "unknown";
  engagementPattern: "steady" | "gentle-reengagement" | "new" | "unknown";
}) {
  return input.lowEnergyMode
    ? "LOW_ENERGY"
    : input.stressTrend === "elevated"
      ? "OVERWHELMED"
      : input.engagementPattern === "gentle-reengagement"
        ? "WITHDRAWN"
        : "STABLE";
}

const FREE_PROGRAM_TOOL_IDS = [
  "reduce-overwhelm",
  "brain-fog-basics",
  "breathing-reset",
  "appointment-prep",
] as const;

const PREMIUM_PROGRAM_TOOL_IDS = [
  "difficult-day-pacing-checklist",
  "symptom-reflection",
  "cognitive-decompression-reset",
  "sleep-decompression-flow",
  "everything-feels-too-hard",
] as const;

const PROGRAM_TOOL_OUTCOMES: Record<string, string> = {
  "reduce-overwhelm": "Sort competing pressure into one focus and one next step.",
  "brain-fog-basics": "Narrow attention to one or two clear steps.",
  "breathing-reset": "Use a short reset when stress feels high.",
  "appointment-prep": "Turn concerns into a short care-team topic list.",
  "difficult-day-pacing-checklist": "Protect energy during harder or lower-capacity days.",
  "symptom-reflection": "Organize a symptom change for tracking or appointments.",
  "cognitive-decompression-reset": "Move mental clutter out of working memory.",
  "sleep-decompression-flow": "Reduce evening stimulation before rest.",
  "everything-feels-too-hard": "Shrink the day when basic tasks feel difficult.",
};

const PROGRAM_TOOL_LABELS: Record<string, string> = {
  "difficult-day-pacing-checklist": "Fatigue pacing planner",
  "cognitive-decompression-reset": "Cognitive overload support",
  "sleep-decompression-flow": "Sleep recovery support",
  "everything-feels-too-hard": "Difficult day reset",
};

const TOOL_ID_ALIASES: Record<string, string> = {
  "one-priority-planner": "one-priority-planner",
  "one-priority": "one-priority-planner",
  "priority-planner": "one-priority-planner",
  "reduce-overwhelm": "reduce-overwhelm",
  "brain-fog-support": "brain-fog-basics",
  "brain-fog-basics": "brain-fog-basics",
  "sleep-recovery-support": "sleep-decompression-flow",
  "sleep-decompression-flow": "sleep-decompression-flow",
  "fatigue-pacing-planner": "difficult-day-pacing-checklist",
  "difficult-day-pacing-checklist": "difficult-day-pacing-checklist",
};

function resolveProgramToolId(toolId: string | null | undefined) {
  if (!toolId) {
    return null;
  }

  return TOOL_ID_ALIASES[toolId] ?? toolId;
}

type ProgramWorkflowQuestion = {
  id: string;
  label: string;
  placeholder?: string;
  type: "text" | "choice" | "multiChoice";
  options?: string[];
  allowCustom?: boolean;
};

type ProgramWorkflow = {
  title: string;
  questions: ProgramWorkflowQuestion[];
  summaryTitle: string;
  summaryItems: Array<{
    answerId: string;
    label: string;
  }>;
  adaptiveQuestionIds?: (answers: Record<string, string>) => string[];
};

const CUSTOM_OPTION_LABEL = "+ Custom";
const RESET_TOOL_OPTIONS = new Set(["60-second reset"]);

const PROGRAM_TOOL_WORKFLOWS: Record<string, ProgramWorkflow> = {
  "reduce-overwhelm": {
    title: "Reduce overwhelm",
    summaryTitle: "Overwhelm reset",
    questions: [
      {
        id: "pressure",
        label: "What feels most overwhelming right now?",
        type: "choice",
        options: [
          "Too many decisions",
          "Mental exhaustion",
          "Physical fatigue",
          "Work/tasks",
          "Emotional stress",
          "Symptoms",
          "Everything at once",
        ],
      },
      {
        id: "focus",
        label: "What absolutely needs attention today?",
        type: "text",
        placeholder: "One necessary focus",
      },
      {
        id: "wait",
        label: "What can become smaller, slower, or later?",
        type: "text",
        placeholder: "One thing to reduce or delay",
      },
      {
        id: "next",
        label: "Choose one next step.",
        type: "text",
        placeholder: "One small action",
      },
    ],
    summaryItems: [
      { answerId: "pressure", label: "Main pressure" },
      { answerId: "focus", label: "One focus" },
      { answerId: "wait", label: "Can wait" },
      { answerId: "next", label: "Next step" },
    ],
  },
  "brain-fog-basics": {
    title: "Brain fog support",
    summaryTitle: "Cognitive simplification",
    questions: [
      {
        id: "fogLevel",
        label: "Fog level",
        type: "choice",
        options: ["Mild", "Moderate", "Heavy"],
      },
      {
        id: "hardest",
        label: "What feels hardest right now?",
        type: "choice",
        options: [
          "Focusing",
          "Remembering things",
          "Starting tasks",
          "Too many thoughts",
          "Mental exhaustion",
          "Making decisions",
          "Finding words",
          "Everything feels blurry",
        ],
      },
      {
        id: "focus",
        label: "What is one thing you need to handle next?",
        type: "text",
        placeholder: "One task, message, decision, or need",
      },
      {
        id: "smaller",
        label: "Can it become smaller?",
        type: "choice",
        options: ["5 minutes only", "One step only", "Partial completion is enough", "Ask for help", "Postpone part of it"],
      },
      {
        id: "adjustment",
        label: "What would make this easier?",
        type: "choice",
        options: ["Less noise", "Fewer tabs/screens", "Break it into steps", "Water/snack", "Short break", "Write it down", "Remove one task"],
      },
    ],
    summaryItems: [
      { answerId: "focus", label: "Main focus" },
      { answerId: "smaller", label: "Smaller version" },
      { answerId: "adjustment", label: "Helpful adjustment" },
      { answerId: "hardest", label: "Hardest part" },
      { answerId: "fogLevel", label: "Fog level" },
    ],
    adaptiveQuestionIds: (answers) =>
      answers.fogLevel === "Heavy"
        ? ["fogLevel", "hardest", "focus", "smaller"]
        : ["fogLevel", "hardest", "focus", "smaller", "adjustment"],
  },
  "breathing-reset": {
    title: "60-second breathing reset",
    summaryTitle: "Reset note",
    questions: [
      {
        id: "useDuring",
        label: "Use during",
        type: "choice",
        options: ["Stressful moments", "Racing thoughts", "Overstimulation", "Symptom anxiety", "Before appointments", "Before sleep"],
      },
      {
        id: "reason",
        label: "What are you resetting from?",
        type: "text",
        placeholder: "Optional note",
      },
    ],
    summaryItems: [
      { answerId: "useDuring", label: "Use during" },
      { answerId: "reason", label: "Reset from" },
    ],
  },
  "appointment-prep": {
    title: "Appointment prep",
    summaryTitle: "Appointment summary",
    questions: [
      {
        id: "changes",
        label: "What changed since your last appointment?",
        type: "multiChoice",
        options: [
          "More fatigue",
          "Worse sleep",
          "New symptoms",
          "Increased stress",
          "Medication side effects",
          "Mood changes",
          "Mobility changes",
          "Other",
        ],
      },
      {
        id: "symptoms",
        label: "What symptoms matter most right now?",
        type: "multiChoice",
        options: ["Fatigue", "Brain fog", "Pain", "Sleep", "Mood", "Stress", "Mobility", "Numbness/tingling", "Vision", "Balance", "Bladder/bowel", "Other"],
      },
      {
        id: "questions",
        label: "What do you want to ask or discuss?",
        type: "text",
        placeholder: "Questions, concerns, or discussion topics",
      },
      {
        id: "medications",
        label: "Any medication or supplement changes?",
        type: "text",
        placeholder: "New, stopped, changed dose, side effects, or none",
      },
      {
        id: "challenge",
        label: "What feels most difficult lately?",
        type: "text",
        placeholder: "One practical challenge to mention",
      },
    ],
    summaryItems: [
      { answerId: "changes", label: "Recent changes" },
      { answerId: "symptoms", label: "Symptoms to discuss" },
      { answerId: "questions", label: "Questions to ask" },
      { answerId: "medications", label: "Medication changes" },
      { answerId: "challenge", label: "Biggest challenge" },
    ],
  },
  "difficult-day-pacing-checklist": {
    title: "Fatigue pacing planner",
    summaryTitle: "Pacing summary",
    questions: [
      {
        id: "energy",
        label: "How is your energy today?",
        type: "choice",
        options: ["Very low", "Low", "Medium", "Higher than usual"],
      },
      {
        id: "demands",
        label: "What absolutely needs energy today?",
        type: "multiChoice",
        options: ["Work", "Appointment", "Cleaning", "Errands", "Parenting", "Social plans", "Care tasks", "Other"],
      },
      {
        id: "drains",
        label: "What tends to drain you fastest?",
        type: "multiChoice",
        options: [
          "Too many decisions",
          "Long conversations",
          "Physical activity",
          "Noise/stimulation",
          "Multitasking",
          "Stress",
          "Driving/travel",
          "Screen time",
        ],
      },
      {
        id: "smaller",
        label: "What can become smaller today?",
        type: "text",
        placeholder: "Shorter version, postpone part, ask for help, slower pace",
      },
      {
        id: "recovery",
        label: "What recovery moments can you protect today?",
        type: "multiChoice",
        options: ["Quiet break", "Sitting down", "Lower stimulation", "Hydration", "Earlier evening", "Short rest"],
      },
    ],
    summaryItems: [
      { answerId: "energy", label: "Energy level" },
      { answerId: "demands", label: "Main demands" },
      { answerId: "drains", label: "Biggest drains" },
      { answerId: "smaller", label: "Stays smaller" },
      { answerId: "recovery", label: "Recovery protected" },
    ],
  },
  "symptom-reflection": {
    title: "Symptom reflection",
    summaryTitle: "Symptom pattern note",
    questions: [
      {
        id: "symptom",
        label: "What symptom stands out most right now?",
        type: "choice",
        options: [
          "Fatigue",
          "Brain fog",
          "Pain",
          "Tingling/numbness",
          "Stress",
          "Mood",
          "Sleep",
          "Mobility",
          "Vision",
          "Balance",
          "Other",
        ],
      },
      {
        id: "change",
        label: "Has this changed recently?",
        type: "choice",
        options: ["Worse", "Slightly worse", "Similar", "Slightly better", "Better"],
      },
      {
        id: "triggers",
        label: "What seems connected to it lately?",
        type: "multiChoice",
        options: [
          "Poor sleep",
          "Stress",
          "Heat",
          "Overexertion",
          "Busy days",
          "Noise/stimulation",
          "Workload",
          "Unknown",
        ],
      },
      {
        id: "supports",
        label: "What seems to help even slightly?",
        type: "multiChoice",
        options: [
          "Rest",
          "Quiet environment",
          "Short breaks",
          "Hydration",
          "Lower stimulation",
          "Sleep",
          "Slower pace",
          "Nothing noticeable yet",
        ],
      },
      {
        id: "monitoring",
        label: "Is this worth mentioning later?",
        type: "choice",
        options: ["Save for appointment prep", "Add to care notes", "Monitor for now"],
      },
    ],
    summaryItems: [
      { answerId: "symptom", label: "Main symptom" },
      { answerId: "change", label: "Recent change" },
      { answerId: "triggers", label: "Possible triggers" },
      { answerId: "supports", label: "Possible supports" },
      { answerId: "monitoring", label: "Worth monitoring" },
    ],
  },
  "cognitive-decompression-reset": {
    title: "Cognitive overload support",
    summaryTitle: "Cognitive reset summary",
    questions: [
      {
        id: "level",
        label: "Overload level",
        type: "choice",
        options: ["Low", "Moderate", "High", "Maxed out"],
      },
      {
        id: "overload",
        label: "What feels overloaded right now?",
        type: "choice",
        options: [
          "Too many tasks",
          "Too many decisions",
          "Mental exhaustion",
          "Too much stimulation",
          "Emotional stress",
          "Work/school",
          "Conversations/social energy",
          "Symptoms",
          "Everything at once",
        ],
      },
      {
        id: "focus",
        label: "What absolutely needs attention first?",
        type: "text",
        placeholder: "One thing only",
      },
      {
        id: "smaller",
        label: "What can become smaller, slower, later, shared, or ignored today?",
        type: "text",
        placeholder: "One demand to reduce",
      },
      {
        id: "noise",
        label: "What is adding the most mental noise?",
        type: "choice",
        options: [
          "Notifications",
          "Multiple tabs/screens",
          "Conversations",
          "Clutter",
          "Time pressure",
          "Noise",
          "Uncertainty",
          "Expectations",
          "My own thoughts",
        ],
      },
      {
        id: "next",
        label: "Choose one thing to focus on next.",
        type: "text",
        placeholder: "One next step",
      },
      {
        id: "reset",
        label: "Choose a quick support option",
        type: "choice",
        options: ["60-second reset"],
        allowCustom: false,
      },
    ],
    summaryItems: [
      { answerId: "level", label: "Overload level" },
      { answerId: "overload", label: "Main overload" },
      { answerId: "focus", label: "Primary focus" },
      { answerId: "smaller", label: "Becomes smaller" },
      { answerId: "noise", label: "Biggest mental noise" },
      { answerId: "next", label: "Next step" },
      { answerId: "reset", label: "Reset first" },
    ],
    adaptiveQuestionIds: (answers) =>
      answers.level === "Maxed out"
        ? ["level", "overload", "focus", "smaller", "reset"]
        : ["level", "overload", "focus", "smaller", "noise", "next", "reset"],
  },
  "sleep-decompression-flow": {
    title: "Sleep recovery support",
    summaryTitle: "Recovery summary",
    questions: [
      {
        id: "activation",
        label: "What feels most active right now?",
        type: "choice",
        options: [
          "Racing thoughts",
          "Stress",
          "Physical tension",
          "Symptoms",
          "Screen overstimulation",
          "Anxiety about tomorrow",
          "Restlessness",
          "Mental exhaustion",
        ],
      },
      {
        id: "adjustment",
        label: "What would help the evening feel slightly easier?",
        type: "choice",
        options: [
          "Lower light",
          "Less stimulation",
          "Quieter environment",
          "Slower breathing",
          "Fewer decisions",
          "Put things away",
          "Gentle audio",
          "Earlier shutdown",
        ],
      },
      {
        id: "release",
        label: "Choose one thing to let go of tonight.",
        type: "text",
        placeholder: "One task, thought, decision, or expectation",
      },
      {
        id: "reset",
        label: "Choose a quick recovery option",
        type: "choice",
        options: ["60-second reset"],
        allowCustom: false,
      },
      {
        id: "focus",
        label: "What would make tonight feel successful?",
        type: "choice",
        options: ["More rest", "Less mental noise", "Gentler evening", "Earlier sleep"],
      },
    ],
    summaryItems: [
      { answerId: "activation", label: "Main activation" },
      { answerId: "adjustment", label: "Helpful adjustment" },
      { answerId: "release", label: "Release tonight" },
      { answerId: "reset", label: "Reset first" },
      { answerId: "focus", label: "Recovery focus" },
    ],
  },
  "everything-feels-too-hard": {
    title: "Difficult day reset",
    summaryTitle: "Stabilization summary",
    questions: [
      {
        id: "difficulty",
        label: "What feels hardest right now?",
        type: "choice",
        options: [
          "Physical fatigue",
          "Mental overload",
          "Symptoms",
          "Stress",
          "Emotional exhaustion",
          "Too many demands",
          "Feeling discouraged",
          "Everything feels heavy",
        ],
      },
      {
        id: "focus",
        label: "What absolutely needs attention today?",
        type: "text",
        placeholder: "One thing only",
      },
      {
        id: "smaller",
        label: "What can become smaller, slower, or later?",
        type: "text",
        placeholder: "One demand, task, decision, or expectation",
      },
      {
        id: "adjustment",
        label: "What would help the next few hours feel slightly easier?",
        type: "choice",
        options: [
          "Less stimulation",
          "Quieter environment",
          "Rest",
          "Water/food",
          "Short break",
          "Smaller task list",
          "Slower pace",
          "Ask for help",
          "One simple task only",
        ],
      },
      {
        id: "reset",
        label: "Choose a quick support option",
        type: "choice",
        options: ["60-second reset"],
        allowCustom: false,
      },
      {
        id: "enough",
        label: "What counts as enough for today?",
        type: "text",
        placeholder: "A realistic stopping point",
      },
    ],
    summaryItems: [
      { answerId: "difficulty", label: "Main difficulty" },
      { answerId: "focus", label: "One focus" },
      { answerId: "smaller", label: "Becomes smaller" },
      { answerId: "adjustment", label: "Helpful adjustment" },
      { answerId: "reset", label: "Recovery support" },
      { answerId: "enough", label: "Enough today" },
    ],
  },
};

function getProgramWorkflow(tool: ProgramTool): ProgramWorkflow {
  return PROGRAM_TOOL_WORKFLOWS[tool.id] ?? {
    title: PROGRAM_TOOL_LABELS[tool.id] ?? tool.title,
    summaryTitle: "Tool summary",
    questions: [
      {
        id: "need",
        label: "What do you want this tool to help with?",
        type: "text",
        placeholder: "Name the situation",
      },
      {
        id: "next",
        label: "What is one useful next step?",
        type: "text",
        placeholder: "One small action",
      },
    ],
    summaryItems: [
      { answerId: "need", label: "Use for" },
      { answerId: "next", label: "Next step" },
    ],
  };
}

function toggleListValue(currentValue: string | undefined, option: string) {
  const values = (currentValue ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const nextValues = values.includes(option)
    ? values.filter((value) => value !== option)
    : [...values, option];

  return nextValues.join(", ");
}

function getSelectedListValues(value: string | undefined) {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function getCustomWorkflowValue(question: ProgramWorkflowQuestion, value: string | undefined) {
  if (question.type === "choice") {
    const selectedValue = value?.trim() ?? "";
    return selectedValue && !(question.options ?? []).includes(selectedValue) ? selectedValue : "";
  }

  if (question.type === "multiChoice") {
    return getSelectedListValues(value)
      .filter((item) => !(question.options ?? []).includes(item))
      .join(", ");
  }

  return "";
}

function buildWorkflowSummaryText(input: {
  title: string;
  workflow: ProgramWorkflow;
  answers: Record<string, string>;
}) {
  const lines = input.workflow.summaryItems
    .map((item) => {
      const value = input.answers[item.answerId]?.trim();
      return value ? `- ${item.label}: ${value}` : null;
    })
    .filter((line): line is string => Boolean(line));

  return [input.title, "", ...lines].join("\n");
}

function buildWorkflowExportSections(workflow: ProgramWorkflow, answers: Record<string, string>) {
  return workflow.summaryItems
    .map((item) => {
      const value = answers[item.answerId]?.trim();

      return value
        ? {
            title: item.label,
            lines: value.split(",").map((line) => line.trim()).filter(Boolean),
          }
        : null;
    })
    .filter((section): section is { title: string; lines: string[] } => Boolean(section));
}

function countListItems(value: string | undefined) {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean).length;
}

function deriveEnergyBudget(answers: Record<string, string>) {
  const demandCount = countListItems(answers.demands);
  const drainCount = countListItems(answers.drains);
  const recoveryCount = countListItems(answers.recovery);
  const lowEnergy = answers.energy === "Very low" || answers.energy === "Low";
  const overloadScore = demandCount + drainCount + (lowEnergy ? 2 : 0) - recoveryCount;
  const overloadRisk = overloadScore >= 5 ? "Higher" : overloadScore >= 3 ? "Moderate" : "Lower";

  return {
    requiredEnergy: Math.min(5, demandCount + (lowEnergy ? 1 : 0)),
    recoveryProtected: Math.min(5, recoveryCount),
    overloadRisk,
  };
}

function deriveSymptomPatternCue(answers: Record<string, string>) {
  const symptom = answers.symptom?.trim();
  const change = answers.change?.trim();
  const triggers = answers.triggers?.trim();
  const supports = answers.supports?.trim();

  if (!symptom) {
    return null;
  }

  const changeText = change && change !== "Similar" ? `${symptom} is marked as ${change.toLowerCase()}.` : `${symptom} is worth watching over time.`;
  const triggerText = triggers ? `Possible connection: ${triggers}.` : "Possible connection: not clear yet.";
  const supportText = supports ? `Support to compare later: ${supports}.` : "Support to compare later: not clear yet.";

  return {
    changeText,
    triggerText,
    supportText,
  };
}

function deriveCognitiveLoadCue(answers: Record<string, string>) {
  const level = answers.level?.trim();
  const focus = answers.focus?.trim();
  const smaller = answers.smaller?.trim();
  const noise = answers.noise?.trim();
  const reset = answers.reset?.trim();

  if (!level && !focus && !smaller) {
    return null;
  }

  return {
    loadText: level ? `Current load: ${level}.` : "Current load: not marked.",
    focusText: focus ? `Keep visible: ${focus}.` : "Keep visible: one next focus.",
    reductionText: smaller ? `Reduce: ${smaller}.` : "Reduce: one demand, decision, or expectation.",
    noiseText: noise ? `Lower noise from: ${noise}.` : reset ? `Start with: ${reset}.` : "Lower noise where possible.",
  };
}

function deriveSleepRecoveryCue(answers: Record<string, string>) {
  const activation = answers.activation?.trim();
  const adjustment = answers.adjustment?.trim();
  const release = answers.release?.trim();
  const focus = answers.focus?.trim();

  if (!activation && !adjustment && !release) {
    return null;
  }

  return {
    activationText: activation ? `Lower activation from: ${activation}.` : "Lower activation where possible.",
    adjustmentText: adjustment ? `Start with: ${adjustment}.` : "Start with one lower-stimulation adjustment.",
    releaseText: release ? `Leave aside tonight: ${release}.` : "Leave one demand aside tonight.",
    focusText: focus ? `Recovery focus: ${focus}.` : "Recovery focus: less pressure.",
  };
}

function deriveDifficultDayCue(answers: Record<string, string>) {
  const difficulty = answers.difficulty?.trim();
  const focus = answers.focus?.trim();
  const smaller = answers.smaller?.trim();
  const adjustment = answers.adjustment?.trim();
  const enough = answers.enough?.trim();

  if (!difficulty && !focus && !smaller) {
    return null;
  }

  return {
    difficultyText: difficulty ? `Main difficulty: ${difficulty}.` : "Main difficulty: not marked.",
    focusText: focus ? `Keep visible: ${focus}.` : "Keep visible: one necessary focus.",
    smallerText: smaller ? `Make smaller: ${smaller}.` : "Make one demand smaller.",
    supportText: adjustment ? `Next few hours: ${adjustment}.` : "Next few hours: lower the pressure where possible.",
    enoughText: enough ? `Enough today: ${enough}.` : "Enough today: a realistic stopping point.",
  };
}

export default function ProgramsScreen() {
  const params = useLocalSearchParams<{ section?: string; tool?: string; exercise?: string }>();
  const sectionParam = Array.isArray(params.section) ? params.section[0] : params.section;
  const toolParam = Array.isArray(params.tool) ? params.tool[0] : params.tool;
  const exerciseParam = Array.isArray(params.exercise) ? params.exercise[0] : params.exercise;
  const deepLinkExerciseId = getExerciseById(exerciseParam)?.id ?? null;
  const deepLinkKey = `${sectionParam ?? ""}:${toolParam ?? ""}:${deepLinkExerciseId ?? ""}`;
  const scrollRef = useRef<ScrollView>(null);
  const detailCardYRef = useRef(0);
  const toolCardPositionsRef = useRef<Record<string, number>>({});
  const timerCardYRef = useRef(0);
  const exerciseSectionYRef = useRef(0);
  const breathingAmbientStartTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shouldScrollToDetailRef = useRef(false);
  const shouldScrollToTimerRef = useRef(false);
  const handledDeepLinkRef = useRef<string | null>(null);
  const breathingScale = useRef(new Animated.Value(0)).current;
  const lastBreathingPhaseRef = useRef<string | null>(null);
  const timerCueStateRef = useRef({ halfwayPlayed: false, nearEndPlayed: false });
  const audioCueStateRef = useRef({ nearEndPlayed: false });
  const { user } = useAuth();
  const overviewQuery = useCheckInOverview(user?.id);
  const historyQuery = useCheckInHistory(user?.id, 14);
  const growth = useGrowthState({
    totalCheckIns: overviewQuery.data?.length ?? 0,
  });
  const lowEnergyMode = useLowEnergyMode();
  const calmEnvironment = useCalmEnvironment();
  const premium = usePremium();
  const programProgress = useProgramProgress();
  const markOpenedRef = useRef(programProgress.markOpened);
  const [selectedToolId, setSelectedToolId] = useState<string | null>(null);
  const [activeTimerId, setActiveTimerId] = useState<string | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);
  const [completedToolId, setCompletedToolId] = useState<string | null>(null);
  const [showSelectedToolDetails, setShowSelectedToolDetails] = useState(false);
  const [audioSessionState, setAudioSessionState] = useState<CalmAudioSessionProgress | null>(null);
  const [, setAmbientDebugState] = useState<AmbientDebugState>({ status: "idle" });
  const [workflowAnswers, setWorkflowAnswers] = useState<Record<string, Record<string, string>>>({});
  const [savedWorkflowByToolId, setSavedWorkflowByToolId] = useState<Record<string, Record<string, string>>>({});
  const [customWorkflowFields, setCustomWorkflowFields] = useState<Record<string, Record<string, boolean>>>({});
  const [exportingAppointmentSummary, setExportingAppointmentSummary] = useState(false);
  const [appointmentExportMessage, setAppointmentExportMessage] = useState<string | null>(null);

  const selectedTool = useMemo(
    () => getProgramToolById(selectedToolId),
    [selectedToolId],
  );
  const selectedAudioSession = useMemo(
    () => getCalmAudioSessionByToolId(selectedToolId),
    [selectedToolId],
  );
  const selectedModule = useMemo(
    () => getProgramModuleById(selectedTool?.moduleId),
    [selectedTool?.moduleId],
  );

  useEffect(() => {
    markOpenedRef.current = programProgress.markOpened;
  }, [programProgress.markOpened]);

  useEffect(() => {
    return () => {
      if (breathingAmbientStartTimeoutRef.current) {
        clearTimeout(breathingAmbientStartTimeoutRef.current);
        breathingAmbientStartTimeoutRef.current = null;
      }
      void stopAmbientLoop("programs-unmount", setAmbientDebugState);
    };
  }, []);

  const clearBreathingAmbientTimeout = useCallback(() => {
    if (!breathingAmbientStartTimeoutRef.current) {
      return;
    }

    clearTimeout(breathingAmbientStartTimeoutRef.current);
    breathingAmbientStartTimeoutRef.current = null;
  }, []);

  const startBreathingResetAudio = useCallback(() => {
    clearBreathingAmbientTimeout();
    setAmbientDebugState({ status: "stopped", detail: "Background audio disabled for breathing reset." });
    void stopAmbientLoop("before-breathing-reset", setAmbientDebugState);

    if (__DEV__ && !calmEnvironment.soundEffects) {
      console.log("[timer-sound]", {
        event: "breathing-start-muted-by-settings",
        soundEffectsEnabled: calmEnvironment.soundEffects,
      });
    }

    void playSoundCue("breathing-start", calmEnvironment.soundEffects);

    if (__DEV__) {
      console.log("[timer-sound]", {
        event: "breathing-ambient-disabled",
      });
    }
  }, [calmEnvironment.soundEffects, clearBreathingAmbientTimeout]);

  const logTimerSound = useCallback((event: string, details?: Record<string, unknown>) => {
    if (!__DEV__) {
      return;
    }

    console.log("[timer-sound]", {
      event,
      activeTimerId,
      selectedToolId,
      secondsRemaining,
      soundEffectsEnabled: calmEnvironment.soundEffects,
      backgroundAudioEnabled: calmEnvironment.backgroundAudio,
      ...(details ?? {}),
    });
  }, [
    activeTimerId,
    calmEnvironment.backgroundAudio,
    calmEnvironment.soundEffects,
    secondsRemaining,
    selectedToolId,
  ]);

  const overviewEntries = useMemo(() => overviewQuery.data ?? [], [overviewQuery.data]);
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const weeklyCheckIns = useMemo(
    () => getCheckInsInLastDays(overviewEntries, today, 7),
    [overviewEntries, today],
  );
  const adaptiveProfile = useMemo(
    () =>
      applyLowEnergyModeOverride(
        buildAdaptiveProfile(historyQuery.data ?? [], Math.min(7, historyQuery.data?.length ?? 0)),
        lowEnergyMode.enabled,
      ),
    [historyQuery.data, lowEnergyMode.enabled],
  );
  const hasLowEnergyAssist = useMemo(
    () =>
      canAccessPremiumFeature("low_energy_assist", {
        subscriptionsEnabled: premium.subscriptionsEnabled,
        hasPremiumAccess: premium.hasPremiumAccess,
        premiumFeatureFlags: premium.premiumFeatureFlags,
      }),
    [premium.hasPremiumAccess, premium.premiumFeatureFlags, premium.subscriptionsEnabled],
  );
  const lowEnergyAssist = useMemo(
    () =>
      deriveLowEnergyAssist({
        hasPremiumAccess: premium.hasPremiumAccess,
        featureEnabled: premium.premiumFeatureFlags.low_energy_assist,
        lowEnergyModeEnabled: lowEnergyMode.enabled,
        recentFatigueAverage:
          typeof historyQuery.data?.[0]?.fatigue === "number" ? historyQuery.data?.[0]?.fatigue : null,
        recentStressAverage:
          typeof historyQuery.data?.[0]?.stress === "number" ? historyQuery.data?.[0]?.stress : null,
        recentSleepAverage:
          typeof historyQuery.data?.[0]?.sleep_hours === "number" ? historyQuery.data?.[0]?.sleep_hours : null,
        fatigueTrend: adaptiveProfile.fatigueTrend,
        stressTrend: adaptiveProfile.stressTrend,
        interactionTolerance: adaptiveProfile.lowEnergyMode ? "reduced" : "steady",
      }),
    [
      adaptiveProfile.fatigueTrend,
      adaptiveProfile.lowEnergyMode,
      adaptiveProfile.stressTrend,
      historyQuery.data,
      lowEnergyMode.enabled,
      premium.hasPremiumAccess,
      premium.premiumFeatureFlags.low_energy_assist,
    ],
  );
  const hasGuidedPrograms = useMemo(
    () =>
      canAccessPremiumFeature("guided_programs", {
        subscriptionsEnabled: premium.subscriptionsEnabled,
        hasPremiumAccess: premium.hasPremiumAccess,
        premiumFeatureFlags: premium.premiumFeatureFlags,
      }),
    [premium.hasPremiumAccess, premium.premiumFeatureFlags, premium.subscriptionsEnabled],
  );
  const hasCalmAudioSupport = useMemo(
    () =>
      canAccessPremiumFeature("calm_audio_support", {
        subscriptionsEnabled: premium.subscriptionsEnabled,
        hasPremiumAccess: premium.hasPremiumAccess,
        premiumFeatureFlags: premium.premiumFeatureFlags,
      }),
    [premium.hasPremiumAccess, premium.premiumFeatureFlags, premium.subscriptionsEnabled],
  );
  const lifecycleProfile = useMemo(
    () =>
      buildLifecycleProfile({
        firstOpenedAt: growth.state?.firstOpenedAt ?? null,
        activeDates: growth.state?.activeDates ?? [],
        totalCheckIns: overviewEntries.length,
        weeklyCheckIns,
      }),
    [growth.state?.activeDates, growth.state?.firstOpenedAt, overviewEntries.length, weeklyCheckIns],
  );
  const suggestedTool = useMemo(
    () => getProgramToolById(adaptiveProfile.suggestedProgram),
    [adaptiveProfile.suggestedProgram],
  );
  const suggestedModule = useMemo(
    () => getProgramModuleById(suggestedTool?.moduleId),
    [suggestedTool?.moduleId],
  );

  const activeTool = useMemo(
    () => getProgramToolById(activeTimerId),
    [activeTimerId],
  );
  const activeTimerTotalSeconds = activeTool?.durationSeconds ?? 60;
  const activeBreathingPhase = activeTool?.id === "breathing-reset" && secondsRemaining !== null
    ? deriveBreathingPhase({
        secondsRemaining,
        totalSeconds: activeTimerTotalSeconds,
      })
    : null;
  const adaptiveStatePrimary = useMemo(
    () =>
      deriveAdaptiveStatePrimary({
        lowEnergyMode: adaptiveProfile.lowEnergyMode,
        stressTrend: adaptiveProfile.stressTrend,
        engagementPattern: adaptiveProfile.engagementPattern,
      }),
    [adaptiveProfile.engagementPattern, adaptiveProfile.lowEnergyMode, adaptiveProfile.stressTrend],
  );
  const premiumProgramsCopy = useMemo(
    () =>
      derivePremiumProgramsCopy({
        lowEnergyMode: adaptiveProfile.lowEnergyMode || lowEnergyAssist.active,
        overwhelmed: adaptiveStatePrimary === "OVERWHELMED",
        highFatigue: adaptiveProfile.fatigueTrend === "high",
      }),
    [adaptiveProfile.fatigueTrend, adaptiveProfile.lowEnergyMode, adaptiveStatePrimary, lowEnergyAssist.active],
  );
  const emotionalToolkit = useMemo(
    () =>
      deriveEmotionalRegulationToolkit({
        lowEnergyMode: adaptiveProfile.lowEnergyMode,
        lowEnergyAssistActive: lowEnergyAssist.active,
        fatigueTrend: adaptiveProfile.fatigueTrend,
        stressTrend: adaptiveProfile.stressTrend,
        recentSleepAverage:
          typeof historyQuery.data?.[0]?.sleep_hours === "number" ? historyQuery.data[0].sleep_hours : null,
        suggestedToolId: adaptiveProfile.suggestedProgram,
        timeOfDay: deriveToolkitTimeOfDay(new Date().getHours()),
      }),
    [
      adaptiveProfile.fatigueTrend,
      adaptiveProfile.lowEnergyMode,
      adaptiveProfile.stressTrend,
      adaptiveProfile.suggestedProgram,
      historyQuery.data,
      lowEnergyAssist.active,
    ],
  );
  const emotionalToolkitTools = useMemo(
    () =>
      emotionalToolkit.surfacedToolIds
        .map((toolId) => getProgramToolById(toolId))
        .filter((tool): tool is ProgramTool => Boolean(tool)),
    [emotionalToolkit.surfacedToolIds],
  );
  const freeProgramTools = useMemo(
    () =>
      FREE_PROGRAM_TOOL_IDS
        .map((toolId) => getProgramToolById(toolId))
        .filter((tool): tool is ProgramTool => Boolean(tool)),
    [],
  );
  const premiumProgramTools = useMemo(
    () =>
      PREMIUM_PROGRAM_TOOL_IDS
        .map((toolId) => getProgramToolById(toolId))
        .filter((tool): tool is ProgramTool => Boolean(tool)),
    [],
  );
  const visibleProgramTools = useMemo(
    () => [...freeProgramTools, ...premiumProgramTools],
    [freeProgramTools, premiumProgramTools],
  );

  useEffect(() => {
    if (!__DEV__) {
      return;
    }

    console.log("[programs]", {
      totalPrograms: visibleProgramTools.length,
      filteredPrograms: visibleProgramTools.length,
      visiblePrograms: visibleProgramTools.map((tool) => tool.title),
      activeCategory: sectionParam ?? null,
      activeFilter: toolParam ?? exerciseParam ?? null,
      premiumStatus: premium.hasPremiumAccess,
      lowEnergyModeEnabled: lowEnergyMode.enabled,
      adaptiveLowEnergyMode: adaptiveProfile.lowEnergyMode,
      lowEnergyAssistActive: lowEnergyAssist.active,
      freeProgramCount: freeProgramTools.length,
      premiumProgramCount: premiumProgramTools.length,
    });
  }, [
    adaptiveProfile.lowEnergyMode,
    exerciseParam,
    freeProgramTools,
    lowEnergyAssist.active,
    lowEnergyMode.enabled,
    premium.hasPremiumAccess,
    premiumProgramTools,
    sectionParam,
    toolParam,
    visibleProgramTools,
  ]);

  const openTool = (toolId: string | null | undefined) => {
    const resolvedToolId = resolveProgramToolId(toolId);
    const tool = getProgramToolById(resolvedToolId);

    if (!tool) {
      if (__DEV__) {
        console.warn("This tool could not open right now.", { toolId });
      }
      Alert.alert("This tool could not open right now.");
      return;
    }

    shouldScrollToDetailRef.current = true;
    setSelectedToolId(tool.id);
    void programProgress.markOpened(tool.id);
  };

  const scrollToSelectedToolDetail = useCallback(() => {
    const scrollToDetail = (retry = true) => {
      const targetY = detailCardYRef.current;

      if (targetY > 0) {
        scrollRef.current?.scrollTo({
          y: Math.max(targetY - 20, 0),
          animated: true,
        });
        return;
      }

      if (retry) {
        setTimeout(() => scrollToDetail(false), 250);
      }
    };

    requestAnimationFrame(() => {
      setTimeout(scrollToDetail, 80);
    });
  }, []);

  const scrollToToolCard = useCallback((toolId: string) => {
    const scrollToCard = (retry = true) => {
      const targetY = toolCardPositionsRef.current[toolId];

      if (typeof targetY === "number") {
        scrollRef.current?.scrollTo({
          y: Math.max(targetY - 16, 0),
          animated: true,
        });
        return;
      }

      if (retry) {
        setTimeout(() => scrollToCard(false), 250);
      }
    };

    requestAnimationFrame(() => {
      setTimeout(scrollToCard, 80);
    });
  }, []);
  const sleepRecoverySupport = useMemo(
    () =>
      deriveSleepRecoverySupport({
        timeOfDay: deriveToolkitTimeOfDay(new Date().getHours()),
        stressTrend: adaptiveProfile.stressTrend,
        fatigueTrend: adaptiveProfile.fatigueTrend,
        recentSleepAverage:
          typeof historyQuery.data?.[0]?.sleep_hours === "number" ? historyQuery.data[0].sleep_hours : null,
        lowEnergyMode: adaptiveProfile.lowEnergyMode,
        lowEnergyAssistActive: lowEnergyAssist.active,
      }),
    [
      adaptiveProfile.fatigueTrend,
      adaptiveProfile.lowEnergyMode,
      adaptiveProfile.stressTrend,
      historyQuery.data,
      lowEnergyAssist.active,
    ],
  );
  const sleepSupportTools = useMemo(
    () =>
      sleepRecoverySupport.surfacedToolIds
        .map((toolId) => getProgramToolById(toolId))
        .filter((tool): tool is ProgramTool => Boolean(tool)),
    [sleepRecoverySupport.surfacedToolIds],
  );
  const cognitiveSupport = useMemo(
    () =>
      deriveCognitiveSupport({
        brainFog:
          typeof historyQuery.data?.[0]?.brain_fog === "number" ? historyQuery.data[0].brain_fog : null,
        fatigueTrend: adaptiveProfile.fatigueTrend,
        stressTrend: adaptiveProfile.stressTrend,
        lowEnergyMode: adaptiveProfile.lowEnergyMode,
        lowEnergyAssistActive: lowEnergyAssist.active,
        recentToolIds: programProgress.progress.recentToolIds,
        lastOpenedToolId: programProgress.progress.lastOpenedToolId,
      }),
    [
      adaptiveProfile.fatigueTrend,
      adaptiveProfile.lowEnergyMode,
      adaptiveProfile.stressTrend,
      historyQuery.data,
      lowEnergyAssist.active,
      programProgress.progress.lastOpenedToolId,
      programProgress.progress.recentToolIds,
    ],
  );
  const cognitiveSupportTools = useMemo(
    () =>
      cognitiveSupport.surfacedToolIds
        .map((toolId) => getProgramToolById(toolId))
        .filter((tool): tool is ProgramTool => Boolean(tool)),
    [cognitiveSupport.surfacedToolIds],
  );
  const communicationSupport = useMemo(
    () =>
      deriveCommunicationSupport({
        stressTrend: adaptiveProfile.stressTrend,
        fatigueTrend: adaptiveProfile.fatigueTrend,
        brainFog:
          typeof historyQuery.data?.[0]?.brain_fog === "number" ? historyQuery.data[0].brain_fog : null,
        lowEnergyMode: adaptiveProfile.lowEnergyMode,
        lowEnergyAssistActive: lowEnergyAssist.active,
        recentToolIds: programProgress.progress.recentToolIds,
        lastOpenedToolId: programProgress.progress.lastOpenedToolId,
      }),
    [
      adaptiveProfile.fatigueTrend,
      adaptiveProfile.lowEnergyMode,
      adaptiveProfile.stressTrend,
      historyQuery.data,
      lowEnergyAssist.active,
      programProgress.progress.lastOpenedToolId,
      programProgress.progress.recentToolIds,
    ],
  );
  const communicationSupportTools = useMemo(
    () =>
      communicationSupport.surfacedToolIds
        .map((toolId) => getProgramToolById(toolId))
        .filter((tool): tool is ProgramTool => Boolean(tool)),
    [communicationSupport.surfacedToolIds],
  );
  const difficultDaySupport = useMemo(
    () =>
      deriveDifficultDaySupport({
        fatigueTrend: adaptiveProfile.fatigueTrend,
        stressTrend: adaptiveProfile.stressTrend,
        brainFog:
          typeof historyQuery.data?.[0]?.brain_fog === "number" ? historyQuery.data[0].brain_fog : null,
        lowEnergyMode: adaptiveProfile.lowEnergyMode,
        lowEnergyAssistActive: lowEnergyAssist.active,
        recentToolIds: programProgress.progress.recentToolIds,
        lastOpenedToolId: programProgress.progress.lastOpenedToolId,
      }),
    [
      adaptiveProfile.fatigueTrend,
      adaptiveProfile.lowEnergyMode,
      adaptiveProfile.stressTrend,
      historyQuery.data,
      lowEnergyAssist.active,
      programProgress.progress.lastOpenedToolId,
      programProgress.progress.recentToolIds,
    ],
  );
  const difficultDayTools = useMemo(
    () =>
      difficultDaySupport.surfacedToolIds
        .map((toolId) => getProgramToolById(toolId))
        .filter((tool): tool is ProgramTool => Boolean(tool)),
    [difficultDaySupport.surfacedToolIds],
  );
  const emotionalReset = useMemo(
    () =>
      deriveEmotionalReset({
        fatigueTrend: adaptiveProfile.fatigueTrend,
        stressTrend: adaptiveProfile.stressTrend,
        brainFog:
          typeof historyQuery.data?.[0]?.brain_fog === "number" ? historyQuery.data[0].brain_fog : null,
        lowEnergyMode: adaptiveProfile.lowEnergyMode,
        lowEnergyAssistActive: lowEnergyAssist.active,
        recentToolIds: programProgress.progress.recentToolIds,
        lastOpenedToolId: programProgress.progress.lastOpenedToolId,
      }),
    [
      adaptiveProfile.fatigueTrend,
      adaptiveProfile.lowEnergyMode,
      adaptiveProfile.stressTrend,
      historyQuery.data,
      lowEnergyAssist.active,
      programProgress.progress.lastOpenedToolId,
      programProgress.progress.recentToolIds,
    ],
  );
  const emotionalResetTools = useMemo(
    () =>
      emotionalReset.surfacedToolIds
        .map((toolId) => getProgramToolById(toolId))
        .filter((tool): tool is ProgramTool => Boolean(tool)),
    [emotionalReset.surfacedToolIds],
  );
  const mentalExhaustion = useMemo(
    () =>
      deriveMentalExhaustionSupport({
        fatigueTrend: adaptiveProfile.fatigueTrend,
        stressTrend: adaptiveProfile.stressTrend,
        brainFog:
          typeof historyQuery.data?.[0]?.brain_fog === "number" ? historyQuery.data[0].brain_fog : null,
        lowEnergyMode: adaptiveProfile.lowEnergyMode,
        lowEnergyAssistActive: lowEnergyAssist.active,
        recentToolIds: programProgress.progress.recentToolIds,
        lastOpenedToolId: programProgress.progress.lastOpenedToolId,
      }),
    [
      adaptiveProfile.fatigueTrend,
      adaptiveProfile.lowEnergyMode,
      adaptiveProfile.stressTrend,
      historyQuery.data,
      lowEnergyAssist.active,
      programProgress.progress.lastOpenedToolId,
      programProgress.progress.recentToolIds,
    ],
  );
  const mentalExhaustionTools = useMemo(
    () =>
      mentalExhaustion.surfacedToolIds
        .map((toolId) => getProgramToolById(toolId))
        .filter((tool): tool is ProgramTool => Boolean(tool)),
    [mentalExhaustion.surfacedToolIds],
  );
  const calmGuidance = useMemo(
    () =>
      deriveCalmGuidance({
        fatigueTrend: adaptiveProfile.fatigueTrend,
        stressTrend: adaptiveProfile.stressTrend,
        brainFog:
          typeof historyQuery.data?.[0]?.brain_fog === "number" ? historyQuery.data[0].brain_fog : null,
        lowEnergyMode: adaptiveProfile.lowEnergyMode,
        lowEnergyAssistActive: lowEnergyAssist.active,
        recentToolIds: programProgress.progress.recentToolIds,
        lastOpenedToolId: programProgress.progress.lastOpenedToolId,
      }),
    [
      adaptiveProfile.fatigueTrend,
      adaptiveProfile.lowEnergyMode,
      adaptiveProfile.stressTrend,
      historyQuery.data,
      lowEnergyAssist.active,
      programProgress.progress.lastOpenedToolId,
      programProgress.progress.recentToolIds,
    ],
  );
  const calmGuidanceTools = useMemo(
    () =>
      calmGuidance.surfacedToolIds
        .map((toolId) => getProgramToolById(toolId))
        .filter((tool): tool is ProgramTool => Boolean(tool)),
    [calmGuidance.surfacedToolIds],
  );
  const recoveryRhythm = useMemo(
    () =>
      deriveRecoveryRhythm({
        fatigueTrend: adaptiveProfile.fatigueTrend,
        stressTrend: adaptiveProfile.stressTrend,
        recentSleepAverage:
          typeof historyQuery.data?.[0]?.sleep_hours === "number" ? historyQuery.data[0].sleep_hours : null,
        recentEntries: historyQuery.data ?? [],
        lowEnergyMode: adaptiveProfile.lowEnergyMode,
        lowEnergyAssistActive: lowEnergyAssist.active,
      }),
    [
      adaptiveProfile.fatigueTrend,
      adaptiveProfile.lowEnergyMode,
      adaptiveProfile.stressTrend,
      historyQuery.data,
      lowEnergyAssist.active,
    ],
  );

  useEffect(() => {
    if (__DEV__) {
      console.log("[programs-deeplink]", { sectionParam, toolParam, exerciseParam });
    }

    if (sectionParam !== "exercises") {
      return;
    }

    const timeoutId = setTimeout(() => {
      scrollRef.current?.scrollTo({
        y: Math.max(exerciseSectionYRef.current - 20, 0),
        animated: true,
      });
    }, 350);

    return () => clearTimeout(timeoutId);
  }, [exerciseParam, sectionParam, toolParam]);

  useEffect(() => {
    const resolvedToolId = resolveProgramToolId(toolParam);

    if (!resolvedToolId) {
      handledDeepLinkRef.current = null;
      return;
    }

    const tool = getProgramToolById(resolvedToolId);
    if (!tool) {
      if (__DEV__) {
        console.warn("This tool could not open right now.", { toolId: toolParam, resolvedToolId });
      }
      return;
    }

    if (handledDeepLinkRef.current === deepLinkKey && selectedToolId === tool.id) {
      return;
    }

    shouldScrollToDetailRef.current = true;
    handledDeepLinkRef.current = deepLinkKey;
    if (selectedToolId !== tool.id) {
      setSelectedToolId(tool.id);
    }
    scrollToToolCard(tool.id);
    scrollToSelectedToolDetail();
    void markOpenedRef.current(tool.id);
  }, [deepLinkKey, scrollToSelectedToolDetail, scrollToToolCard, selectedToolId, toolParam]);

  useEffect(() => {
    if (!activeTimerId || secondsRemaining === null) {
      timerCueStateRef.current = { halfwayPlayed: false, nearEndPlayed: false };
      clearBreathingAmbientTimeout();
      void stopAmbientLoop();
      return;
    }

    if (!timerCueStateRef.current.halfwayPlayed && secondsRemaining === 30) {
      timerCueStateRef.current.halfwayPlayed = true;
      logTimerSound("timer-halfway-trigger");
      void playSoundCue("timer-halfway", calmEnvironment.soundEffects);
    }

    if (!timerCueStateRef.current.nearEndPlayed && secondsRemaining === 10) {
      timerCueStateRef.current.nearEndPlayed = true;
      logTimerSound("timer-near-end-trigger");
      void playSoundCue("timer-near-end", calmEnvironment.soundEffects);
    }

    if (secondsRemaining <= 0) {
      setCompletedToolId(activeTimerId);
      void programProgress.markCompleted(activeTimerId);
      setActiveTimerId(null);
      setSecondsRemaining(null);
      const completedTimerId = activeTimerId;
      logTimerSound(completedTimerId === "breathing-reset" ? "breathing-end-trigger" : "timer-end-trigger", {
        toolId: completedTimerId,
      });
      void playSoundCue(
        completedTimerId === "breathing-reset" ? "breathing-end" : "timer-end",
        calmEnvironment.soundEffects,
      );
      clearBreathingAmbientTimeout();
      void stopAmbientLoop("timer-completed", setAmbientDebugState);
      return;
    }

    const timeoutId = setTimeout(() => {
      setSecondsRemaining((current) => (current === null ? current : current - 1));
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [activeTimerId, calmEnvironment.soundEffects, clearBreathingAmbientTimeout, logTimerSound, programProgress, secondsRemaining]);

  useEffect(() => {
    if (activeTool?.id !== "breathing-reset" || secondsRemaining === null) {
      breathingScale.stopAnimation();
      breathingScale.setValue(0);
      lastBreathingPhaseRef.current = null;
      return;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(breathingScale, {
          toValue: 1,
          duration: 4000,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.delay(2000),
        Animated.timing(breathingScale, {
          toValue: 0,
          duration: 6000,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [activeTool?.id, breathingScale, secondsRemaining]);

  useEffect(() => {
    if (!activeBreathingPhase) {
      return;
    }

    if (lastBreathingPhaseRef.current === activeBreathingPhase.label) {
      return;
    }

    lastBreathingPhaseRef.current = activeBreathingPhase.label;
    void Haptics.selectionAsync().catch(() => undefined);
  }, [activeBreathingPhase]);

  useEffect(() => {
    if (!audioSessionState?.isPlaying || !selectedAudioSession || audioSessionState.sessionId !== selectedAudioSession.id) {
      audioCueStateRef.current = { nearEndPlayed: false };
      if (!audioSessionState?.isPlaying) {
        void stopAmbientLoop();
      }
      return;
    }

    if (!audioCueStateRef.current.nearEndPlayed && audioSessionState.totalSecondsRemaining === 15) {
      audioCueStateRef.current.nearEndPlayed = true;
      logTimerSound("audio-near-end-trigger", {
        sessionId: audioSessionState.sessionId,
      });
      void playSoundCue("timer-near-end", calmEnvironment.soundEffects);
    }

    if (audioSessionState.totalSecondsRemaining <= 0) {
      if (selectedTool) {
        setCompletedToolId(selectedTool.id);
        void programProgress.markCompleted(selectedTool.id);
      }
      setAudioSessionState(null);
      void programProgress.clearAudioSession();
      logTimerSound("audio-end-trigger", {
        sessionId: audioSessionState.sessionId,
      });
      void playSoundCue("timer-end", calmEnvironment.soundEffects);
      void stopAmbientLoop();
      return;
    }

    const phase = selectedAudioSession.phases[audioSessionState.phaseIndex];
    if (!phase) {
      setAudioSessionState(null);
      void programProgress.clearAudioSession();
      return;
    }

    const timeoutId = setTimeout(() => {
      setAudioSessionState((current) => {
        if (!current || current.sessionId !== selectedAudioSession.id || !current.isPlaying) {
          return current;
        }

        if (current.phaseSecondsRemaining > 1) {
          return {
            ...current,
            phaseSecondsRemaining: current.phaseSecondsRemaining - 1,
            totalSecondsRemaining: Math.max(0, current.totalSecondsRemaining - 1),
          };
        }

        const nextPhaseIndex = current.phaseIndex + 1;
        const nextPhase = selectedAudioSession.phases[nextPhaseIndex];

        if (!nextPhase) {
          if (selectedTool) {
            setCompletedToolId(selectedTool.id);
            void programProgress.markCompleted(selectedTool.id);
          }
          void programProgress.clearAudioSession();
          logTimerSound("audio-end-trigger", {
            sessionId: current.sessionId,
          });
          void playSoundCue("timer-end", calmEnvironment.soundEffects);
          void stopAmbientLoop();
          return null;
        }

        if (current.hapticsEnabled && selectedAudioSession.supportsHaptics) {
          void Haptics.selectionAsync().catch(() => undefined);
        }

        const nextState = {
          ...current,
          phaseIndex: nextPhaseIndex,
          phaseSecondsRemaining: nextPhase.seconds,
          totalSecondsRemaining: Math.max(0, current.totalSecondsRemaining - 1),
        };
        void programProgress.saveAudioSession({
          ...nextState,
          updatedAt: new Date().toISOString(),
        });
        return nextState;
      });
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [audioSessionState, calmEnvironment.soundEffects, logTimerSound, programProgress, selectedAudioSession, selectedTool]);

  useEffect(() => {
    if (!selectedToolId) {
      shouldScrollToDetailRef.current = false;
      return;
    }

    if (!selectedTool) {
      if (__DEV__) {
        console.warn("This tool could not open right now.", { selectedToolId });
      }
      Alert.alert("This tool could not open right now.");
      setSelectedToolId(null);
      shouldScrollToDetailRef.current = false;
      return;
    }
  }, [selectedTool, selectedToolId]);

  useEffect(() => {
    if (!programProgress.progress.audioSession) {
      return;
    }

    setAudioSessionState(programProgress.progress.audioSession);
  }, [programProgress.progress.audioSession]);

  const premiumLibraryPreview = useMemo(
    () => PROGRAM_MODULES.filter((module) => module.premiumFeature === "guided_programs").slice(0, 4),
    [],
  );

  const groupedTools = useMemo(
    () =>
      PROGRAM_SECTIONS.map((section) => ({
        section,
        items: PROGRAM_MODULES.filter((module) => {
          if (module.section !== section) {
            return false;
          }

          if (module.premiumFeature === "guided_programs" && !hasGuidedPrograms) {
            return false;
          }

          return true;
        }).sort((left, right) => {
          const leftHasSuggestion = suggestedModule?.id === left.id ? 1 : 0;
          const rightHasSuggestion = suggestedModule?.id === right.id ? 1 : 0;
          if (leftHasSuggestion !== rightHasSuggestion) {
            return rightHasSuggestion - leftHasSuggestion;
          }

          const leftIsActive = getProgramToolsByModuleId(left.id).some(
            (tool) => tool.id === programProgress.progress.activeToolId || tool.id === programProgress.progress.lastOpenedToolId,
          ) ? 1 : 0;
          const rightIsActive = getProgramToolsByModuleId(right.id).some(
            (tool) => tool.id === programProgress.progress.activeToolId || tool.id === programProgress.progress.lastOpenedToolId,
          ) ? 1 : 0;

          if (leftIsActive !== rightIsActive) {
            return rightIsActive - leftIsActive;
          }

          return left.title.localeCompare(right.title);
        }),
        lockedCount: PROGRAM_MODULES.filter(
          (module) => module.section === section && module.premiumFeature === "guided_programs" && !hasGuidedPrograms,
        ).length,
      })),
    [hasGuidedPrograms, programProgress.progress.activeToolId, programProgress.progress.lastOpenedToolId, suggestedModule?.id],
  );

  const startTool = (tool: ProgramTool) => {
    setCompletedToolId(null);
    void programProgress.markOpened(tool.id);
    void programProgress.markStarted(tool.id);

    if (tool.durationSeconds) {
      shouldScrollToTimerRef.current = true;
      timerCueStateRef.current = { halfwayPlayed: false, nearEndPlayed: false };
      setActiveTimerId(tool.id);
      setSecondsRemaining(tool.durationSeconds);
      logTimerSound(tool.id === "breathing-reset" ? "breathing-start-trigger" : "timer-start-trigger", {
        toolId: tool.id,
      });
      if (tool.id === "breathing-reset") {
        startBreathingResetAudio();
      } else {
        void playSoundCue("timer-start", calmEnvironment.soundEffects);
      }
    } else {
      setActiveTimerId(null);
      setSecondsRemaining(null);
      clearBreathingAmbientTimeout();
      void stopAmbientLoop("non-breathing-tool-started", setAmbientDebugState);
    }
  };

  const startAudioSession = (tool: ProgramTool) => {
    const session = getCalmAudioSessionByToolId(tool.id);
    if (!session) {
      return;
    }

    const nextState: CalmAudioSessionProgress = {
      sessionId: session.id,
      toolId: tool.id,
      phaseIndex: 0,
      phaseSecondsRemaining: session.phases[0]?.seconds ?? session.totalSeconds,
      totalSecondsRemaining: session.totalSeconds,
      isPlaying: true,
      hapticsEnabled: session.supportsHaptics,
      updatedAt: new Date().toISOString(),
    };

    setCompletedToolId(null);
    audioCueStateRef.current = { nearEndPlayed: false };
    setAudioSessionState(nextState);
    void programProgress.markOpened(tool.id);
    void programProgress.markStarted(tool.id);
    void programProgress.saveAudioSession(nextState);
    logTimerSound("audio-start-trigger", {
      toolId: tool.id,
      sessionId: session.id,
    });
    void playSoundCue("timer-start", calmEnvironment.soundEffects);
    void startAmbientLoop(calmEnvironment.backgroundAudio);

    if (nextState.hapticsEnabled && session.supportsHaptics) {
      void Haptics.selectionAsync().catch(() => undefined);
    }
  };

  const pauseAudioSession = () => {
    setAudioSessionState((current) => {
      if (!current) {
        return current;
      }

      const nextState = {
        ...current,
        isPlaying: false,
        updatedAt: new Date().toISOString(),
      };
      void programProgress.saveAudioSession(nextState);
      return nextState;
    });
    void stopAmbientLoop();
  };

  const resumeAudioSession = () => {
    setAudioSessionState((current) => {
      if (!current) {
        return current;
      }

      const nextState = {
        ...current,
        isPlaying: true,
        updatedAt: new Date().toISOString(),
      };
      void programProgress.saveAudioSession(nextState);
      return nextState;
    });
    void startAmbientLoop(calmEnvironment.backgroundAudio);
  };

  const stopAudioSession = () => {
    setAudioSessionState(null);
    void programProgress.clearAudioSession();
    void stopAmbientLoop();
  };

  const toggleAudioHaptics = () => {
    setAudioSessionState((current) => {
      if (!current) {
        return current;
      }

      const nextState = {
        ...current,
        hapticsEnabled: !current.hapticsEnabled,
        updatedAt: new Date().toISOString(),
      };
      void programProgress.saveAudioSession(nextState);
      return nextState;
    });
  };

  const completeTool = (tool: ProgramTool) => {
    setCompletedToolId(tool.id);
    void programProgress.markCompleted(tool.id);
    if (activeTimerId === tool.id) {
      setActiveTimerId(null);
      setSecondsRemaining(null);
      void stopAmbientLoop();
    }
    if (audioSessionState?.toolId === tool.id) {
      setAudioSessionState(null);
      void programProgress.clearAudioSession();
      void stopAmbientLoop();
    }

    void growth.recordEvent("program_completed", {
      toolId: tool.id,
    });
    void growth.maybePromptForReview();
  };

  const resetCompletedToolState = (toolId: string) => {
    if (completedToolId === toolId) {
      setCompletedToolId(null);
    }
  };

  const stopTimer = () => {
    setActiveTimerId(null);
    setSecondsRemaining(null);
    void programProgress.clearActiveTool();
    void stopAmbientLoop();
  };

  const isSelectedToolCompleted = selectedTool
    ? programProgress.progress.completedToolIds.includes(selectedTool.id)
    : false;
  const activeContinuationTool = useMemo(
    () => getProgramToolById(programProgress.progress.activeToolId ?? programProgress.progress.lastOpenedToolId),
    [programProgress.progress.activeToolId, programProgress.progress.lastOpenedToolId],
  );
  const routineDisruption = useMemo(
    () =>
      detectRoutineDisruption({
        lifecycleStage: lifecycleProfile.stage,
        previousActiveGapDays: lifecycleProfile.previousActiveGapDays,
        weeklyCheckIns,
      }),
    [lifecycleProfile.previousActiveGapDays, lifecycleProfile.stage, weeklyCheckIns],
  );
  const transitionSupport = useMemo(
    () =>
      deriveTransitionSupport({
        fatigueTrend: adaptiveProfile.fatigueTrend,
        stressTrend: adaptiveProfile.stressTrend,
        recentEntries: historyQuery.data ?? [],
        lowEnergyMode: adaptiveProfile.lowEnergyMode,
        lowEnergyAssistActive: lowEnergyAssist.active,
        disruptionDetected: routineDisruption.disrupted,
        recentToolIds: programProgress.progress.recentToolIds,
        lastOpenedToolId: programProgress.progress.lastOpenedToolId,
      }),
    [
      adaptiveProfile.fatigueTrend,
      adaptiveProfile.lowEnergyMode,
      adaptiveProfile.stressTrend,
      historyQuery.data,
      lowEnergyAssist.active,
      programProgress.progress.lastOpenedToolId,
      programProgress.progress.recentToolIds,
      routineDisruption.disrupted,
    ],
  );
  const transitionSupportTools = useMemo(
    () =>
      transitionSupport.surfacedToolIds
        .map((toolId) => getProgramToolById(toolId))
        .filter((tool): tool is ProgramTool => Boolean(tool)),
    [transitionSupport.surfacedToolIds],
  );
  const setbackRecovery = useMemo(
    () =>
      deriveSetbackRecovery({
        fatigueTrend: adaptiveProfile.fatigueTrend,
        stressTrend: adaptiveProfile.stressTrend,
        lowEnergyMode: adaptiveProfile.lowEnergyMode,
        lowEnergyAssistActive: lowEnergyAssist.active,
        disruptionDetected: routineDisruption.disrupted,
        disruptionSeverity: routineDisruption.severity,
        recentToolIds: programProgress.progress.recentToolIds,
        lastOpenedToolId: programProgress.progress.lastOpenedToolId,
        recentCheckInCount: weeklyCheckIns,
      }),
    [
      adaptiveProfile.fatigueTrend,
      adaptiveProfile.lowEnergyMode,
      adaptiveProfile.stressTrend,
      lowEnergyAssist.active,
      programProgress.progress.lastOpenedToolId,
      programProgress.progress.recentToolIds,
      routineDisruption.disrupted,
      routineDisruption.severity,
      weeklyCheckIns,
    ],
  );
  const setbackRecoveryTools = useMemo(
    () =>
      setbackRecovery.surfacedToolIds
        .map((toolId) => getProgramToolById(toolId))
        .filter((tool): tool is ProgramTool => Boolean(tool)),
    [setbackRecovery.surfacedToolIds],
  );
  const futureStability = useMemo(
    () =>
      deriveFutureStability({
        fatigueTrend: adaptiveProfile.fatigueTrend,
        stressTrend: adaptiveProfile.stressTrend,
        recentSleepAverage:
          typeof historyQuery.data?.[0]?.sleep_hours === "number" ? historyQuery.data[0].sleep_hours : null,
        lowEnergyMode: adaptiveProfile.lowEnergyMode,
        lowEnergyAssistActive: lowEnergyAssist.active,
        recentToolIds: programProgress.progress.recentToolIds,
        lastOpenedToolId: programProgress.progress.lastOpenedToolId,
      }),
    [
      adaptiveProfile.fatigueTrend,
      adaptiveProfile.lowEnergyMode,
      adaptiveProfile.stressTrend,
      historyQuery.data,
      lowEnergyAssist.active,
      programProgress.progress.lastOpenedToolId,
      programProgress.progress.recentToolIds,
    ],
  );
  const futureStabilityTools = useMemo(
    () =>
      futureStability.surfacedToolIds
        .map((toolId) => getProgramToolById(toolId))
        .filter((tool): tool is ProgramTool => Boolean(tool)),
    [futureStability.surfacedToolIds],
  );
  const recoveryExperience = useMemo(
    () =>
      deriveRecoveryExperience({
        adaptiveStatePrimary,
        disruption: routineDisruption,
      }),
    [adaptiveStatePrimary, routineDisruption],
  );
  const flexibleRoutineState = useMemo(
    () =>
      deriveFlexibleRoutineState({
        adaptiveStatePrimary,
        hasActiveRoutine: Boolean(activeContinuationTool),
        recoveryExperience,
      }),
    [
      activeContinuationTool,
      adaptiveStatePrimary,
      recoveryExperience,
    ],
  );
  const resumableProgramFlow = useMemo(
    () =>
      activeContinuationTool
        ? deriveResumableProgramFlow({
            toolTitle: activeContinuationTool.title,
            continuationLabel: activeContinuationTool.continuationLabel,
            routineState: flexibleRoutineState,
          })
        : null,
    [activeContinuationTool, flexibleRoutineState],
  );
  const guidedSupportPrograms = useMemo(
    () =>
      deriveSupportPrograms({
        adaptiveStatePrimary,
        suggestedToolId: adaptiveProfile.suggestedProgram,
        supportTags: adaptiveProfile.preferredProgramTags ?? [],
      }),
    [adaptiveProfile.preferredProgramTags, adaptiveProfile.suggestedProgram, adaptiveStatePrimary],
  );
  const recoveryPath = useMemo(
    () =>
      deriveRecoveryPaths({
        adaptiveStatePrimary,
        hasDisruption: routineDisruption.disrupted,
      }),
    [adaptiveStatePrimary, routineDisruption.disrupted],
  );
  const pauseResumeState = useMemo(
    () =>
      derivePauseResumeState({
        adaptiveStatePrimary,
        hasActiveTool: Boolean(programProgress.progress.activeToolId),
        hasRecentTool: Boolean(programProgress.progress.lastOpenedToolId),
      }),
    [adaptiveStatePrimary, programProgress.progress.activeToolId, programProgress.progress.lastOpenedToolId],
  );
  const interruptionNormalization = useMemo(
    () =>
      normalizeProgramInterruptions({
        hadInterruption: routineDisruption.disrupted || Boolean(programProgress.progress.lastOpenedToolId && !programProgress.progress.activeToolId),
        adaptiveStatePrimary,
      }),
    [adaptiveStatePrimary, programProgress.progress.activeToolId, programProgress.progress.lastOpenedToolId, routineDisruption.disrupted],
  );
  const programIntensity = useMemo(
    () =>
      deriveProgramIntensity({
        adaptiveStatePrimary,
        lowEnergyMode: adaptiveProfile.lowEnergyMode,
        stressTrend: adaptiveProfile.stressTrend === "elevated" ? "elevated" : "steady",
      }),
    [adaptiveProfile.lowEnergyMode, adaptiveProfile.stressTrend, adaptiveStatePrimary],
  );
  const selectedToolMode = useMemo(
    () =>
      selectedTool
        ? deriveLowEnergyProgramMode({
            intensity: programIntensity,
            stepCount: selectedTool.steps.length,
          })
        : null,
    [programIntensity, selectedTool],
  );
  const groundingSupport = useMemo(
    () =>
      deriveGroundingSupport({
        adaptiveStatePrimary,
        intensity: programIntensity,
      }),
    [adaptiveStatePrimary, programIntensity],
  );
  const recoverySupport = useMemo(
    () =>
      deriveRecoverySupport({
        adaptiveStatePrimary,
        hasRecentDisruption: routineDisruption.disrupted,
      }),
    [adaptiveStatePrimary, routineDisruption.disrupted],
  );
  const difficultPeriodPrograms = useMemo(
    () =>
      deriveDifficultPeriodPrograms({
        adaptiveStatePrimary,
        suggestedToolId: adaptiveProfile.suggestedProgram,
      }),
    [adaptiveProfile.suggestedProgram, adaptiveStatePrimary],
  );
  const recommendedProgramCopy = useMemo(
    () =>
      suggestedModule
        ? deriveRecommendedProgramCopy({
            module: suggestedModule,
            lowEnergyMode: adaptiveProfile.lowEnergyMode,
            highFatigue: adaptiveProfile.fatigueTrend === "high",
            overwhelmed: adaptiveStatePrimary === "OVERWHELMED",
          })
        : null,
    [adaptiveProfile.fatigueTrend, adaptiveProfile.lowEnergyMode, adaptiveStatePrimary, suggestedModule],
  );
  const shouldSimplifyPrograms =
    adaptiveProfile.lowEnergyMode || adaptiveStatePrimary === "OVERWHELMED" || lowEnergyAssist.active;
  const canUseSuggestedTool =
    !suggestedTool?.premiumFeature || (suggestedTool.premiumFeature === "guided_programs" && hasGuidedPrograms);
  const canUseSelectedTool =
    !selectedTool?.premiumFeature || (selectedTool.premiumFeature === "guided_programs" && hasGuidedPrograms);
  const canUseSelectedAudioSession = Boolean(selectedAudioSession && hasCalmAudioSupport);
  const isSelectedAudioActive = Boolean(
    selectedAudioSession && audioSessionState?.sessionId === selectedAudioSession.id,
  );
  const visibleStepCount = selectedToolMode?.visibleStepCount ?? selectedTool?.steps.length ?? 0;
  const visibleToolSteps = selectedTool
    ? selectedTool.steps.slice(0, Math.min(visibleStepCount, lowEnergyAssist.cognitiveLoad.maxVisibleSteps))
    : [];
  const selectedWorkflow = useMemo(
    () => (selectedTool ? getProgramWorkflow(selectedTool) : null),
    [selectedTool],
  );
  const selectedWorkflowAnswers = useMemo(
    () => (selectedTool ? workflowAnswers[selectedTool.id] ?? {} : {}),
    [selectedTool, workflowAnswers],
  );
  const selectedWorkflowSummary = selectedTool ? savedWorkflowByToolId[selectedTool.id] ?? null : null;
  const selectedWorkflowHasInput = Object.values(selectedWorkflowAnswers).some((value) => value.trim().length > 0);
  const selectedWorkflowQuestions = useMemo(() => {
    if (!selectedWorkflow) {
      return [];
    }

    const visibleQuestionIds = selectedWorkflow.adaptiveQuestionIds?.(selectedWorkflowAnswers);
    if (!visibleQuestionIds) {
      return selectedWorkflow.questions;
    }

    return selectedWorkflow.questions.filter((question) => visibleQuestionIds.includes(question.id));
  }, [selectedWorkflow, selectedWorkflowAnswers]);

  const getModuleProgressSummary = (module: ProgramModule) => {
    const tools = getProgramToolsByModuleId(module.id);
    const completedCount = tools.filter((tool) => programProgress.progress.completedToolIds.includes(tool.id)).length;
    return {
      completedCount,
      totalCount: tools.length,
      isCompleted: completedCount === tools.length && tools.length > 0,
    };
  };

  useEffect(() => {
    setShowSelectedToolDetails(false);
  }, [selectedToolId]);

  const updateWorkflowAnswer = (toolId: string, questionId: string, value: string) => {
    resetCompletedToolState(toolId);
    setWorkflowAnswers((current) => ({
      ...current,
      [toolId]: {
        ...(current[toolId] ?? {}),
        [questionId]: value,
      },
    }));
  };

  const setCustomWorkflowFieldVisible = (toolId: string, questionId: string, visible: boolean) => {
    setCustomWorkflowFields((current) => ({
      ...current,
      [toolId]: {
        ...(current[toolId] ?? {}),
        [questionId]: visible,
      },
    }));
  };

  const updateCustomWorkflowAnswer = (toolId: string, question: ProgramWorkflowQuestion, customValue: string) => {
    const currentValue = workflowAnswers[toolId]?.[question.id];

    if (question.type === "multiChoice") {
      const selectedPredefinedValues = getSelectedListValues(currentValue).filter((value) =>
        (question.options ?? []).includes(value),
      );
      const customValues = customValue
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);

      updateWorkflowAnswer(toolId, question.id, [...selectedPredefinedValues, ...customValues].join(", "));
      return;
    }

    updateWorkflowAnswer(toolId, question.id, customValue);
  };

  const triggerResetToolFromOption = (option: string) => {
    if (!RESET_TOOL_OPTIONS.has(option)) {
      return;
    }

    const resetTool = getProgramToolById("breathing-reset");
    if (resetTool) {
      shouldScrollToDetailRef.current = false;
      setSelectedToolId(resetTool.id);
      startTool(resetTool);
    }
  };

  const saveWorkflow = (tool: ProgramTool) => {
    const answers = workflowAnswers[tool.id] ?? {};
    const normalizedAnswers = Object.fromEntries(
      Object.entries(answers).map(([key, value]) => [key, value.trim()]),
    );

    setSavedWorkflowByToolId((current) => ({
      ...current,
      [tool.id]: normalizedAnswers,
    }));
    completeTool(tool);
  };

  const clearWorkflow = (tool: ProgramTool) => {
    setWorkflowAnswers((current) => ({
      ...current,
      [tool.id]: {},
    }));
    setCustomWorkflowFields((current) => ({
      ...current,
      [tool.id]: {},
    }));
    setSavedWorkflowByToolId((current) => {
      const next = { ...current };
      delete next[tool.id];
      return next;
    });
    resetCompletedToolState(tool.id);
  };

  const shareAppointmentSummary = async (mode: "share" | "pdf" | "email") => {
    const appointmentWorkflow = PROGRAM_TOOL_WORKFLOWS["appointment-prep"];
    const answers = savedWorkflowByToolId["appointment-prep"] ?? workflowAnswers["appointment-prep"] ?? {};
    const summaryText = buildWorkflowSummaryText({
      title: "Appointment summary",
      workflow: appointmentWorkflow,
      answers,
    });

    setAppointmentExportMessage(null);

    if (!Object.values(answers).some((value) => value.trim())) {
      setAppointmentExportMessage("Add at least one appointment detail first.");
      return;
    }

    try {
      if (mode === "share") {
        await Share.share({
          title: "Appointment summary",
          message: summaryText,
        });
        return;
      }

      if (mode === "email") {
        const url = `mailto:?subject=${encodeURIComponent("Appointment summary")}&body=${encodeURIComponent(summaryText)}`;
        const supported = await Linking.canOpenURL(url);
        if (!supported) {
          setAppointmentExportMessage("Email is not available on this device.");
          return;
        }
        await Linking.openURL(url);
        return;
      }

      setExportingAppointmentSummary(true);
      const result = await exportHealthSummary({
        title: "Appointment summary",
        subtitle: "Prepared in LiveWithMS",
        text: summaryText,
        sections: buildWorkflowExportSections(appointmentWorkflow, answers),
      });

      if (!result.ok) {
        setAppointmentExportMessage("Export was not available on this device. You can still share the summary text.");
      }
    } catch {
      setAppointmentExportMessage("Summary sharing was not available right now.");
    } finally {
      setExportingAppointmentSummary(false);
    }
  };

  if ((overviewQuery.isLoading && !overviewQuery.data) || (historyQuery.isLoading && !historyQuery.data)) {
    return <LoadingState message="Programs are settling in..." />;
  }

  if (overviewQuery.isError) {
    return <ErrorState message="This section may need another moment." onRetry={() => void overviewQuery.refetch()} />;
  }

  if (historyQuery.isError) {
    return <ErrorState message="Programs may need another moment." onRetry={() => void historyQuery.refetch()} />;
  }

  const renderToolCard = (tool: ProgramTool, options: { premium?: boolean } = {}) => {
    const title = PROGRAM_TOOL_LABELS[tool.id] ?? tool.title;
    const outcome = PROGRAM_TOOL_OUTCOMES[tool.id] ?? tool.description;
    const isLocked = Boolean(options.premium && !hasGuidedPrograms);
    const isSelected = selectedToolId === tool.id;
    const progressEntry = programProgress.progress.toolProgress[tool.id];
    const hasSavedSummary = Boolean(savedWorkflowByToolId[tool.id]);

    return (
      <Pressable
        key={tool.id}
        onLayout={(event) => {
          toolCardPositionsRef.current[tool.id] = event.nativeEvent.layout.y;
        }}
        onPress={() => {
          if (isLocked) {
            router.push("/premium?source=programs");
            return;
          }

          openTool(tool.id);
        }}
        accessibilityRole="button"
        accessibilityLabel={isLocked ? title + ". Premium tool. View Premium." : "Open " + title}
        style={({ pressed }) => [
          styles.operationalToolCard,
          isSelected && styles.operationalToolCardSelected,
          isLocked && styles.operationalToolCardLocked,
          pressed && styles.toolCardPressed,
        ]}
      >
        <View style={styles.toolTopRow}>
          <AppText style={styles.toolTitle}>{title}</AppText>
          <View style={styles.toolMetaLine}>
            <AppText style={styles.toolDuration}>{tool.durationLabel}</AppText>
            {options.premium ? <AppText style={styles.toolPremiumLabel}>Premium</AppText> : null}
            {hasSavedSummary && !isLocked ? <AppText style={styles.toolUsedLabel}>Saved</AppText> : null}
          </View>
        </View>
        <AppText style={styles.toolWhenToUse}>{tool.whenToUse}</AppText>
        <AppText style={styles.toolOutcome}>{outcome}</AppText>
        <View style={styles.toolFooter}>
          <AppText style={styles.toolOpenLabel}>{isLocked ? "View Premium" : isSelected ? "Open below" : "Open tool"}</AppText>
        </View>
      </Pressable>
    );
  };

  return (
    <AppScreen
      eyebrow="Programs"
      title="Support tools"
      subtitle="Choose a tool for what you need right now."
    >
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[
          styles.content,
          (adaptiveProfile.lowEnergyMode || lowEnergyAssist.active) && styles.contentLowEnergy,
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <View style={styles.sectionHeaderText}>
            <AppText style={styles.sectionTitle}>Support tools</AppText>
          </View>
          <View style={styles.sectionList}>{freeProgramTools.map((tool) => renderToolCard(tool))}</View>
        </View>

        <View
          style={styles.sectionBreak}
          onLayout={(event) => {
            exerciseSectionYRef.current = event.nativeEvent.layout.y;
          }}
        >
          <GentleExercisesSection
            hasPremiumAccess={premium.hasPremiumAccess}
            lowEnergyMode={adaptiveProfile.lowEnergyMode || lowEnergyAssist.active}
            initialExerciseId={deepLinkExerciseId as ExerciseId | null}
            onActiveExerciseLayout={(relativeY) => {
              scrollRef.current?.scrollTo({
                y: Math.max(exerciseSectionYRef.current + relativeY - 20, 0),
                animated: true,
              });
            }}
          />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeaderText}>
              <AppText style={styles.sectionTitle}>Premium tools</AppText>
              <AppText style={styles.sectionSubtitle}>Additional support for fatigue, planning, sleep, and cognitive overload.</AppText>
            </View>
          </View>
          <View style={styles.sectionList}>
            {premiumProgramTools.map((tool) => renderToolCard(tool, { premium: true }))}
          </View>
          {!hasGuidedPrograms ? (
            <AppButton
              label="View Premium"
              onPress={() => router.push("/premium?source=programs")}
              variant="secondary"
            />
          ) : null}
        </View>

        {activeContinuationTool && resumableProgramFlow ? (
          <View style={styles.navCard}>
            <AppText style={styles.cardTitle}>Continue recent tool</AppText>
            <AppText style={styles.resumeCopy}>{activeContinuationTool.title}</AppText>
            <AppButton
              label="Open tool"
              onPress={() => openTool(activeContinuationTool.id)}
              variant="secondary"
            />
          </View>
        ) : null}

        {activeTool && secondsRemaining !== null ? (
          <View
            style={[styles.timerCard, styles.timerCardActive, activeTool.id === "breathing-reset" && styles.breathingTimerCard]}
            onLayout={(event) => {
              timerCardYRef.current = event.nativeEvent.layout.y;
              if (shouldScrollToTimerRef.current) {
                scrollRef.current?.scrollTo({
                  y: Math.max(timerCardYRef.current - 20, 0),
                  animated: true,
                });
                shouldScrollToTimerRef.current = false;
              }
            }}
          >
            <AppText style={styles.timerKicker}>In progress</AppText>
            <AppText style={styles.timerTitle}>{PROGRAM_TOOL_LABELS[activeTool.id] ?? activeTool.title}</AppText>
            {activeTool.id === "breathing-reset" && activeBreathingPhase ? (
              <View style={styles.breathingGuide}>
                <Animated.View
                  style={[
                    styles.breathingCircle,
                    {
                      transform: [
                        {
                          scale: breathingScale.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.78, 1.12],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <AppText style={styles.breathingPhase}>{activeBreathingPhase.label}</AppText>
                </Animated.View>
                <AppText style={styles.breathingInstruction}>{activeBreathingPhase.instruction}</AppText>
              </View>
            ) : null}
            <AppText style={styles.timerValue}>{formatTime(secondsRemaining)}</AppText>
            <AppButton label="Stop timer" onPress={stopTimer} variant="secondary" />
          </View>
        ) : null}

        {selectedTool && completedToolId === selectedTool.id ? (
          <View style={styles.completionCard}>
            <AppText style={styles.completionTitle}>
              {selectedTool.id === "breathing-reset" ? "Reset complete." : "Tool saved."}
            </AppText>
            <AppText style={styles.completionBody}>
              {selectedTool.id === "breathing-reset"
                ? "Notice whether your body or thoughts feel even slightly steadier."
                : preventCompletionPressure(selectedTool.completionMessage)}
            </AppText>
          </View>
        ) : null}

        {selectedTool && canUseSelectedTool ? (
          <View
            style={styles.detailCard}
            onLayout={(event) => {
              detailCardYRef.current = event.nativeEvent.layout.y;
              if (shouldScrollToDetailRef.current) {
                scrollRef.current?.scrollTo({
                  y: Math.max(detailCardYRef.current - 20, 0),
                  animated: true,
                });
                shouldScrollToDetailRef.current = false;
              }
            }}
          >
            <View style={styles.detailHeader}>
              <View style={styles.detailHeaderText}>
                <AppText style={styles.detailSectionLabel}>{deriveProgramSectionLabel(selectedTool.section)}</AppText>
                <AppText style={styles.detailTitle}>{PROGRAM_TOOL_LABELS[selectedTool.id] ?? selectedTool.title}</AppText>
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
                <AppText style={styles.metaPillText}>{deriveProgramCategoryLabel(selectedTool.category)}</AppText>
              </View>
            </View>

            <AppText style={styles.whenToUse}>{selectedTool.whenToUse}</AppText>
            <AppText style={styles.detailBody}>{PROGRAM_TOOL_OUTCOMES[selectedTool.id] ?? selectedTool.description}</AppText>

            {selectedWorkflow ? (
              <View style={styles.workflowCard}>
                <View style={styles.workflowHeader}>
                  <AppText style={styles.workflowTitle}>{selectedWorkflow.title}</AppText>
                  <AppText style={styles.workflowProgress}>
                    {Object.values(selectedWorkflowAnswers).filter((value) => value.trim()).length}/{selectedWorkflowQuestions.length}
                  </AppText>
                </View>
                {selectedWorkflowQuestions.map((question, index) => (
                  <View key={question.id} style={styles.workflowQuestion}>
                    <View style={styles.workflowQuestionHeader}>
                      <View style={styles.stepBadge}>
                        <AppText style={styles.stepBadgeText}>{index + 1}</AppText>
                      </View>
                      <AppText style={styles.workflowQuestionLabel}>{question.label}</AppText>
                    </View>
                    {question.type === "choice" || question.type === "multiChoice" ? (
                      <View style={styles.choiceGroup}>
                        <View style={styles.choiceRow}>
                          {(question.options ?? []).map((option) => {
                            const selected = question.type === "multiChoice"
                              ? getSelectedListValues(selectedWorkflowAnswers[question.id]).includes(option)
                              : selectedWorkflowAnswers[question.id] === option;

                            return (
                              <Pressable
                                key={option}
                                onPress={() => {
                                  updateWorkflowAnswer(
                                    selectedTool.id,
                                    question.id,
                                    question.type === "multiChoice"
                                      ? toggleListValue(selectedWorkflowAnswers[question.id], option)
                                      : option,
                                  );
                                  triggerResetToolFromOption(option);
                                }}
                                style={({ pressed }) => [
                                  styles.choiceChip,
                                  selected && styles.choiceChipSelected,
                                  pressed && styles.toolCardPressed,
                                ]}
                              >
                                <AppText style={[styles.choiceChipText, selected && styles.choiceChipTextSelected]}>
                                  {option}
                                </AppText>
                              </Pressable>
                            );
                          })}
                          {question.allowCustom === false ? null : (
                            <Pressable
                              onPress={() =>
                                setCustomWorkflowFieldVisible(
                                  selectedTool.id,
                                  question.id,
                                  !(customWorkflowFields[selectedTool.id]?.[question.id] ||
                                    Boolean(getCustomWorkflowValue(question, selectedWorkflowAnswers[question.id]))),
                                )
                              }
                              style={({ pressed }) => [
                                styles.choiceChip,
                                (customWorkflowFields[selectedTool.id]?.[question.id] ||
                                  Boolean(getCustomWorkflowValue(question, selectedWorkflowAnswers[question.id]))) &&
                                  styles.choiceChipSelected,
                                pressed && styles.toolCardPressed,
                              ]}
                            >
                              <AppText
                                style={[
                                  styles.choiceChipText,
                                  (customWorkflowFields[selectedTool.id]?.[question.id] ||
                                    Boolean(getCustomWorkflowValue(question, selectedWorkflowAnswers[question.id]))) &&
                                    styles.choiceChipTextSelected,
                                ]}
                              >
                                {CUSTOM_OPTION_LABEL}
                              </AppText>
                            </Pressable>
                          )}
                        </View>
                        {question.allowCustom !== false &&
                        (customWorkflowFields[selectedTool.id]?.[question.id] ||
                          getCustomWorkflowValue(question, selectedWorkflowAnswers[question.id])) ? (
                          <TextInput
                            value={getCustomWorkflowValue(question, selectedWorkflowAnswers[question.id])}
                            onChangeText={(value) => updateCustomWorkflowAnswer(selectedTool.id, question, value)}
                            placeholder="Add your own answer"
                            placeholderTextColor="#9ca3af"
                            multiline
                            textAlignVertical="top"
                            style={styles.workflowInput}
                          />
                        ) : null}
                      </View>
                    ) : (
                      <TextInput
                        value={selectedWorkflowAnswers[question.id] ?? ""}
                        onChangeText={(value) => updateWorkflowAnswer(selectedTool.id, question.id, value)}
                        placeholder={question.placeholder}
                        placeholderTextColor="#9ca3af"
                        multiline
                        textAlignVertical="top"
                        style={styles.workflowInput}
                      />
                    )}
                  </View>
                ))}
              </View>
            ) : null}

            {selectedWorkflow && selectedWorkflowSummary ? (
              <View style={styles.workflowSummaryCard}>
                <AppText style={styles.workflowSummaryTitle}>{selectedWorkflow.summaryTitle}</AppText>
                {selectedWorkflow.summaryItems.map((item) => {
                  const value = selectedWorkflowSummary[item.answerId]?.trim();

                  return value ? (
                    <View key={item.answerId} style={styles.workflowSummaryRow}>
                      <AppText style={styles.workflowSummaryLabel}>{item.label}</AppText>
                      <AppText style={styles.workflowSummaryText}>{value}</AppText>
                    </View>
                  ) : null;
                })}
                {selectedTool.id === "difficult-day-pacing-checklist" ? (
                  <View style={styles.energyBudgetCard}>
                    <AppText style={styles.energyBudgetTitle}>Energy budget</AppText>
                    {(() => {
                      const budget = deriveEnergyBudget(selectedWorkflowSummary);

                      return (
                        <>
                          <View style={styles.energyBudgetRow}>
                            <AppText style={styles.energyBudgetLabel}>Required energy</AppText>
                            <View style={styles.energyDots}>
                              {[1, 2, 3, 4, 5].map((value) => (
                                <View
                                  key={`required-${value}`}
                                  style={[
                                    styles.energyDot,
                                    value <= budget.requiredEnergy && styles.energyDotActive,
                                  ]}
                                />
                              ))}
                            </View>
                          </View>
                          <View style={styles.energyBudgetRow}>
                            <AppText style={styles.energyBudgetLabel}>Recovery protected</AppText>
                            <View style={styles.energyDots}>
                              {[1, 2, 3, 4, 5].map((value) => (
                                <View
                                  key={`recovery-${value}`}
                                  style={[
                                    styles.energyDot,
                                    value <= budget.recoveryProtected && styles.energyDotRecovery,
                                  ]}
                                />
                              ))}
                            </View>
                          </View>
                          <View style={styles.energyBudgetRow}>
                            <AppText style={styles.energyBudgetLabel}>Overload risk</AppText>
                            <AppText style={styles.energyBudgetValue}>{budget.overloadRisk}</AppText>
                          </View>
                        </>
                      );
                    })()}
                  </View>
                ) : null}
                {selectedTool.id === "symptom-reflection" ? (
                  <View style={styles.energyBudgetCard}>
                    <AppText style={styles.energyBudgetTitle}>Pattern focus</AppText>
                    {(() => {
                      const cue = deriveSymptomPatternCue(selectedWorkflowSummary);

                      return cue ? (
                        <>
                          <AppText style={styles.workflowSummaryText}>{cue.changeText}</AppText>
                          <AppText style={styles.workflowSummaryText}>{cue.triggerText}</AppText>
                          <AppText style={styles.workflowSummaryText}>{cue.supportText}</AppText>
                        </>
                      ) : null;
                    })()}
                  </View>
                ) : null}
                {selectedTool.id === "cognitive-decompression-reset" ? (
                  <View style={styles.energyBudgetCard}>
                    <AppText style={styles.energyBudgetTitle}>Load reduction</AppText>
                    {(() => {
                      const cue = deriveCognitiveLoadCue(selectedWorkflowSummary);

                      return cue ? (
                        <>
                          <AppText style={styles.workflowSummaryText}>{cue.loadText}</AppText>
                          <AppText style={styles.workflowSummaryText}>{cue.focusText}</AppText>
                          <AppText style={styles.workflowSummaryText}>{cue.reductionText}</AppText>
                          <AppText style={styles.workflowSummaryText}>{cue.noiseText}</AppText>
                        </>
                      ) : null;
                    })()}
                  </View>
                ) : null}
                {selectedTool.id === "sleep-decompression-flow" ? (
                  <View style={styles.energyBudgetCard}>
                    <AppText style={styles.energyBudgetTitle}>Wind-down focus</AppText>
                    {(() => {
                      const cue = deriveSleepRecoveryCue(selectedWorkflowSummary);

                      return cue ? (
                        <>
                          <AppText style={styles.workflowSummaryText}>{cue.activationText}</AppText>
                          <AppText style={styles.workflowSummaryText}>{cue.adjustmentText}</AppText>
                          <AppText style={styles.workflowSummaryText}>{cue.releaseText}</AppText>
                          <AppText style={styles.workflowSummaryText}>{cue.focusText}</AppText>
                        </>
                      ) : null;
                    })()}
                  </View>
                ) : null}
                {selectedTool.id === "everything-feels-too-hard" ? (
                  <View style={styles.energyBudgetCard}>
                    <AppText style={styles.energyBudgetTitle}>Today’s smaller shape</AppText>
                    {(() => {
                      const cue = deriveDifficultDayCue(selectedWorkflowSummary);

                      return cue ? (
                        <>
                          <AppText style={styles.workflowSummaryText}>{cue.difficultyText}</AppText>
                          <AppText style={styles.workflowSummaryText}>{cue.focusText}</AppText>
                          <AppText style={styles.workflowSummaryText}>{cue.smallerText}</AppText>
                          <AppText style={styles.workflowSummaryText}>{cue.supportText}</AppText>
                          <AppText style={styles.workflowSummaryText}>{cue.enoughText}</AppText>
                        </>
                      ) : null;
                    })()}
                  </View>
                ) : null}
                {selectedTool.id === "appointment-prep" ? (
                  <View style={styles.appointmentExportActions}>
                    <AppButton
                      label="Share summary"
                      onPress={() => void shareAppointmentSummary("share")}
                      variant="secondary"
                    />
                    <AppButton
                      label={exportingAppointmentSummary ? "Preparing PDF..." : "Export PDF"}
                      onPress={() => void shareAppointmentSummary("pdf")}
                      variant="secondary"
                      disabled={exportingAppointmentSummary}
                    />
                    <AppButton
                      label="Email summary"
                      onPress={() => void shareAppointmentSummary("email")}
                      variant="secondary"
                    />
                    {appointmentExportMessage ? (
                      <AppText style={styles.appointmentExportMessage}>{appointmentExportMessage}</AppText>
                    ) : null}
                  </View>
                ) : null}
              </View>
            ) : null}

            <View style={styles.detailActions}>
              <AppButton
                label={
                  selectedWorkflowSummary
                    ? "Save changes"
                    : selectedTool.id === "reduce-overwhelm"
                      ? "Reduce overwhelm"
                    : selectedTool.id === "breathing-reset"
                      ? "Start 60-second reset"
                    : selectedTool.durationSeconds
                      ? "Begin reset"
                      : "Save summary"
                }
                onPress={() =>
                  selectedTool.durationSeconds
                      ? startTool(selectedTool)
                      : saveWorkflow(selectedTool)
                }
                disabled={!selectedTool.durationSeconds && !selectedWorkflowHasInput}
              />
              <AppButton
                label={selectedWorkflowSummary ? "Clear saved summary" : "Save without summary"}
                onPress={() => (selectedWorkflowSummary ? clearWorkflow(selectedTool) : completeTool(selectedTool))}
                variant="secondary"
              />
            </View>
          </View>
        ) : null}
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 120,
    gap: 20,
  },
  contentLowEnergy: {
    gap: 24,
  },
  heroCard: {
    backgroundColor: "#fff4ec",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#f2d8c4",
    padding: 18,
    gap: 10,
  },
  heroTitle: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: "700",
    color: "#1f2937",
  },
  heroBody: {
    color: "#4b5563",
    lineHeight: 23,
  },
  premiumLibraryCard: {
    backgroundColor: "#fffaf6",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#eadfd6",
    padding: 18,
    gap: 12,
  },
  premiumLibraryLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#8b6a4f",
    textTransform: "uppercase",
  },
  premiumLibraryTitle: {
    fontSize: 21,
    lineHeight: 29,
    fontWeight: "700",
    color: "#1f2937",
  },
  premiumLibraryBody: {
    color: "#4b5563",
    lineHeight: 22,
  },
  audioLibraryCard: {
    backgroundColor: "#f7faf9",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#dce8e3",
    padding: 18,
    gap: 12,
  },
  audioLibraryLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#456b61",
    textTransform: "uppercase",
  },
  audioLibraryTitle: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "700",
    color: "#1f2937",
  },
  audioLibraryBody: {
    color: "#4b5563",
    lineHeight: 22,
  },
  toolkitCard: {
    backgroundColor: "#f6f8fb",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#dde4ef",
    padding: 18,
    gap: 12,
  },
  toolkitLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#49607a",
    textTransform: "uppercase",
  },
  toolkitTitle: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "700",
    color: "#1f2937",
  },
  toolkitBody: {
    color: "#4b5563",
    lineHeight: 22,
  },
  toolkitChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#d7e2ef",
    backgroundColor: "#ffffff",
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  toolkitChipText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#49607a",
  },
  toolkitList: {
    gap: 10,
  },
  toolkitRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  toolkitRowText: {
    flex: 1,
    gap: 4,
  },
  toolkitRowTitle: {
    color: "#1f2937",
    fontWeight: "700",
    lineHeight: 22,
  },
  toolkitRowBody: {
    color: "#4b5563",
    lineHeight: 20,
  },
  toolkitMetaWrap: {
    borderRadius: 999,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#dde4ef",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  toolkitMetaText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#49607a",
  },
  toolkitActions: {
    gap: 10,
  },
  toolkitLockedBody: {
    color: "#4b5563",
    lineHeight: 21,
  },
  recoveryRhythmCard: {
    backgroundColor: "#f8faf6",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#dfe7d7",
    padding: 18,
    gap: 12,
  },
  recoveryRhythmCardHeavy: {
    backgroundColor: "#f4f8f0",
  },
  recoveryRhythmLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6d7a5b",
    textTransform: "uppercase",
  },
  recoveryRhythmTitle: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "700",
    color: "#1f2937",
  },
  recoveryRhythmBody: {
    color: "#4b5563",
    lineHeight: 22,
  },
  recoveryRhythmList: {
    gap: 8,
  },
  recoveryRhythmRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
  },
  recoveryRhythmBullet: {
    color: "#6d7a5b",
    fontWeight: "700",
  },
  recoveryRhythmText: {
    flex: 1,
    color: "#4b5563",
    lineHeight: 20,
  },
  recoveryRhythmSuggestionList: {
    gap: 8,
  },
  recoveryRhythmSuggestionPill: {
    borderRadius: 16,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#dde5d4",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  recoveryRhythmSuggestionText: {
    color: "#475244",
    lineHeight: 19,
  },
  communicationCard: {
    backgroundColor: "#f9f8fb",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#e4dff0",
    padding: 18,
    gap: 12,
  },
  communicationCardHeavy: {
    backgroundColor: "#f6f4f9",
  },
  communicationLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#72628a",
    textTransform: "uppercase",
  },
  communicationTitle: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "700",
    color: "#1f2937",
  },
  communicationBody: {
    color: "#4b5563",
    lineHeight: 22,
  },
  communicationContinuity: {
    color: "#6b6574",
    lineHeight: 20,
  },
  communicationPhraseList: {
    gap: 8,
  },
  communicationPhrasePill: {
    borderRadius: 16,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2ddee",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  communicationPhraseText: {
    color: "#4f4a59",
    lineHeight: 19,
  },
  guidanceCard: {
    backgroundColor: "#f9faf8",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#dfe6db",
    padding: 18,
    gap: 12,
  },
  guidanceCardHeavy: {
    backgroundColor: "#f6f8f4",
  },
  guidanceLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6f7b61",
    textTransform: "uppercase",
  },
  guidanceTitle: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "700",
    color: "#1f2937",
  },
  guidanceBody: {
    color: "#4b5563",
    lineHeight: 22,
  },
  guidanceContinuity: {
    color: "#6a7162",
    lineHeight: 20,
  },
  guidancePromptList: {
    gap: 8,
  },
  guidancePromptRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
  },
  guidancePromptBullet: {
    color: "#6f7b61",
    fontWeight: "700",
  },
  guidancePromptText: {
    flex: 1,
    color: "#4b5563",
    lineHeight: 20,
  },
  difficultDayCard: {
    backgroundColor: "#fff7f3",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#edd8cd",
    padding: 18,
    gap: 12,
  },
  difficultDayCardHeavy: {
    backgroundColor: "#fdf4ee",
  },
  difficultDayLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#8b6a4f",
    textTransform: "uppercase",
  },
  difficultDayTitle: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "700",
    color: "#1f2937",
  },
  difficultDayBody: {
    color: "#4b5563",
    lineHeight: 22,
  },
  difficultDayContinuity: {
    color: "#70635d",
    lineHeight: 20,
  },
  difficultDayLineList: {
    gap: 8,
  },
  difficultDayLineRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
  },
  difficultDayLineBullet: {
    color: "#8b6a4f",
    fontWeight: "700",
  },
  difficultDayLineText: {
    flex: 1,
    color: "#4b5563",
    lineHeight: 20,
  },
  cognitiveSupportCard: {
    backgroundColor: "#f8fbfc",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#d9e7ea",
    padding: 18,
    gap: 12,
  },
  cognitiveSupportCardHeavy: {
    backgroundColor: "#f5f8fa",
  },
  cognitiveSupportLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#5a7280",
    textTransform: "uppercase",
  },
  cognitiveSupportTitle: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "700",
    color: "#1f2937",
  },
  cognitiveSupportBody: {
    color: "#4b5563",
    lineHeight: 22,
  },
  cognitiveSupportContinuity: {
    color: "#667785",
    lineHeight: 20,
  },
  sleepSupportCard: {
    backgroundColor: "#fbf9ff",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#e6dff0",
    padding: 18,
    gap: 12,
  },
  sleepSupportCardEvening: {
    backgroundColor: "#213047",
    borderColor: "#36445a",
  },
  sleepSupportLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#75608c",
    textTransform: "uppercase",
  },
  sleepEveningLabel: {
    color: "#afbed3",
  },
  sleepSupportTitle: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "700",
    color: "#1f2937",
  },
  sleepSupportBody: {
    color: "#4b5563",
    lineHeight: 22,
  },
  sleepPromptList: {
    gap: 8,
  },
  sleepPromptRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
  },
  sleepPromptBullet: {
    color: "#8b6a4f",
    fontWeight: "700",
  },
  sleepPromptText: {
    flex: 1,
    color: "#4b5563",
    lineHeight: 20,
  },
  sleepEveningText: {
    color: "#f5f7fb",
  },
  sleepEveningBody: {
    color: "#d7dfeb",
  },
  sleepMetaWrapEvening: {
    backgroundColor: "#2a3a52",
    borderColor: "#41516a",
  },
  sleepEveningMetaText: {
    color: "#d7dfeb",
  },
  categoryChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#f0dfd3",
    backgroundColor: "#ffffff",
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#8b6a4f",
  },
  previewList: {
    gap: 8,
  },
  previewRow: {
    flexDirection: "row",
    gap: 8,
  },
  previewBullet: {
    color: "#c25d10",
    fontWeight: "700",
  },
  previewText: {
    flex: 1,
    color: "#4b5563",
    lineHeight: 20,
  },
  navCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#f1e1d4",
    padding: 18,
    gap: 14,
  },
  suggestionCard: {
    backgroundColor: "#f3f8f6",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#d7e7df",
    padding: 18,
    gap: 12,
  },
  suggestionLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#2f6b55",
    textTransform: "uppercase",
  },
  suggestionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1f2937",
  },
  suggestionBody: {
    color: "#4b5563",
    lineHeight: 22,
  },
  premiumPromptCard: {
    backgroundColor: "#fffaf6",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#eadfd6",
    padding: 18,
    gap: 12,
  },
  navButtons: {
    gap: 10,
  },
  resumeCopy: {
    color: "#4b5563",
    lineHeight: 21,
  },
  resumeNote: {
    color: "#6b7280",
    lineHeight: 20,
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
    gap: 12,
  },
  timerCardActive: {
    borderColor: "#9bc8ad",
    shadowColor: "#166534",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  breathingTimerCard: {
    alignItems: "center",
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
  breathingGuide: {
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
  },
  breathingCircle: {
    width: 156,
    height: 156,
    borderRadius: 999,
    backgroundColor: "#dff1e8",
    borderWidth: 1,
    borderColor: "#b8dac9",
    alignItems: "center",
    justifyContent: "center",
  },
  breathingPhase: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: "800",
    color: "#166534",
  },
  breathingInstruction: {
    color: "#3f5f46",
    fontWeight: "700",
    lineHeight: 21,
  },
  ambientDebugText: {
    color: "#557064",
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
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
    gap: 16,
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
  audioSessionCard: {
    backgroundColor: "#f6fbf9",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#dce8e3",
    padding: 16,
    gap: 12,
  },
  audioLockedCard: {
    backgroundColor: "#fffaf6",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#eadfd6",
    padding: 16,
    gap: 12,
  },
  audioSessionLabel: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
    color: "#456b61",
    textTransform: "uppercase",
  },
  audioSessionTitle: {
    fontSize: 18,
    lineHeight: 25,
    fontWeight: "700",
    color: "#1f2937",
  },
  audioSessionBody: {
    color: "#4b5563",
    lineHeight: 22,
  },
  audioSupportNote: {
    color: "#5a6c66",
    lineHeight: 21,
  },
  audioMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  audioMetaPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#dce8e3",
    backgroundColor: "#ffffff",
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  audioMetaText: {
    fontSize: 13,
    lineHeight: 18,
    color: "#456b61",
    fontWeight: "700",
  },
  audioNowPlayingCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#dce8e3",
    padding: 14,
    gap: 8,
  },
  audioPhaseLabel: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "700",
    color: "#456b61",
  },
  audioTimerValue: {
    fontSize: 30,
    lineHeight: 40,
    fontWeight: "800",
    color: "#1f2937",
  },
  audioPromptText: {
    color: "#4b5563",
    lineHeight: 22,
  },
  audioBreathNote: {
    color: "#6b7280",
    lineHeight: 20,
    fontSize: 13,
  },
  audioControls: {
    gap: 10,
  },
  contextCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#f3dfd1",
    backgroundColor: "#fffaf6",
    padding: 14,
    gap: 12,
  },
  lowEnergySupportCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#f3dfd1",
    backgroundColor: "#fffaf6",
    padding: 14,
    gap: 6,
  },
  lowEnergySupportTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1f2937",
  },
  lowEnergySupportBody: {
    color: "#6b7280",
    lineHeight: 20,
  },
  workflowCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#f3dfd1",
    backgroundColor: "#fffaf6",
    padding: 14,
    gap: 14,
  },
  workflowHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  workflowTitle: {
    flex: 1,
    fontSize: 17,
    lineHeight: 23,
    fontWeight: "700",
    color: "#1f2937",
  },
  workflowProgress: {
    fontSize: 13,
    fontWeight: "700",
    color: "#8b6a4f",
  },
  workflowQuestion: {
    gap: 10,
  },
  workflowQuestionHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  workflowQuestionLabel: {
    flex: 1,
    color: "#374151",
    fontWeight: "700",
    lineHeight: 21,
  },
  workflowInput: {
    minHeight: 84,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#ead9cb",
    backgroundColor: "#ffffff",
    color: "#1f2937",
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    lineHeight: 22,
  },
  choiceRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  choiceGroup: {
    gap: 10,
  },
  choiceChip: {
    minHeight: 44,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#ead9cb",
    backgroundColor: "#ffffff",
    paddingHorizontal: 14,
    paddingVertical: 10,
    justifyContent: "center",
  },
  choiceChipSelected: {
    borderColor: "#c25d10",
    backgroundColor: "#fff4ec",
  },
  choiceChipText: {
    color: "#6b7280",
    fontWeight: "700",
  },
  choiceChipTextSelected: {
    color: "#9a4b0c",
  },
  workflowSummaryCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#d7ead7",
    backgroundColor: "#f7fbf7",
    padding: 14,
    gap: 10,
  },
  workflowSummaryTitle: {
    fontSize: 17,
    lineHeight: 23,
    fontWeight: "700",
    color: "#166534",
  },
  workflowSummaryRow: {
    gap: 3,
  },
  workflowSummaryLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#4d7c58",
    textTransform: "uppercase",
  },
  workflowSummaryText: {
    color: "#374151",
    lineHeight: 21,
  },
  appointmentExportActions: {
    gap: 10,
    paddingTop: 4,
  },
  appointmentExportMessage: {
    color: "#6b7280",
    lineHeight: 20,
  },
  energyBudgetCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#d7ead7",
    backgroundColor: "#ffffff",
    padding: 12,
    gap: 10,
  },
  energyBudgetTitle: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "700",
    color: "#166534",
  },
  energyBudgetRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  energyBudgetLabel: {
    flex: 1,
    color: "#4b5563",
    fontWeight: "700",
    lineHeight: 20,
  },
  energyBudgetValue: {
    color: "#166534",
    fontWeight: "800",
  },
  energyDots: {
    flexDirection: "row",
    gap: 5,
  },
  energyDot: {
    width: 11,
    height: 11,
    borderRadius: 999,
    backgroundColor: "#e5e7eb",
  },
  energyDotActive: {
    backgroundColor: "#d97706",
  },
  energyDotRecovery: {
    backgroundColor: "#16a34a",
  },
  contextToggle: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#ead9cb",
    backgroundColor: "#fffaf6",
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignSelf: "flex-start",
  },
  contextToggleText: {
    color: "#8b6a4f",
    fontSize: 13,
    fontWeight: "700",
  },
  contextTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1f2937",
  },
  contextBody: {
    color: "#4b5563",
    lineHeight: 21,
  },
  moduleProgressCard: {
    gap: 8,
  },
  moduleProgressTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1f2937",
  },
  moduleProgressNote: {
    color: "#6b7280",
    lineHeight: 20,
  },
  moduleStepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#ecd9ca",
    backgroundColor: "#ffffff",
    padding: 10,
  },
  moduleStepRowCurrent: {
    borderColor: "#d7c2af",
    backgroundColor: "#fff9f4",
  },
  moduleStepRowPressed: {
    opacity: 0.86,
  },
  moduleStepBadge: {
    borderRadius: 999,
    backgroundColor: "#fff4ec",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  moduleStepBadgeCompleted: {
    backgroundColor: "#e9f6ee",
  },
  moduleStepBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#c25d10",
  },
  moduleStepBadgeTextCompleted: {
    color: "#166534",
  },
  moduleStepTextWrap: {
    flex: 1,
    gap: 2,
  },
  moduleStepTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1f2937",
  },
  moduleStepBody: {
    color: "#6b7280",
    fontSize: 13,
    lineHeight: 19,
  },
  contextNote: {
    gap: 4,
  },
  contextNoteTitle: {
    color: "#8b6a4f",
    fontSize: 13,
    fontWeight: "700",
  },
  contextNoteBody: {
    color: "#6b7280",
    lineHeight: 20,
    fontSize: 14,
  },
  stepsList: {
    gap: 14,
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
    gap: 12,
  },
  section: {
    gap: 14,
  },
  sectionBreak: {
    marginTop: 8,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  sectionHeaderText: {
    flex: 1,
    gap: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1f2937",
  },
  sectionSubtitle: {
    color: "#6b7280",
    lineHeight: 20,
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
    gap: 10,
  },
  toolCardPressed: {
    opacity: 0.84,
  },
  operationalToolCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#f1e1d4",
    padding: 16,
    gap: 10,
  },
  operationalToolCardSelected: {
    borderColor: "#d98a4d",
    backgroundColor: "#fff8f2",
  },
  operationalToolCardLocked: {
    backgroundColor: "#fffaf6",
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
  toolMetaLine: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
  },
  toolPremiumLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#8b6a4f",
  },
  toolUsedLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#166534",
  },
  toolWhenToUse: {
    color: "#4b5563",
    lineHeight: 21,
    fontWeight: "600",
  },
  toolOutcome: {
    color: "#6b7280",
    lineHeight: 21,
  },
  toolDescription: {
    color: "#6b7280",
    lineHeight: 22,
  },
  moduleMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  moduleMetaPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#ead9cb",
    backgroundColor: "#fffaf6",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  moduleMetaText: {
    color: "#8b6a4f",
    fontSize: 12,
    fontWeight: "700",
  },
  toolFooter: {
    paddingTop: 4,
  },
  toolOpenLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#c25d10",
  },
  lockedSectionCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#eadfd6",
    backgroundColor: "#fffaf6",
    padding: 16,
    gap: 10,
  },
  lockedSectionTitle: {
    fontSize: 16,
    lineHeight: 23,
    fontWeight: "700",
    color: "#1f2937",
  },
  lockedSectionBody: {
    color: "#6b7280",
    lineHeight: 21,
  },
});
