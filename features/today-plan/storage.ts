import { appSecureStore } from "../../lib/secure-store";

export type TodayPlan = {
  userId: string;
  date: string;
  mainPriority: string;
  energyLevel: string;
  staySmaller: string;
  recoveryProtection: string;
  tomorrowEnergy: string;
  prepareTonight: string;
  tomorrowSmaller: string;
  recoveryTonight: string;
  whatHelped: string;
  isComplete: boolean;
  createdAt: string;
  updatedAt: string;
};

const TODAY_PLAN_KEY_PREFIX = "livewithms.today-plan";

function getTodayPlanKey(userId: string, date: string) {
  return `${TODAY_PLAN_KEY_PREFIX}.${userId}.${date}`;
}

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function sanitizeTodayPlan(input: Partial<TodayPlan> | null | undefined, userId: string, date: string): TodayPlan {
  return {
    userId,
    date,
    mainPriority: normalizeText(input?.mainPriority),
    energyLevel: normalizeText(input?.energyLevel),
    staySmaller: normalizeText(input?.staySmaller),
    recoveryProtection: normalizeText(input?.recoveryProtection),
    tomorrowEnergy: normalizeText(input?.tomorrowEnergy),
    prepareTonight: normalizeText(input?.prepareTonight),
    tomorrowSmaller: normalizeText(input?.tomorrowSmaller),
    recoveryTonight: normalizeText(input?.recoveryTonight),
    whatHelped: normalizeText(input?.whatHelped),
    isComplete: typeof input?.isComplete === "boolean" ? input.isComplete : false,
    createdAt: typeof input?.createdAt === "string" ? input.createdAt : new Date().toISOString(),
    updatedAt: typeof input?.updatedAt === "string" ? input.updatedAt : new Date().toISOString(),
  };
}

function getLocalDateOffset(date: string, offset: number) {
  const value = new Date(`${date}T12:00:00`);
  value.setDate(value.getDate() + offset);
  return value.toISOString().slice(0, 10);
}

export async function loadTodayPlan(userId: string, date: string) {
  if (!userId || !date) {
    return null;
  }

  try {
    const raw = await appSecureStore.getItem(getTodayPlanKey(userId, date));

    if (!raw) {
      return null;
    }

    return sanitizeTodayPlan(JSON.parse(raw) as Partial<TodayPlan>, userId, date);
  } catch {
    return null;
  }
}

export async function saveTodayPlan(plan: TodayPlan) {
  if (!plan.userId || !plan.date) {
    return;
  }

  try {
    const sanitized = sanitizeTodayPlan(plan, plan.userId, plan.date);
    await appSecureStore.setItem(getTodayPlanKey(plan.userId, plan.date), JSON.stringify(sanitized));
  } catch {
    // Today Plan is supportive context; storage issues should not block the Today page.
  }
}

export async function loadRecentTodayPlans(userId: string, endDate: string, days: number) {
  if (!userId || !endDate || days <= 0) {
    return [] as TodayPlan[];
  }

  const plans = await Promise.all(
    Array.from({ length: days }, (_, index) => loadTodayPlan(userId, getLocalDateOffset(endDate, -index))),
  );

  return plans.filter((plan): plan is TodayPlan => Boolean(plan));
}
