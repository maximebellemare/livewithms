import type { CheckInOverviewEntry } from "./types";

const MILESTONES = [1, 3, 7, 14, 30] as const;

function getPreviousDateString(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  const previous = new Date(year, month - 1, day);
  previous.setDate(previous.getDate() - 1);

  const nextYear = previous.getFullYear();
  const nextMonth = String(previous.getMonth() + 1).padStart(2, "0");
  const nextDay = String(previous.getDate()).padStart(2, "0");

  return `${nextYear}-${nextMonth}-${nextDay}`;
}

export function getCurrentCheckInStreak(entries: CheckInOverviewEntry[], today: string) {
  const loggedDates = new Set(entries.map((entry) => entry.date));

  if (!loggedDates.has(today)) {
    return 0;
  }

  let streak = 0;
  let currentDate = today;

  while (loggedDates.has(currentDate)) {
    streak += 1;
    currentDate = getPreviousDateString(currentDate);
  }

  return streak;
}

export function getCheckInsInLastDays(entries: CheckInOverviewEntry[], today: string, days: number) {
  const todayDate = new Date(`${today}T12:00:00`);
  const cutoffDate = new Date(todayDate);
  cutoffDate.setDate(todayDate.getDate() - (days - 1));

  return entries.filter((entry) => {
    const entryDate = new Date(`${entry.date}T12:00:00`);
    return entryDate >= cutoffDate && entryDate <= todayDate;
  }).length;
}

export function getLatestMilestone(totalCheckIns: number) {
  return [...MILESTONES].reverse().find((milestone) => totalCheckIns >= milestone) ?? null;
}

export function getMilestoneMessage(totalCheckIns: number) {
  const milestone = getLatestMilestone(totalCheckIns);

  if (!milestone) {
    return null;
  }

  if (milestone === 1) {
    return {
      title: "You started",
      body: "Your first check-in is in the books. Small steps really do count.",
    };
  }

  if (milestone === 3) {
    return {
      title: "You’re building consistency",
      body: "A few steady check-ins are already helping this app feel more personal.",
    };
  }

  if (milestone === 7) {
    return {
      title: "A full week of check-ins",
      body: "You’ve been showing up consistently. Small steps add up.",
    };
  }

  if (milestone === 14) {
    return {
      title: "Two weeks of showing up",
      body: "You’re building a steadier picture of what your days feel like.",
    };
  }

  return {
    title: "A month of check-ins",
    body: "You’ve built a strong base for patterns, reflection, and support.",
  };
}

export function getCareWins(entries: CheckInOverviewEntry[]) {
  const totalCheckIns = entries.length;
  const wins: string[] = [];

  if (totalCheckIns >= 1) {
    wins.push("Completed your first check-in");
  }

  if (entries.some((entry) => entry.hasReflection)) {
    wins.push("Completed your first reflection");
  }

  if (totalCheckIns >= 3) {
    wins.push("Checked in 3 times");
  }

  if (totalCheckIns >= 7) {
    wins.push("Checked in 7 times");
  }

  if (totalCheckIns >= 14) {
    wins.push("Checked in 14 times");
  }

  if (totalCheckIns >= 30) {
    wins.push("Checked in 30 times");
  }

  return wins;
}
