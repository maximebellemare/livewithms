import { appSecureStore } from "../../lib/secure-store";

const AI_COACH_USAGE_KEY = "livewithms.premium.ai-coach-usage";

type AiCoachUsageState = {
  date: string;
  count: number;
};

function getTodayDateString() {
  return new Date().toISOString().slice(0, 10);
}

export async function loadAiCoachUsage(): Promise<AiCoachUsageState> {
  const today = getTodayDateString();

  try {
    const raw = await appSecureStore.getItem(AI_COACH_USAGE_KEY);

    if (!raw) {
      return { date: today, count: 0 };
    }

    const parsed = JSON.parse(raw) as Partial<AiCoachUsageState>;

    if (parsed.date !== today) {
      return { date: today, count: 0 };
    }

    return {
      date: today,
      count: typeof parsed.count === "number" && parsed.count >= 0 ? parsed.count : 0,
    };
  } catch {
    return { date: today, count: 0 };
  }
}

export async function incrementAiCoachUsage() {
  const current = await loadAiCoachUsage();
  const nextState = {
    date: current.date,
    count: current.count + 1,
  };

  try {
    await appSecureStore.setItem(AI_COACH_USAGE_KEY, JSON.stringify(nextState));
  } catch {
    // Keep local usage failures silent so Coach never breaks.
  }

  return nextState;
}
