import { appSecureStore } from "../../lib/secure-store";

const EXERCISE_USAGE_KEY = "livewithms.exercise-usage";
const EXERCISE_BESTS_KEY = "livewithms.exercise-bests";

export type ExerciseUsage = {
  date: string;
  count: number;
  sessionsCompleted: number;
  preferredExerciseIds: string[];
};

export type ExerciseDifficulty = "easy" | "medium" | "hard";

export type ExerciseBest = {
  label: string;
  value: number;
  secondaryLabel?: string;
  secondaryValue?: number;
  recordedAt: string;
};

export type ExerciseBests = Record<string, Partial<Record<ExerciseDifficulty, ExerciseBest>>>;

export type ExerciseResult = {
  exerciseId: string;
  difficulty: ExerciseDifficulty;
  label: string;
  value: number;
  secondaryLabel?: string;
  secondaryValue?: number;
  lowerIsBetter?: boolean;
};

export const FREE_DAILY_EXERCISE_LIMIT = 1;

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function getDefaultUsage(): ExerciseUsage {
  return {
    date: getTodayKey(),
    count: 0,
    sessionsCompleted: 0,
    preferredExerciseIds: [],
  };
}

function normalizeUsage(value: Partial<ExerciseUsage> | null): ExerciseUsage {
  const today = getTodayKey();

  if (!value || value.date !== today) {
    return {
      ...getDefaultUsage(),
      sessionsCompleted: value?.sessionsCompleted ?? 0,
      preferredExerciseIds: value?.preferredExerciseIds ?? [],
    };
  }

  return {
    ...getDefaultUsage(),
    ...value,
  };
}

export async function loadExerciseUsage(): Promise<ExerciseUsage> {
  const raw = await appSecureStore.getItem(EXERCISE_USAGE_KEY);

  if (!raw) {
    return getDefaultUsage();
  }

  try {
    return normalizeUsage(JSON.parse(raw) as Partial<ExerciseUsage>);
  } catch {
    return getDefaultUsage();
  }
}

export async function saveExerciseUsage(usage: ExerciseUsage) {
  await appSecureStore.setItem(EXERCISE_USAGE_KEY, JSON.stringify(usage));
}

export async function recordExerciseSession(exerciseId: string) {
  const usage = await loadExerciseUsage();
  const nextPreferredIds = [
    exerciseId,
    ...usage.preferredExerciseIds.filter((id) => id !== exerciseId),
  ].slice(0, 5);
  const nextUsage: ExerciseUsage = {
    ...usage,
    count: usage.count + 1,
    sessionsCompleted: usage.sessionsCompleted + 1,
    preferredExerciseIds: nextPreferredIds,
  };

  await saveExerciseUsage(nextUsage);
  return nextUsage;
}

export async function loadExerciseBests(): Promise<ExerciseBests> {
  const raw = await appSecureStore.getItem(EXERCISE_BESTS_KEY);

  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw) as ExerciseBests;
  } catch {
    return {};
  }
}

export async function saveExerciseBests(bests: ExerciseBests) {
  await appSecureStore.setItem(EXERCISE_BESTS_KEY, JSON.stringify(bests));
}

function isBetterResult(input: {
  nextValue: number;
  previousValue: number;
  lowerIsBetter?: boolean;
}) {
  return input.lowerIsBetter
    ? input.nextValue < input.previousValue
    : input.nextValue > input.previousValue;
}

export async function recordExerciseResult(result: ExerciseResult) {
  const bests = await loadExerciseBests();
  const currentBest = bests[result.exerciseId]?.[result.difficulty] ?? null;
  const improved = !currentBest || isBetterResult({
    nextValue: result.value,
    previousValue: currentBest.value,
    lowerIsBetter: result.lowerIsBetter,
  });
  const nextBest: ExerciseBest = improved
    ? {
        label: result.label,
        value: result.value,
        secondaryLabel: result.secondaryLabel,
        secondaryValue: result.secondaryValue,
        recordedAt: new Date().toISOString(),
      }
    : currentBest;
  const nextBests: ExerciseBests = {
    ...bests,
    [result.exerciseId]: {
      ...(bests[result.exerciseId] ?? {}),
      [result.difficulty]: nextBest,
    },
  };

  await saveExerciseBests(nextBests);

  return {
    bests: nextBests,
    previousBest: currentBest,
    currentBest: nextBest,
    improved,
  };
}
