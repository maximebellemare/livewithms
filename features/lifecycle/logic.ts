import { APP_CONFIG } from "../../lib/app-config";

export type LifecycleStage = "new" | "first-week" | "active" | "inconsistent" | "returning" | "long-term";

export type LifecycleProfile = {
  stage: LifecycleStage;
  previousActiveGapDays: number | null;
  daysSinceFirstOpen: number | null;
  isReactivatedRecently: boolean;
  shouldSoftenPremiumPrompts: boolean;
};

function normalizeDate(value: string) {
  return value.slice(0, 10);
}

function getTodayDateString() {
  return new Date().toISOString().slice(0, 10);
}

function getDayDifference(from: string, to: string) {
  const fromDate = new Date(`${normalizeDate(from)}T12:00:00`);
  const toDate = new Date(`${normalizeDate(to)}T12:00:00`);
  return Math.round((toDate.getTime() - fromDate.getTime()) / 86_400_000);
}

export function buildLifecycleProfile(input: {
  firstOpenedAt: string | null;
  activeDates: string[];
  totalCheckIns: number;
  weeklyCheckIns: number;
}): LifecycleProfile {
  const today = getTodayDateString();
  const activeDates = Array.from(new Set(input.activeDates.map(normalizeDate))).sort();
  const previousActiveDate = activeDates.length >= 2 ? activeDates[activeDates.length - 2] : null;
  const previousActiveGapDays =
    previousActiveDate ? Math.max(0, getDayDifference(previousActiveDate, today)) : null;
  const daysSinceFirstOpen = input.firstOpenedAt ? Math.max(0, getDayDifference(input.firstOpenedAt, today)) : null;

  let stage: LifecycleStage;

  if (input.totalCheckIns === 0 || activeDates.length <= 1) {
    stage = "new";
  } else if (previousActiveGapDays !== null && previousActiveGapDays >= APP_CONFIG.lifecycle.reactivationGapDays) {
    stage = "returning";
  } else if ((daysSinceFirstOpen ?? 99) <= APP_CONFIG.lifecycle.firstWeekDays && input.totalCheckIns < 8) {
    stage = "first-week";
  } else if (
    activeDates.length >= APP_CONFIG.lifecycle.longTermActiveDays ||
    input.totalCheckIns >= APP_CONFIG.lifecycle.longTermCheckIns
  ) {
    stage = "long-term";
  } else if (input.weeklyCheckIns >= APP_CONFIG.lifecycle.activeWeeklyCheckIns) {
    stage = "active";
  } else {
    stage = "inconsistent";
  }

  return {
    stage,
    previousActiveGapDays,
    daysSinceFirstOpen,
    isReactivatedRecently: stage === "returning",
    shouldSoftenPremiumPrompts: stage === "new" || stage === "first-week" || stage === "returning",
  };
}
