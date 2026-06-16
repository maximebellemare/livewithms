import { useEffect, useMemo, useRef, useState } from "react";
import { router } from "expo-router";
import { Pressable, StyleSheet, View, type LayoutChangeEvent } from "react-native";
import AppButton from "../ui/AppButton";
import AppText from "../ui/AppText";
import { EXERCISES, type ExerciseDefinition, type ExerciseId } from "../../features/exercises/catalog";
import {
  FREE_DAILY_EXERCISE_LIMIT,
  loadExerciseBests,
  loadExerciseUsage,
  recordExerciseResult,
  recordExerciseSession,
  type ExerciseBest,
  type ExerciseBests,
  type ExerciseDifficulty,
  type ExerciseUsage,
} from "../../features/exercises/storage";

type ExercisePhase = "idle" | "ready" | "active" | "complete" | "locked";
type ReactionState = "waiting" | "ready";

type Props = {
  hasPremiumAccess: boolean;
  lowEnergyMode?: boolean;
  onActiveExerciseLayout?: (relativeY: number) => void;
  initialExerciseId?: ExerciseId | null;
};

type MemoryCard = {
  id: number;
  label: string;
  visible: boolean;
  matched: boolean;
};

type MemoryDeckMode = "words" | "icons" | "illustrations" | "mixed";
type PatternMode = "words" | "icons" | "shapes" | "numbers" | "colors" | "categories";

type PatternRoundData = {
  sequence: string[];
  answer: string;
  options: string[];
  mode: PatternMode;
  modeLabel: string;
};

type FocusTargetItem = {
  id: number;
  color: "blue" | "green" | "orange";
  shape: "circle" | "square";
  isTarget: boolean;
};

type CompletionSummary = {
  title: string;
  lines: string[];
  bestLine?: string;
  previousBestLine?: string;
  newBest?: boolean;
};

const MEMORY_WORDS = ["Apple", "Dog", "Car", "House", "River", "Cloud", "Forest", "Book", "Garden", "Bridge", "Sun", "Train"];
const MEMORY_ICONS = ["🍎", "🐶", "🚗", "🏠", "🌊", "☁️", "🌲", "📘", "🌼", "🌉", "☀️", "🚂"];
const MEMORY_ILLUSTRATIONS = ["🌳 Tree", "🌙 Moon", "🌧️ Rain", "🐚 Shell", "⭐ Star", "🏡 House", "🌻 Flower", "🦊 Fox", "⛰️ Mountain", "🚲 Bicycle", "🐦 Bird", "🍋 Lemon"];
const SEQUENCE_TILES = ["1", "2", "3", "4", "5"];
const MEMORY_DECK_MODES: MemoryDeckMode[] = ["words", "icons", "illustrations", "mixed"];
const PATTERN_MODES: PatternMode[] = ["words", "icons", "shapes", "numbers", "colors", "categories"];
const DIFFICULTIES: Array<{ id: ExerciseDifficulty; label: string }> = [
  { id: "easy", label: "Easy" },
  { id: "medium", label: "Medium" },
  { id: "hard", label: "Hard" },
];

function shuffle<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}

function pickRandom<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

function formatDuration(milliseconds: number) {
  const totalSeconds = Math.max(0, Math.round(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return minutes > 0 ? `${minutes}:${String(seconds).padStart(2, "0")}` : `${seconds}s`;
}

function formatBest(best: ExerciseBest | null | undefined) {
  if (!best) {
    return "No previous best yet.";
  }

  const value = best.label === "Seconds" ? formatDuration(best.value * 1000) : String(best.value);
  const primary = best.label === "Seconds" ? value : `${best.label} ${value}`;

  return best.secondaryLabel && typeof best.secondaryValue === "number"
    ? `Best: ${primary} • ${best.secondaryLabel} ${best.secondaryValue}`
    : `Best: ${primary}`;
}

function formatPreviousBest(
  exerciseId: ExerciseId | null,
  best: ExerciseBest | null | undefined,
  difficulty: ExerciseDifficulty = "medium",
) {
  if (!best) {
    return "Previous best: none yet";
  }

  if (exerciseId === "memory-match") {
    const time = formatDuration(best.value * 1000);
    return `Previous best: ${time}${typeof best.secondaryValue === "number" ? ` • ${best.secondaryValue} moves` : ""}`;
  }

  if (exerciseId === "steady-tap") {
    return `Previous best: ${best.value}% consistency`;
  }

  if (exerciseId === "sequence-recall") {
    return `Previous best: Round ${best.value}`;
  }

  if (exerciseId === "reaction-check") {
    return `Previous best: ${best.value}ms average`;
  }

  if (exerciseId === "pattern-spotting") {
    const rounds = getPatternConfig(difficulty).rounds;
    const suffix = typeof best.secondaryValue === "number" ? ` in ${formatDuration(best.secondaryValue * 1000)}` : "";
    return `Previous best: ${best.value}/${rounds}${suffix}`;
  }

  if (exerciseId === "focus-sprint") {
    const suffix = typeof best.secondaryValue === "number" ? ` • ${best.secondaryValue} streak` : "";
    return `Previous best: ${best.value}% accuracy${suffix}`;
  }

  return formatBest(best).replace("Best:", "Previous best:");
}

function getUsageCopy(usage: ExerciseUsage | null, hasPremiumAccess: boolean) {
  if (hasPremiumAccess) {
    return "Premium includes unlimited exercises.";
  }

  const count = usage?.count ?? 0;
  const remaining = Math.max(0, FREE_DAILY_EXERCISE_LIMIT - count);

  return remaining > 0 ? `${remaining} free exercise available today.` : "You've used today's free exercise.";
}

function getMemoryPairCount(difficulty: ExerciseDifficulty) {
  if (difficulty === "easy") {
    return 6;
  }

  if (difficulty === "hard") {
    return 10;
  }

  return 8;
}

function getSteadyTapConfig(difficulty: ExerciseDifficulty) {
  if (difficulty === "easy") {
    return { durationMs: 30000, targetSize: 170, tolerance: 420 };
  }

  if (difficulty === "hard") {
    return { durationMs: 60000, targetSize: 104, tolerance: 220 };
  }

  return { durationMs: 45000, targetSize: 138, tolerance: 300 };
}

function getSequenceConfig(difficulty: ExerciseDifficulty) {
  if (difficulty === "easy") {
    return { startLength: 3, maxLength: 8, tileCount: 3 };
  }

  if (difficulty === "hard") {
    return { startLength: 5, maxLength: 12, tileCount: 5 };
  }

  return { startLength: 4, maxLength: 10, tileCount: 4 };
}

function getReactionConfig(difficulty: ExerciseDifficulty) {
  if (difficulty === "easy") {
    return { trials: 5, targetSize: 170, minDelay: 1800, maxDelay: 3200 };
  }

  if (difficulty === "hard") {
    return { trials: 12, targetSize: 108, minDelay: 800, maxDelay: 1900 };
  }

  return { trials: 8, targetSize: 138, minDelay: 1200, maxDelay: 2600 };
}

function getPatternConfig(difficulty: ExerciseDifficulty) {
  if (difficulty === "easy") {
    return { rounds: 8, sequenceLength: 4, optionCount: 3 };
  }

  if (difficulty === "hard") {
    return { rounds: 12, sequenceLength: 6, optionCount: 4 };
  }

  return { rounds: 10, sequenceLength: 5, optionCount: 4 };
}

function getFocusSprintConfig(difficulty: ExerciseDifficulty) {
  if (difficulty === "easy") {
    return { rounds: 12, itemCount: 3 };
  }

  if (difficulty === "hard") {
    return { rounds: 20, itemCount: 5 };
  }

  return { rounds: 16, itemCount: 4 };
}

function getRandomDelay(minDelay: number, maxDelay: number) {
  return minDelay + Math.round(Math.random() * (maxDelay - minDelay));
}

function generateSequence(length: number, tileCount: number) {
  return Array.from({ length }, () => SEQUENCE_TILES[Math.floor(Math.random() * tileCount)]);
}

function buildAlternatingPattern<T>(values: T[], length: number) {
  return Array.from({ length }, (_, index) => values[index % values.length]);
}

function buildAlternatingNextOptions(correct: string, distractors: string[], optionCount: number) {
  return shuffle([correct, ...distractors.filter((item) => item !== correct).slice(0, Math.max(0, optionCount - 1))]);
}

function generatePatternRound(difficulty: ExerciseDifficulty, round: number): PatternRoundData {
  const config = getPatternConfig(difficulty);
  const mode = PATTERN_MODES[(round - 1 + Math.floor(Math.random() * PATTERN_MODES.length)) % PATTERN_MODES.length];

  if (mode === "words") {
    const pair = shuffle(["Apple", "Banana", "Pear", "Grape", "House", "River"]).slice(0, 2);
    const sequence = buildAlternatingPattern(pair, config.sequenceLength);
    const answer = pair[config.sequenceLength % 2];
    return {
      sequence,
      answer,
      options: buildAlternatingNextOptions(answer, ["Pear", "Grape", pair[0] === "Apple" ? "Orange" : "Apple"], config.optionCount),
      mode,
      modeLabel: "Words",
    };
  }

  if (mode === "icons") {
    const pair = shuffle(["🍎", "🍌", "🚗", "🏠", "⭐", "🌊"]).slice(0, 2);
    const sequence = buildAlternatingPattern(pair, config.sequenceLength);
    const answer = pair[config.sequenceLength % 2];
    return {
      sequence,
      answer,
      options: buildAlternatingNextOptions(answer, ["🚗", "🏠", "⭐"], config.optionCount),
      mode,
      modeLabel: "Icons",
    };
  }

  if (mode === "shapes") {
    const pattern = ["⭐", "⭐", "🔺"];
    const sequence = Array.from({ length: config.sequenceLength }, (_, index) => pattern[index % pattern.length]);
    const answer = pattern[config.sequenceLength % pattern.length];
    return {
      sequence,
      answer,
      options: buildAlternatingNextOptions(answer, ["⚫", "🟦", "⬟"], config.optionCount),
      mode,
      modeLabel: "Shapes",
    };
  }

  if (mode === "numbers") {
    const start = difficulty === "easy" ? 2 : difficulty === "hard" ? 3 : 4;
    const step = difficulty === "easy" ? 2 : difficulty === "hard" ? 3 : 2;
    const sequence = Array.from({ length: config.sequenceLength }, (_, index) => String(start + index * step));
    const answer = String(start + config.sequenceLength * step);
    return {
      sequence,
      answer,
      options: buildAlternatingNextOptions(
        answer,
        [String(Number(answer) + step), String(Number(answer) - step), String(Number(answer) + step * 2)],
        config.optionCount,
      ),
      mode,
      modeLabel: "Numbers",
    };
  }

  if (mode === "colors") {
    const pair = shuffle(["Blue", "Green", "Orange", "Purple", "Yellow", "Teal"]).slice(0, 2);
    const sequence = buildAlternatingPattern(pair, config.sequenceLength);
    const answer = pair[config.sequenceLength % 2];
    return {
      sequence,
      answer,
      options: buildAlternatingNextOptions(answer, ["Orange", "Purple", "Yellow"], config.optionCount),
      mode,
      modeLabel: "Colors",
    };
  }

  const categoryPattern = ["Apple", "Dog", "Banana", "Cat", "Orange", "Bird", "Pear"];
  const sequence = categoryPattern.slice(0, config.sequenceLength);
  const answer = categoryPattern[config.sequenceLength] ?? "Pear";
  return {
    sequence,
    answer,
    options: buildAlternatingNextOptions(answer, ["Chair", "River", "Carrot"], config.optionCount),
    mode,
    modeLabel: "Categories",
  };
}

function getMemoryModeLabel(mode: MemoryDeckMode) {
  if (mode === "words") {
    return "Words";
  }

  if (mode === "icons") {
    return "Icons";
  }

  if (mode === "illustrations") {
    return "Illustrations";
  }

  return "Mixed";
}

function buildMemorySymbols(mode: MemoryDeckMode, pairCount: number) {
  if (mode === "words") {
    return MEMORY_WORDS.slice(0, pairCount);
  }

  if (mode === "icons") {
    return MEMORY_ICONS.slice(0, pairCount);
  }

  if (mode === "illustrations") {
    return MEMORY_ILLUSTRATIONS.slice(0, pairCount);
  }

  const mixed: string[] = [];
  for (let index = 0; index < pairCount; index += 1) {
    const source =
      index % 3 === 0
        ? MEMORY_ICONS
        : index % 3 === 1
          ? MEMORY_WORDS
          : MEMORY_ILLUSTRATIONS;
    mixed.push(source[index]);
  }
  return mixed;
}

function generateFocusSprintRound(difficulty: ExerciseDifficulty, round: number) {
  const config = getFocusSprintConfig(difficulty);
  const rules: Array<{ label: string; color: FocusTargetItem["color"]; shape: FocusTargetItem["shape"] }> = difficulty === "easy"
    ? [
        { label: "Tap the blue circle.", color: "blue", shape: "circle" },
        { label: "Tap the green circle.", color: "green", shape: "circle" },
      ]
    : difficulty === "hard"
      ? [
          { label: "Tap the blue circle.", color: "blue", shape: "circle" },
          { label: "Tap the orange square.", color: "orange", shape: "square" },
          { label: "Tap the green circle.", color: "green", shape: "circle" },
        ]
      : [
          { label: "Tap the blue circle.", color: "blue", shape: "circle" },
          { label: "Tap the orange square.", color: "orange", shape: "square" },
          { label: "Tap the green square.", color: "green", shape: "square" },
        ];
  const rule = rules[(round - 1) % rules.length];
  const colors: FocusTargetItem["color"][] = ["blue", "green", "orange"];
  const shapes: FocusTargetItem["shape"][] = ["circle", "square"];
  const targetIndex = (round * 2 + 1) % config.itemCount;
  const items: FocusTargetItem[] = Array.from({ length: config.itemCount }, (_, index) => {
    const isTarget = index === targetIndex;
    const color = isTarget ? rule.color : colors[(index + round) % colors.length];
    const shape = isTarget ? rule.shape : shapes[(index + round) % shapes.length];
    const matchesRule = color === rule.color && shape === rule.shape;

    return {
      id: round * 100 + index,
      color: isTarget ? color : matchesRule ? colors.find((candidate) => candidate !== rule.color) ?? color : color,
      shape,
      isTarget,
    };
  });

  return {
    ruleLabel: rule.label,
    items,
  };
}

function calculateConsistency(tapTimes: number[], tolerance: number) {
  if (tapTimes.length < 3) {
    return { consistency: 0, averagePace: 0 };
  }

  const intervals = tapTimes.slice(1).map((time, index) => time - tapTimes[index]);
  const averageInterval = intervals.reduce((sum, value) => sum + value, 0) / intervals.length;
  const averageDeviation =
    intervals.reduce((sum, value) => sum + Math.abs(value - averageInterval), 0) / intervals.length;
  const consistency = Math.max(0, Math.min(100, Math.round(100 - (averageDeviation / tolerance) * 100)));
  const averagePace = Math.round(60000 / averageInterval);

  return { consistency, averagePace };
}

export default function GentleExercisesSection({
  hasPremiumAccess,
  lowEnergyMode = false,
  onActiveExerciseLayout,
  initialExerciseId = null,
}: Props) {
  const [usage, setUsage] = useState<ExerciseUsage | null>(null);
  const [bests, setBests] = useState<ExerciseBests>({});
  const [selectedExerciseId, setSelectedExerciseId] = useState<ExerciseId | null>(null);
  const [phase, setPhase] = useState<ExercisePhase>("idle");
  const [difficulty, setDifficulty] = useState<ExerciseDifficulty>("medium");
  const [activeExerciseY, setActiveExerciseY] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [status, setStatus] = useState<string | null>(null);
  const [summary, setSummary] = useState<CompletionSummary | null>(null);

  const [memoryCards, setMemoryCards] = useState<MemoryCard[]>([]);
  const [selectedMemoryIds, setSelectedMemoryIds] = useState<number[]>([]);
  const [memoryMoves, setMemoryMoves] = useState(0);
  const [memoryMode, setMemoryMode] = useState<MemoryDeckMode>("words");

  const [steadyTapTimes, setSteadyTapTimes] = useState<number[]>([]);
  const [steadyRemainingMs, setSteadyRemainingMs] = useState(30000);

  const [sequenceRoundLength, setSequenceRoundLength] = useState(3);
  const [sequenceValue, setSequenceValue] = useState<string[]>([]);
  const [sequenceInput, setSequenceInput] = useState<string[]>([]);
  const [sequenceHighestLength, setSequenceHighestLength] = useState(0);
  const [sequenceShowing, setSequenceShowing] = useState(true);
  const [sequencePlaybackIndex, setSequencePlaybackIndex] = useState<number | null>(null);
  const [sequenceTappedTile, setSequenceTappedTile] = useState<{ value: string; nonce: number } | null>(null);
  const [sequenceAnswerState, setSequenceAnswerState] = useState<"idle" | "correct" | "incorrect">("idle");

  const [reactionState, setReactionState] = useState<ReactionState>("waiting");
  const [reactionTrial, setReactionTrial] = useState(1);
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const [reactionFalseStarts, setReactionFalseStarts] = useState(0);

  const [patternRound, setPatternRound] = useState(1);
  const [patternData, setPatternData] = useState(generatePatternRound("medium", 1));
  const [patternCorrect, setPatternCorrect] = useState(0);

  const [focusSprintRound, setFocusSprintRound] = useState(1);
  const [focusSprintData, setFocusSprintData] = useState(generateFocusSprintRound("medium", 1));
  const [focusSprintCorrect, setFocusSprintCorrect] = useState(0);
  const [focusSprintMissed, setFocusSprintMissed] = useState(0);
  const [focusSprintStreak, setFocusSprintStreak] = useState(0);
  const [focusSprintBestStreak, setFocusSprintBestStreak] = useState(0);
  const [focusSprintAdvancing, setFocusSprintAdvancing] = useState(false);

  const sessionStartedAtRef = useRef<number>(0);
  const reactionCueStartedAtRef = useRef<number>(0);
  const handledInitialExerciseRef = useRef<ExerciseId | null>(null);

  useEffect(() => {
    if (!initialExerciseId || handledInitialExerciseRef.current === initialExerciseId) {
      return;
    }

    const exercise = EXERCISES.find((item) => item.id === initialExerciseId);
    if (!exercise) {
      return;
    }

    handledInitialExerciseRef.current = initialExerciseId;
    setSelectedExerciseId(exercise.id);
    setPhase(exercise.premiumOnly && !hasPremiumAccess ? "locked" : "ready");
    setStatus(exercise.premiumOnly && !hasPremiumAccess ? "Premium includes unlimited exercise sessions." : null);
    setSummary(null);
  }, [hasPremiumAccess, initialExerciseId]);
  const steadyCompletedRef = useRef(false);

  const selectedExercise = useMemo(
    () => EXERCISES.find((exercise) => exercise.id === selectedExerciseId) ?? null,
    [selectedExerciseId],
  );
  const selectedBest = selectedExerciseId ? bests[selectedExerciseId]?.[difficulty] ?? null : null;
  const limitReached = !hasPremiumAccess && (usage?.count ?? 0) >= FREE_DAILY_EXERCISE_LIMIT;
  const visibleExercises = EXERCISES;

  useEffect(() => {
    if (!__DEV__) {
      return;
    }

    console.log("[programs-exercises]", {
      totalPrograms: EXERCISES.length,
      filteredPrograms: visibleExercises.length,
      visiblePrograms: visibleExercises.map((exercise) => exercise.title),
      activeCategory: null,
      activeFilter: lowEnergyMode ? "low-energy-mode" : "all",
      premiumStatus: hasPremiumAccess,
      lowEnergyMode,
    });
  }, [hasPremiumAccess, lowEnergyMode, visibleExercises]);

  useEffect(() => {
    let cancelled = false;

    void Promise.all([loadExerciseUsage(), loadExerciseBests()]).then(([loadedUsage, loadedBests]) => {
      if (!cancelled) {
        setUsage(loadedUsage);
        setBests(loadedBests);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!onActiveExerciseLayout || activeExerciseY === null || phase === "idle") {
      return;
    }

    const timeout = setTimeout(() => onActiveExerciseLayout(activeExerciseY), 80);
    return () => clearTimeout(timeout);
  }, [activeExerciseY, onActiveExerciseLayout, phase, selectedExerciseId]);

  useEffect(() => {
    if (phase !== "active" || selectedExerciseId !== "steady-tap") {
      return;
    }

    const config = getSteadyTapConfig(difficulty);
    setSteadyRemainingMs(config.durationMs);
    const startedAt = Date.now();
    sessionStartedAtRef.current = startedAt;
    const interval = setInterval(() => {
      const nextRemaining = Math.max(0, config.durationMs - (Date.now() - startedAt));
      setSteadyRemainingMs(nextRemaining);

      if (nextRemaining <= 0) {
        clearInterval(interval);
      }
    }, 250);

    return () => clearInterval(interval);
  }, [difficulty, phase, selectedExerciseId]);

  useEffect(() => {
    if (phase !== "active" || !["memory-match", "pattern-spotting"].includes(selectedExerciseId ?? "")) {
      return;
    }

    const interval = setInterval(() => {
      setElapsedMs(Date.now() - sessionStartedAtRef.current);
    }, 500);

    return () => clearInterval(interval);
  }, [phase, selectedExerciseId]);

  useEffect(() => {
    if (phase !== "active" || selectedExerciseId !== "steady-tap" || steadyRemainingMs > 0 || steadyCompletedRef.current) {
      return;
    }

    steadyCompletedRef.current = true;
    void finishSteadyTap();
    // finishSteadyTap reads the final tap buffer at timer completion; adding it as
    // a dependency would recreate the completion effect during the active session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, selectedExerciseId, steadyRemainingMs, steadyTapTimes]);

  useEffect(() => {
    if (phase !== "active" || selectedExerciseId !== "reaction-check" || reactionState !== "waiting") {
      return;
    }

    const config = getReactionConfig(difficulty);
    const timeout = setTimeout(() => {
      reactionCueStartedAtRef.current = Date.now();
      setReactionState("ready");
    }, getRandomDelay(config.minDelay, config.maxDelay));

    return () => clearTimeout(timeout);
  }, [difficulty, phase, reactionState, reactionTrial, selectedExerciseId]);

  useEffect(() => {
    if (phase !== "active" || selectedExerciseId !== "sequence-recall" || !sequenceShowing || sequenceValue.length === 0) {
      return;
    }

    const playbackMs = difficulty === "easy" ? 850 : difficulty === "hard" ? 520 : 680;
    const timers: Array<ReturnType<typeof setTimeout>> = [];

    setSequencePlaybackIndex(null);
    sequenceValue.forEach((_, index) => {
      timers.push(setTimeout(() => {
        setSequencePlaybackIndex(index);
      }, index * playbackMs));
      timers.push(setTimeout(() => {
        setSequencePlaybackIndex(null);
      }, index * playbackMs + Math.round(playbackMs * 0.62)));
    });
    timers.push(setTimeout(() => {
      setSequencePlaybackIndex(null);
      setSequenceShowing(false);
      setStatus("Repeat the sequence.");
    }, sequenceValue.length * playbackMs + 220));

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [difficulty, phase, selectedExerciseId, sequenceShowing, sequenceValue]);

  const resetExerciseState = () => {
    setSelectedMemoryIds([]);
    setMemoryMoves(0);
    setMemoryMode("words");
    setElapsedMs(0);
    setSteadyTapTimes([]);
    steadyCompletedRef.current = false;
    setSteadyRemainingMs(getSteadyTapConfig(difficulty).durationMs);
    setSequenceInput([]);
    setSequenceHighestLength(0);
    setSequenceShowing(true);
    setSequencePlaybackIndex(null);
    setSequenceTappedTile(null);
    setSequenceAnswerState("idle");
    setReactionState("waiting");
    setReactionTrial(1);
    setReactionTimes([]);
    setReactionFalseStarts(0);
    setPatternRound(1);
    setPatternCorrect(0);
    setPatternData(generatePatternRound(difficulty, 1));
    setFocusSprintRound(1);
    setFocusSprintCorrect(0);
    setFocusSprintMissed(0);
    setFocusSprintStreak(0);
    setFocusSprintBestStreak(0);
    setFocusSprintAdvancing(false);
    setFocusSprintData(generateFocusSprintRound(difficulty, 1));
    setStatus(null);
    setSummary(null);
  };

  const buildMemoryCards = (nextDifficulty = difficulty) => {
    const nextMode = pickRandom(MEMORY_DECK_MODES);
    const symbols = buildMemorySymbols(nextMode, getMemoryPairCount(nextDifficulty));
    setMemoryMode(nextMode);
    setMemoryCards(
      shuffle([...symbols, ...symbols]).map((label, index) => ({
        id: index,
        label,
        visible: false,
        matched: false,
      })),
    );
  };

  const prepareSequence = (nextDifficulty = difficulty) => {
    const config = getSequenceConfig(nextDifficulty);
    const sequence = generateSequence(config.startLength, config.tileCount);
    setSequenceRoundLength(config.startLength);
    setSequenceValue(sequence);
    setSequenceInput([]);
    setSequenceHighestLength(0);
    setSequenceShowing(true);
    setSequencePlaybackIndex(null);
    setStatus("Watch the sequence.");
  };

  const startActiveSession = () => {
    sessionStartedAtRef.current = Date.now();

    if (selectedExerciseId === "memory-match") {
      buildMemoryCards();
    }

    if (selectedExerciseId === "sequence-recall") {
      prepareSequence();
    }

    if (selectedExerciseId === "pattern-spotting") {
      setPatternData(generatePatternRound(difficulty, 1));
    }

    if (selectedExerciseId === "focus-sprint") {
      setFocusSprintData(generateFocusSprintRound(difficulty, 1));
      setFocusSprintAdvancing(false);
    }
  };

  const beginSelectedExercise = () => {
    if (!selectedExercise) {
      return;
    }

    if (limitReached) {
      setStatus("Premium includes unlimited exercise sessions.");
      return;
    }

    resetExerciseState();
    setPhase("active");
    startActiveSession();
  };

  const replaySelectedExercise = () => {
    if (!selectedExercise) {
      return;
    }

    if (!hasPremiumAccess) {
      setStatus("Premium includes unlimited exercise sessions.");
      return;
    }

    resetExerciseState();
    setPhase("active");
    startActiveSession();
  };

  const startExercise = (exercise: ExerciseDefinition) => {
    if (exercise.premiumOnly && !hasPremiumAccess) {
      router.push("/premium?source=exercises");
      return;
    }

    if (limitReached) {
      setSelectedExerciseId(exercise.id);
      setPhase("locked");
      setStatus("Premium includes unlimited exercise sessions.");
      return;
    }

    resetExerciseState();
    setSelectedExerciseId(exercise.id);
    setPhase("ready");
  };

  const completeExercise = async (nextSummary: CompletionSummary) => {
    if (!selectedExercise) {
      return;
    }

    const nextUsage = await recordExerciseSession(selectedExercise.id);
    setUsage(nextUsage);
    setPhase("complete");
    setSummary(nextSummary);
    setStatus(nextSummary.title);
  };

  const completeWithResult = async (input: {
    title: string;
    lines: string[];
    value: number;
    label: string;
    secondaryLabel?: string;
    secondaryValue?: number;
    lowerIsBetter?: boolean;
  }) => {
    if (!selectedExercise) {
      return;
    }

    const result = await recordExerciseResult({
      exerciseId: selectedExercise.id,
      difficulty,
      label: input.label,
      value: input.value,
      secondaryLabel: input.secondaryLabel,
      secondaryValue: input.secondaryValue,
      lowerIsBetter: input.lowerIsBetter,
    });

    setBests(result.bests);

    await completeExercise({
      title: input.title,
      lines: input.lines,
      previousBestLine: formatPreviousBest(selectedExercise.id, result.previousBest, difficulty),
      bestLine: formatPreviousBest(selectedExercise.id, result.currentBest, difficulty).replace("Previous best:", "Best:"),
      newBest: result.improved,
    });
  };

  const handleActiveExerciseLayout = (event: LayoutChangeEvent) => {
    setActiveExerciseY(event.nativeEvent.layout.y);
  };

  const handleMemoryCardPress = (cardId: number) => {
    if (phase !== "active" || selectedMemoryIds.length >= 2) {
      return;
    }

    const card = memoryCards.find((item) => item.id === cardId);
    if (!card || card.visible || card.matched) {
      return;
    }

    const nextSelectedIds = [...selectedMemoryIds, cardId];
    const nextCards = memoryCards.map((item) => (item.id === cardId ? { ...item, visible: true } : item));
    setMemoryCards(nextCards);
    setSelectedMemoryIds(nextSelectedIds);

    if (nextSelectedIds.length !== 2) {
      return;
    }

    const nextMoves = memoryMoves + 1;
    setMemoryMoves(nextMoves);

    const [firstId, secondId] = nextSelectedIds;
    const first = nextCards.find((item) => item.id === firstId);
    const second = nextCards.find((item) => item.id === secondId);

    setTimeout(() => {
      if (first?.label === second?.label) {
        const matchedCards = nextCards.map((item) =>
          item.id === firstId || item.id === secondId ? { ...item, matched: true } : item,
        );
        setMemoryCards(matchedCards);
        setSelectedMemoryIds([]);

        if (matchedCards.every((item) => item.matched)) {
          const elapsedMs = Date.now() - sessionStartedAtRef.current;
          void completeWithResult({
            title: "Memory match completed.",
            lines: [`Completed in ${formatDuration(elapsedMs)}`, `Moves: ${nextMoves}`],
            label: "Seconds",
            value: Math.round(elapsedMs / 1000),
            secondaryLabel: "Moves",
            secondaryValue: nextMoves,
            lowerIsBetter: true,
          });
        }
        return;
      }

      setMemoryCards(nextCards.map((item) => (item.id === firstId || item.id === secondId ? { ...item, visible: false } : item)));
      setSelectedMemoryIds([]);
    }, 650);
  };

  const finishSteadyTap = async () => {
    const config = getSteadyTapConfig(difficulty);
    const result = calculateConsistency(steadyTapTimes, config.tolerance);

    await completeWithResult({
      title: "Steady tap completed.",
      lines: [
        `Average pace: ${result.averagePace || 0} taps/min`,
        `Consistency: ${result.consistency}%`,
        `Taps: ${steadyTapTimes.length}`,
      ],
      label: "Consistency",
      value: result.consistency,
      secondaryLabel: "Taps",
      secondaryValue: steadyTapTimes.length,
    });
  };

  const handleSequenceInput = (tile: string) => {
    if (sequenceShowing) {
      return;
    }

    const tapMarker = { value: tile, nonce: Date.now() };
    setSequenceTappedTile(tapMarker);
    setTimeout(() => {
      setSequenceTappedTile((current) =>
        current && current.value === tapMarker.value && current.nonce === tapMarker.nonce ? null : current,
      );
    }, 220);

    const nextInput = [...sequenceInput, tile];
    setSequenceInput(nextInput);

    if (nextInput.length < sequenceValue.length) {
      return;
    }

    const correct = nextInput.every((value, index) => value === sequenceValue[index]);
    setSequenceAnswerState(correct ? "correct" : "incorrect");
    const config = getSequenceConfig(difficulty);
    const rememberedLength = correct ? sequenceRoundLength : Math.max(config.startLength - 1, sequenceRoundLength - 1);
    setSequenceHighestLength(Math.max(sequenceHighestLength, rememberedLength));

    if (!correct || sequenceRoundLength >= config.maxLength) {
      void completeWithResult({
        title: correct ? "Sequence completed." : "Sequence finished.",
        lines: [`Longest sequence: ${rememberedLength}`, `Difficulty: ${difficulty}`],
        label: "Length",
        value: rememberedLength,
      });
      return;
    }

    const nextLength = sequenceRoundLength + 1;
    const nextSequence = generateSequence(nextLength, config.tileCount);
    setSequenceRoundLength(nextLength);
    setSequenceValue(nextSequence);
    setSequenceInput([]);
    setSequenceShowing(true);
    setSequencePlaybackIndex(null);
    setSequenceTappedTile(null);
    setSequenceAnswerState("idle");
    setStatus("Correct. Watch the next sequence.");
  };

  const handleReactionTap = () => {
    const config = getReactionConfig(difficulty);

    if (reactionState === "waiting") {
      const nextFalseStarts = reactionFalseStarts + 1;
      setReactionFalseStarts(nextFalseStarts);
      setStatus("A little early. Wait for the cue.");
      return;
    }

    const reactionMs = Date.now() - reactionCueStartedAtRef.current;
    const nextTimes = [...reactionTimes, reactionMs];
    setReactionTimes(nextTimes);
    setStatus(null);

    if (reactionTrial >= config.trials) {
      const average = Math.round(nextTimes.reduce((sum, time) => sum + time, 0) / nextTimes.length);
      const best = Math.min(...nextTimes);
      const adjustedAverage = average + reactionFalseStarts * 100;

      void completeWithResult({
        title: "Reaction check completed.",
        lines: [
          `Average reaction: ${average} ms`,
          `Best reaction: ${best} ms`,
          reactionFalseStarts > 0 ? `Adjusted average: ${adjustedAverage} ms` : null,
          `Early taps: ${reactionFalseStarts}`,
        ].filter((line): line is string => Boolean(line)),
        label: "Milliseconds",
        value: adjustedAverage,
        secondaryLabel: "Best",
        secondaryValue: best,
        lowerIsBetter: true,
      });
      return;
    }

    setReactionTrial((current) => current + 1);
    setReactionState("waiting");
  };

  const handlePatternChoice = (choice: string) => {
    const config = getPatternConfig(difficulty);
    const nextCorrect = patternCorrect + (choice === patternData.answer ? 1 : 0);
    setPatternCorrect(nextCorrect);

    if (patternRound >= config.rounds) {
      const elapsedMs = Date.now() - sessionStartedAtRef.current;
      void completeWithResult({
        title: "Pattern spotting completed.",
        lines: [`Correct: ${nextCorrect}/${config.rounds}`, `Time: ${formatDuration(elapsedMs)}`],
        label: "Correct",
        value: nextCorrect,
        secondaryLabel: "Seconds",
        secondaryValue: Math.round(elapsedMs / 1000),
      });
      return;
    }

    const nextRound = patternRound + 1;
    setPatternRound(nextRound);
    setPatternData(generatePatternRound(difficulty, nextRound));
  };

  const handleFocusSprintChoice = (item: FocusTargetItem) => {
    if (focusSprintAdvancing) {
      return;
    }

    const config = getFocusSprintConfig(difficulty);
    const nextCorrect = focusSprintCorrect + (item.isTarget ? 1 : 0);
    const nextMissed = focusSprintMissed + (item.isTarget ? 0 : 1);
    const nextStreak = item.isTarget ? focusSprintStreak + 1 : 0;
    const nextBestStreak = Math.max(focusSprintBestStreak, nextStreak);
    setFocusSprintCorrect(nextCorrect);
    setFocusSprintMissed(nextMissed);
    setFocusSprintStreak(nextStreak);
    setFocusSprintBestStreak(nextBestStreak);
    setFocusSprintAdvancing(true);
    setStatus(item.isTarget ? "Correct." : "Not this one.");

    setTimeout(() => {
      if (focusSprintRound >= config.rounds) {
        const accuracy = Math.round((nextCorrect / config.rounds) * 100);
        void completeWithResult({
          title: "Focus sprint completed.",
          lines: [`Accuracy: ${accuracy}%`, `Targets completed: ${nextCorrect}/${config.rounds}`, `Focus streak: ${nextBestStreak}`],
          label: "Accuracy",
          value: accuracy,
          secondaryLabel: "Streak",
          secondaryValue: nextBestStreak,
        });
        return;
      }

      const nextRound = focusSprintRound + 1;
      setFocusSprintRound(nextRound);
      setFocusSprintData(generateFocusSprintRound(difficulty, nextRound));
      setFocusSprintAdvancing(false);
      setStatus(null);
    }, difficulty === "hard" ? 450 : 650);
  };

  const renderDifficultySelector = () => (
    <View style={styles.difficultyRow}>
      {DIFFICULTIES.map((item) => {
        const isSelected = difficulty === item.id;

        return (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            onPress={() => setDifficulty(item.id)}
        style={({ pressed }) => [
          styles.difficultyChip,
          isSelected && styles.difficultyChipSelected,
          pressed && styles.cardPressed,
        ]}
          >
            <AppText style={[styles.difficultyText, isSelected && styles.difficultyTextSelected]}>{item.label}</AppText>
          </Pressable>
        );
      })}
    </View>
  );

  const renderProgressHeader = (progress: string, current?: string) => (
    <View style={styles.progressPanel}>
      <View style={styles.exerciseStatsRow}>
        <AppText style={styles.exerciseStat}>Difficulty: {difficulty}</AppText>
        <AppText style={styles.exerciseStat}>{progress}</AppText>
      </View>
      <AppText style={styles.previousBestText}>{formatPreviousBest(selectedExerciseId, selectedBest, difficulty)}</AppText>
      {current ? <AppText style={styles.currentProgressText}>{current}</AppText> : null}
    </View>
  );

  const renderExerciseBody = () => {
    if (!selectedExercise || phase === "idle") {
      return null;
    }

    if (phase === "ready") {
      return (
        <View style={styles.exercisePanel}>
          <AppText style={styles.exerciseInstruction}>Choose difficulty</AppText>
          {renderDifficultySelector()}
          <AppText style={styles.previousBestText}>{formatPreviousBest(selectedExerciseId, selectedBest, difficulty)}</AppText>
          <AppButton label="Begin exercise" onPress={beginSelectedExercise} variant="primary" />
        </View>
      );
    }

    if (phase === "locked") {
      return (
        <View style={styles.resultCard}>
          <AppText style={styles.resultTitle}>Premium includes unlimited exercise sessions.</AppText>
          <AppText style={styles.resultBody}>You've used today's free exercise.</AppText>
          <AppButton label="View Premium" onPress={() => router.push("/premium?source=exercises-limit")} variant="primary" />
          <AppButton
            label="Try another exercise"
            onPress={() => {
              resetExerciseState();
              setSelectedExerciseId(null);
              setPhase("idle");
            }}
            variant="secondary"
          />
        </View>
      );
    }

    if (phase === "complete") {
      return (
        <View style={styles.resultCard}>
          <AppText style={styles.resultTitle}>Completed</AppText>
          {summary?.newBest ? <AppText style={styles.newBestText}>New best</AppText> : null}
          {(summary?.lines ?? [status ?? "Exercise completed."]).map((line) => (
            <AppText key={line} style={styles.resultBody}>{line}</AppText>
          ))}
          {summary?.previousBestLine ? <AppText style={styles.resultMeta}>{summary.previousBestLine}</AppText> : null}
          {summary?.bestLine ? <AppText style={styles.resultMeta}>{summary.bestLine}</AppText> : null}
          {hasPremiumAccess ? <AppButton label="Replay" onPress={replaySelectedExercise} variant="primary" /> : null}
          {!hasPremiumAccess ? (
            <>
              <AppText style={styles.resultBody}>Replay is included with Premium.</AppText>
              <AppButton label="View Premium" onPress={() => router.push("/premium?source=exercise-replay")} variant="primary" />
            </>
          ) : null}
          <AppButton
            label="Try another exercise"
            onPress={() => {
              resetExerciseState();
              setSelectedExerciseId(null);
              setPhase("idle");
            }}
            variant="secondary"
          />
        </View>
      );
    }

    if (selectedExercise.id === "memory-match") {
      return (
        <View style={styles.exercisePanel}>
          <AppText style={styles.exerciseInstruction}>Find the matching pairs.</AppText>
          <AppText style={styles.exerciseMeta}>{selectedExercise.purpose}</AppText>
          {renderProgressHeader(
            `${getMemoryPairCount(difficulty)} pairs • ${getMemoryModeLabel(memoryMode)}`,
            `Time: ${formatDuration(elapsedMs)} • Moves: ${memoryMoves}`,
          )}
          <View style={styles.memoryGrid}>
            {memoryCards.map((card) => (
              <Pressable
                key={card.id}
                accessibilityRole="button"
                onPress={() => handleMemoryCardPress(card.id)}
                style={({ pressed }) => [
                  styles.memoryCard,
                  difficulty === "hard" && styles.memoryCardHard,
                  (card.visible || card.matched) && styles.memoryCardVisible,
                  pressed && styles.cardPressed,
                ]}
              >
                <AppText style={styles.memoryCardText}>{card.visible || card.matched ? card.label : "?"}</AppText>
              </Pressable>
            ))}
          </View>
        </View>
      );
    }

    if (selectedExercise.id === "steady-tap") {
      const config = getSteadyTapConfig(difficulty);
      const currentConsistency = calculateConsistency(steadyTapTimes, config.tolerance);

      return (
        <View style={styles.exercisePanel}>
          <AppText style={styles.exerciseInstruction}>Tap the circle at a steady rhythm.</AppText>
          <AppText style={styles.exerciseMeta}>{selectedExercise.purpose}</AppText>
          {renderProgressHeader(
            `Session: ${formatDuration(config.durationMs)}`,
            `Time left: ${formatDuration(steadyRemainingMs)} • Taps: ${steadyTapTimes.length}`,
          )}
          <View style={styles.exerciseStatsRow}>
            <AppText style={styles.exerciseStat}>Consistency: {currentConsistency.consistency}%</AppText>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => setSteadyTapTimes((current) => [...current, Date.now()])}
            style={({ pressed }) => [
              styles.circleTargetWrap,
              { width: config.targetSize + 40, height: config.targetSize + 40 },
              pressed && styles.cardPressed,
            ]}
          >
            <View style={[styles.circleTarget, { width: config.targetSize, height: config.targetSize }]} />
          </Pressable>
          <AppText style={styles.exerciseMeta}>Taps: {steadyTapTimes.length}</AppText>
        </View>
      );
    }

    if (selectedExercise.id === "sequence-recall") {
      const config = getSequenceConfig(difficulty);
      const roundNumber = sequenceRoundLength - config.startLength + 1;

      return (
        <View style={styles.exercisePanel}>
          <AppText style={styles.exerciseInstruction}>
            {sequenceShowing ? "Watch the sequence." : "Repeat the sequence."}
          </AppText>
          <AppText style={styles.exerciseMeta}>{selectedExercise.purpose}</AppText>
          {renderProgressHeader(
            `Round ${roundNumber}`,
            `Length: ${sequenceRoundLength} • Best this session: ${sequenceHighestLength || "none yet"}`,
          )}
          {status ? <AppText style={styles.exerciseMeta}>{status}</AppText> : null}
          {sequenceShowing ? (
            <View style={styles.choiceRow}>
              {SEQUENCE_TILES.slice(0, config.tileCount).map((item) => {
                const isActive = sequencePlaybackIndex !== null && sequenceValue[sequencePlaybackIndex] === item;

                return (
                  <View
                    key={item}
                    style={[
                      styles.sequenceTile,
                      isActive && styles.sequenceTileActive,
                    ]}
                  >
                    <AppText style={[styles.sequenceTileText, isActive && styles.sequenceTileTextActive]}>{item}</AppText>
                  </View>
                );
              })}
            </View>
          ) : (
            <>
              <View style={styles.choiceRow}>
                {SEQUENCE_TILES.slice(0, config.tileCount).map((item) => (
                  <Pressable
                    key={item}
                    accessibilityRole="button"
                    onPress={() => handleSequenceInput(item)}
                    style={({ pressed }) => [
                      styles.choiceChip,
                      sequenceTappedTile?.value === item && styles.choiceChipSelected,
                      sequenceAnswerState === "correct" && sequenceTappedTile?.value === item && styles.choiceChipCorrect,
                      sequenceAnswerState === "incorrect" && sequenceTappedTile?.value === item && styles.choiceChipIncorrect,
                      pressed && styles.cardPressed,
                    ]}
                  >
                    <AppText
                      style={[
                        styles.choiceChipText,
                        sequenceTappedTile?.value === item && styles.choiceChipTextSelected,
                      ]}
                    >
                      {item}
                    </AppText>
                  </Pressable>
                ))}
              </View>
              <AppText style={styles.exerciseMeta}>Entered: {sequenceInput.join(" ") || "None yet"}</AppText>
            </>
          )}
        </View>
      );
    }

    if (selectedExercise.id === "reaction-check") {
      const config = getReactionConfig(difficulty);

      return (
        <View style={styles.exercisePanel}>
          <AppText style={styles.exerciseInstruction}>
            Trial {reactionTrial} of {config.trials}
          </AppText>
          <AppText style={styles.exerciseMeta}>{selectedExercise.purpose}</AppText>
          {renderProgressHeader(
            `${config.trials} trials`,
            reactionTimes.length > 0
              ? `Current average: ${Math.round(reactionTimes.reduce((sum, time) => sum + time, 0) / reactionTimes.length)} ms`
              : "Current average: none yet",
          )}
          <AppText style={styles.exerciseMeta}>{reactionState === "ready" ? "Tap now." : "Wait for the cue."}</AppText>
          <Pressable
            accessibilityRole="button"
            onPress={handleReactionTap}
            style={({ pressed }) => [
              styles.reactionTarget,
              { width: config.targetSize, height: config.targetSize },
              reactionState === "ready" && styles.reactionTargetReady,
              pressed && styles.cardPressed,
            ]}
          >
            <AppText style={styles.largeTargetText}>{reactionState === "ready" ? "Tap" : "Wait"}</AppText>
          </Pressable>
          {status ? <AppText style={styles.exerciseMeta}>{status}</AppText> : null}
          <AppText style={styles.exerciseMeta}>Early taps: {reactionFalseStarts}</AppText>
        </View>
      );
    }

    if (selectedExercise.id === "pattern-spotting") {
      const config = getPatternConfig(difficulty);

      return (
        <View style={styles.exercisePanel}>
          <AppText style={styles.exerciseInstruction}>
            What comes next? Round {patternRound} of {config.rounds}
          </AppText>
          <AppText style={styles.exerciseMeta}>{selectedExercise.purpose}</AppText>
          {renderProgressHeader(`${patternRound}/${config.rounds} • ${patternData.modeLabel}`, `Correct so far: ${patternCorrect}/${config.rounds}`)}
          <View style={styles.patternSequenceRow}>
            {patternData.sequence.map((item, index) => (
              <View
                key={`${patternData.mode}-${index}-${item}`}
                style={[
                  styles.patternCard,
                  difficulty === "medium" && styles.patternCardMedium,
                  difficulty === "hard" && styles.patternCardHard,
                ]}
              >
                <AppText style={styles.patternText}>{item}</AppText>
              </View>
            ))}
            <View
              style={[
                styles.patternCard,
                styles.patternQuestionCard,
                difficulty === "medium" && styles.patternCardMedium,
                difficulty === "hard" && styles.patternCardHard,
              ]}
            >
              <AppText style={styles.patternText}>?</AppText>
            </View>
          </View>
          <View style={styles.patternGrid}>
            {patternData.options.map((item) => (
              <Pressable
                key={`${patternData.mode}-option-${item}`}
                accessibilityRole="button"
                onPress={() => handlePatternChoice(item)}
                style={({ pressed }) => [
                  styles.patternCard,
                  difficulty === "medium" && styles.patternCardMedium,
                  difficulty === "hard" && styles.patternCardHard,
                  pressed && styles.cardPressed,
                ]}
              >
                <AppText style={styles.patternText}>{item}</AppText>
              </Pressable>
            ))}
          </View>
        </View>
      );
    }

    if (selectedExercise.id === "focus-sprint") {
      const config = getFocusSprintConfig(difficulty);

      return (
        <View style={styles.exercisePanel}>
          <AppText style={styles.exerciseInstruction}>{focusSprintData.ruleLabel}</AppText>
          <AppText style={styles.exerciseMeta}>Supports sustained attention and focus consistency.</AppText>
          {renderProgressHeader(
            `${focusSprintRound}/${config.rounds}`,
            `Targets: ${focusSprintCorrect}/${config.rounds} • Streak: ${focusSprintStreak}`,
          )}
          {status ? <AppText style={styles.exerciseMeta}>{status}</AppText> : null}
          <View style={styles.filterGrid}>
            {focusSprintData.items.map((item) => (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                disabled={focusSprintAdvancing}
                onPress={() => handleFocusSprintChoice(item)}
                style={({ pressed }) => [
                  styles.filterTarget,
                  item.shape === "circle" && styles.filterTargetCircle,
                  item.color === "blue" && styles.filterTargetBlue,
                  item.color === "green" && styles.filterTargetGreen,
                  item.color === "orange" && styles.filterTargetOrange,
                  difficulty === "hard" && styles.filterTargetHard,
                  pressed && styles.cardPressed,
                ]}
              />
            ))}
          </View>
        </View>
      );
    }

    return null;
  };

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <AppText style={styles.sectionTitle}>Exercises</AppText>
          <AppText style={styles.sectionSubtitle}>Short cognitive and focus exercises.</AppText>
        </View>
        <AppText style={styles.usagePill}>{getUsageCopy(usage, hasPremiumAccess)}</AppText>
      </View>

      <View style={styles.exerciseList}>
        {visibleExercises.map((exercise) => {
          const isSelected = selectedExerciseId === exercise.id;
          const isLocked = Boolean(exercise.premiumOnly && !hasPremiumAccess);

          return (
            <Pressable
              key={exercise.id}
              accessibilityRole="button"
              onPress={() => startExercise(exercise)}
              style={({ pressed }) => [
                styles.exerciseCard,
                isSelected && styles.exerciseCardSelected,
                isLocked && styles.exerciseCardLocked,
                pressed && styles.cardPressed,
              ]}
            >
              <View style={styles.exerciseCardHeader}>
                <AppText style={styles.exerciseTitle}>{exercise.title}</AppText>
                <View style={styles.metaRow}>
                  <AppText style={styles.metaPill}>{exercise.durationLabel}</AppText>
                  {isLocked ? <AppText style={styles.premiumPill}>Premium</AppText> : null}
                </View>
              </View>
              <AppText style={styles.exerciseDescription}>{exercise.description}</AppText>
              <AppText style={styles.exercisePurpose}>{exercise.purpose}</AppText>
            </Pressable>
          );
        })}
      </View>

      {limitReached && !hasPremiumAccess ? (
        <View style={styles.limitCard}>
          <AppText style={styles.limitTitle}>You've used today's free exercise.</AppText>
          <AppText style={styles.limitBody}>Premium includes unlimited exercises.</AppText>
          <AppButton label="View Premium" onPress={() => router.push("/premium?source=exercises-limit")} variant="secondary" />
        </View>
      ) : null}

      {selectedExercise && phase !== "idle" ? (
        <View onLayout={handleActiveExerciseLayout}>{renderExerciseBody()}</View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 14,
  },
  header: {
    gap: 10,
  },
  headerText: {
    gap: 4,
  },
  sectionTitle: {
    color: "#1f2937",
    fontSize: 20,
    fontWeight: "800",
  },
  sectionSubtitle: {
    color: "#6b7280",
    lineHeight: 20,
  },
  usagePill: {
    alignSelf: "flex-start",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#f3dfd1",
    backgroundColor: "#fffaf6",
    color: "#8b6a4f",
    fontSize: 12,
    fontWeight: "700",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  exerciseList: {
    gap: 10,
  },
  exerciseCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#f3dfd1",
    backgroundColor: "#ffffff",
    padding: 16,
    gap: 8,
  },
  exerciseCardSelected: {
    borderColor: "#e8751a",
    backgroundColor: "#fffaf6",
  },
  exerciseCardLocked: {
    opacity: 0.72,
  },
  exerciseCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  exerciseTitle: {
    flex: 1,
    color: "#1f2937",
    fontSize: 16,
    fontWeight: "800",
  },
  metaRow: {
    flexDirection: "row",
    gap: 6,
  },
  metaPill: {
    borderRadius: 999,
    backgroundColor: "#f7eee7",
    color: "#6b4f3a",
    fontSize: 12,
    fontWeight: "700",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  premiumPill: {
    borderRadius: 999,
    backgroundColor: "#fff0e5",
    color: "#b45309",
    fontSize: 12,
    fontWeight: "700",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  exerciseDescription: {
    color: "#374151",
    lineHeight: 20,
  },
  exercisePurpose: {
    color: "#6b7280",
    fontSize: 13,
    lineHeight: 18,
  },
  exercisePanel: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ead8ca",
    backgroundColor: "#fffaf6",
    padding: 16,
    gap: 14,
  },
  exerciseInstruction: {
    color: "#1f2937",
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 22,
  },
  exerciseMeta: {
    color: "#6b7280",
    lineHeight: 20,
  },
  exerciseStatsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  progressPanel: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#ead8ca",
    backgroundColor: "#ffffff",
    padding: 12,
    gap: 8,
  },
  exerciseStat: {
    borderRadius: 999,
    backgroundColor: "#ffffff",
    color: "#6b4f3a",
    fontSize: 12,
    fontWeight: "800",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  previousBestText: {
    color: "#6b4f3a",
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 19,
  },
  currentProgressText: {
    color: "#374151",
    fontWeight: "700",
    lineHeight: 20,
  },
  difficultyRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  difficultyChip: {
    minHeight: 48,
    minWidth: 88,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#ead8ca",
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  difficultyChipSelected: {
    borderColor: "#e8751a",
    backgroundColor: "#fff0e5",
  },
  difficultyText: {
    color: "#6b7280",
    fontWeight: "800",
  },
  difficultyTextSelected: {
    color: "#9a4b0f",
  },
  memoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  memoryCard: {
    width: "22%",
    minWidth: 68,
    minHeight: 62,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#ead8ca",
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
  },
  memoryCardHard: {
    width: "20%",
    minWidth: 58,
  },
  memoryCardVisible: {
    backgroundColor: "#fff0e5",
    borderColor: "#e8751a",
  },
  memoryCardText: {
    color: "#1f2937",
    fontWeight: "800",
    textAlign: "center",
  },
  circleTargetWrap: {
    alignSelf: "center",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#ead8ca",
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  circleTarget: {
    borderRadius: 999,
    backgroundColor: "#e8751a",
    opacity: 0.88,
  },
  largeTargetText: {
    color: "#1f2937",
    fontSize: 24,
    fontWeight: "800",
  },
  sequencePreview: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  sequenceTile: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#ead8ca",
    alignItems: "center",
    justifyContent: "center",
  },
  sequenceTileActive: {
    backgroundColor: "#e8751a",
    borderColor: "#c25d10",
    transform: [{ scale: 1.05 }],
  },
  sequenceTileText: {
    color: "#1f2937",
    fontSize: 18,
    fontWeight: "800",
  },
  sequenceTileTextActive: {
    color: "#ffffff",
  },
  choiceRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  choiceChip: {
    minWidth: 72,
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#ead8ca",
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  choiceChipSelected: {
    backgroundColor: "#eaf3ff",
    borderColor: "#5b8def",
    transform: [{ scale: 1.03 }],
  },
  choiceChipCorrect: {
    backgroundColor: "#e8f7ec",
    borderColor: "#58a56a",
  },
  choiceChipIncorrect: {
    backgroundColor: "#fbecec",
    borderColor: "#d98282",
  },
  choiceChipText: {
    color: "#1f2937",
    fontSize: 18,
    fontWeight: "800",
  },
  choiceChipTextSelected: {
    color: "#2557a7",
  },
  reactionTarget: {
    alignSelf: "center",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#ead8ca",
    backgroundColor: "#f8f3ef",
    alignItems: "center",
    justifyContent: "center",
  },
  reactionTargetReady: {
    backgroundColor: "#e8f7ec",
    borderColor: "#7abf83",
  },
  patternGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  patternSequenceRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  patternCard: {
    width: "47%",
    minHeight: 76,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#ead8ca",
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  patternCardMedium: {
    width: "30%",
  },
  patternCardHard: {
    width: "22%",
    minHeight: 64,
  },
  patternQuestionCard: {
    backgroundColor: "#fff6ee",
    borderColor: "#f0d1b5",
  },
  patternText: {
    color: "#1f2937",
    fontSize: 15,
    fontWeight: "800",
    textAlign: "center",
  },
  filterGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  filterTarget: {
    width: 64,
    height: 64,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#ead8ca",
    alignItems: "center",
    justifyContent: "center",
  },
  filterTargetHard: {
    width: 52,
    height: 52,
  },
  filterTargetCircle: {
    borderRadius: 999,
  },
  filterTargetBlue: {
    backgroundColor: "#bfdbfe",
    borderColor: "#60a5fa",
  },
  filterTargetGreen: {
    backgroundColor: "#bbf7d0",
    borderColor: "#4ade80",
  },
  filterTargetOrange: {
    backgroundColor: "#fed7aa",
    borderColor: "#fb923c",
  },
  filterTargetSelected: {
    opacity: 0.46,
    borderColor: "#166534",
  },
  filterSelectedText: {
    color: "#166534",
    fontSize: 20,
    fontWeight: "900",
  },
  resultCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#d8ead9",
    backgroundColor: "#f7fbf7",
    padding: 16,
    gap: 10,
  },
  resultTitle: {
    color: "#166534",
    fontSize: 17,
    fontWeight: "800",
  },
  resultBody: {
    color: "#36543d",
    lineHeight: 20,
  },
  resultMeta: {
    color: "#4d7c58",
    fontWeight: "700",
    lineHeight: 20,
  },
  newBestText: {
    alignSelf: "flex-start",
    borderRadius: 999,
    backgroundColor: "#e8f7ec",
    color: "#166534",
    fontSize: 12,
    fontWeight: "800",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  limitCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#f3dfd1",
    backgroundColor: "#fffaf6",
    padding: 16,
    gap: 10,
  },
  limitTitle: {
    color: "#1f2937",
    fontSize: 16,
    fontWeight: "800",
  },
  limitBody: {
    color: "#6b7280",
    lineHeight: 20,
  },
  cardPressed: {
    opacity: 0.84,
  },
});
