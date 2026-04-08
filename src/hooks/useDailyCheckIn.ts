import { useState, useEffect, useCallback, useMemo } from "react";
import { format, subDays, differenceInCalendarDays } from "date-fns";

export type CheckInMood = "good" | "okay" | "struggling" | "exhausted";

export interface CheckInData {
  mood: CheckInMood;
  aiResponse: string;
  suggestion: string;
  timestamp: string;
}

export interface CheckInHistoryEntry {
  date: string;
  mood: CheckInMood;
  completedAt: string;
}

export type PatternType =
  | "consecutive_exhausted"
  | "consecutive_struggling"
  | "low_energy_week"
  | "improving"
  | "consistent_checkins"
  | "re_engage"
  | null;

export interface PatternInsight {
  type: NonNullable<PatternType>;
  message: string;
  suggestion?: string;
}

const STORAGE_KEY = "daily_checkin";
const HISTORY_KEY = "daily_checkin_history";

// ── AI responses ──────────────────────────────────────────────

const AI_RESPONSES: Record<CheckInMood, string[]> = {
  good: [
    "That's really lovely to hear. Lean into this energy today.",
    "What a good feeling to start with. You've earned this.",
    "I'm glad today feels lighter. Let's carry that forward gently.",
    "Good days are worth noticing. Take a moment to appreciate this one.",
    "Something's going right today — hold onto that.",
    "This is the kind of day to savour. No rush, just enjoy it.",
    "You're feeling it today. That matters more than you know.",
    "A good day is never small. Let yourself feel this fully.",
  ],
  okay: [
    "Okay is honest, and honest is brave. That's enough for today.",
    "Not every day needs to be great. Okay is a perfectly fine place to be.",
    "Some days just land in the middle — and that's real life.",
    "Thanks for being honest. Okay days have their own quiet strength.",
    "You showed up and checked in. That counts for something.",
    "Middle-ground days can surprise you. Stay open to small good moments.",
    "Okay is a starting point, not a limit. See where the day takes you.",
    "There's nothing wrong with a steady day. You're doing fine.",
  ],
  struggling: [
    "I hear you. Today might be a slower day, and that's okay.",
    "Struggling doesn't mean failing — it means you're still in it.",
    "Some days are heavier. You don't need to force anything right now.",
    "It's okay to have a hard day. Be gentle with yourself.",
    "You're carrying a lot. Even reading this means you're trying.",
    "Hard days pass. They always do. Take it one moment at a time.",
    "You don't have to have it all together today. Just be here.",
    "Thanks for telling me. That honesty takes real courage.",
  ],
  exhausted: [
    "Rest isn't giving up — it's how your body asks for care.",
    "Exhaustion is real, and I see you. Let's keep today simple.",
    "Your body is talking. Listening to it is an act of strength.",
    "Today might be a day for less. That's not weakness, it's wisdom.",
    "When everything feels heavy, doing less is doing enough.",
    "You don't need to push through today. Just be.",
    "Exhausted days need softness. Give yourself that permission.",
    "Some days the bravest thing you can do is rest.",
  ],
};

const CARD_SUGGESTIONS: Record<CheckInMood, string[]> = {
  good: [
    "Build on today's momentum",
    "Notice what's helping you feel this way",
    "A great day to track what's working",
    "Keep your rhythm — it's paying off",
  ],
  okay: [
    "One small thing can shift an okay day",
    "Try something that brings you a quiet moment",
    "Check in with your body when you can",
    "A gentle walk or stretch might feel nice",
  ],
  struggling: [
    "Take one thing at a time today",
    "A short pause can make a difference",
    "Write down what's on your mind",
    "It's okay to ask for support",
  ],
  exhausted: [
    "Rest gently — you've earned it",
    "Keep your to-do list very short today",
    "Your only job right now is to take care of you",
    "Let go of anything that can wait",
  ],
};

// ── Pattern insight copy (multiple variants per pattern) ──────

const PATTERN_MESSAGES: Record<NonNullable<PatternType>, { messages: string[]; suggestions?: string[] }> = {
  consecutive_exhausted: {
    messages: [
      "The last couple of days have felt really draining. That's a lot to carry.",
      "Exhaustion has been showing up consistently. Your body might be asking for extra care.",
      "It's been a heavy stretch. Be especially gentle with yourself right now.",
    ],
    suggestions: [
      "Keeping today very simple might help",
      "Rest is productive on days like these",
      "Consider clearing anything that can wait",
    ],
  },
  consecutive_struggling: {
    messages: [
      "Looks like the last few days have felt heavier than usual.",
      "It's been a tough stretch. You're still here, and that counts.",
      "Hard days in a row can feel overwhelming. You don't have to carry it all at once.",
    ],
    suggestions: [
      "A small reset — even a few breaths — can help",
      "Try letting go of just one thing today",
      "Writing down what's weighing on you might lighten the load",
    ],
  },
  low_energy_week: {
    messages: [
      "Energy has been low a few times this week. That's worth noticing.",
      "This week has had some heavier days. Be patient with yourself.",
      "Low energy has shown up more than once lately. That's okay — it happens.",
    ],
    suggestions: [
      "Pacing your energy today could make a difference",
      "See if a lighter schedule helps over the next day or two",
    ],
  },
  improving: {
    messages: [
      "Things seem to be shifting in a better direction. That's really encouraging.",
      "You seem to be having a steadier stretch. Keep going at your own pace.",
      "After some harder days, today feels a bit lighter. That's progress.",
      "There's a gentle upswing happening. You're doing well.",
    ],
  },
  consistent_checkins: {
    messages: [
      "You've been checking in consistently. That's a quiet but powerful habit.",
      "Showing up every day — even briefly — builds something meaningful over time.",
      "Consistency like this helps you understand yourself better. Well done.",
    ],
  },
  re_engage: {
    messages: [
      "We haven't heard from you in a couple of days. Hope you're doing okay.",
      "It's been a little while. Want to check in and see how today feels?",
      "Welcome back. No pressure — just checking in when you're ready.",
      "A few days have passed. Sometimes that happens. Let's pick up gently.",
    ],
    suggestions: [
      "A quick check-in is all it takes to get back on track",
      "Even a one-word check-in counts",
    ],
  },
};

// ── Helpers ───────────────────────────────────────────────────

function getTodayKey(): string {
  return format(new Date(), "yyyy-MM-dd");
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getStoredCheckIn(): CheckInData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as CheckInData;
    if (data.timestamp !== getTodayKey()) return null;
    return data;
  } catch {
    return null;
  }
}

function getHistory(): CheckInHistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as CheckInHistoryEntry[];
  } catch {
    return [];
  }
}

function saveToHistory(date: string, mood: CheckInMood) {
  const history = getHistory();
  // Replace if same day exists, otherwise prepend
  const filtered = history.filter((h) => h.date !== date);
  const entry: CheckInHistoryEntry = {
    date,
    mood,
    completedAt: new Date().toISOString(),
  };
  const updated = [entry, ...filtered]
    // Keep last 14 days max
    .slice(0, 14);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  return updated;
}

// ── Pattern detection ─────────────────────────────────────────

const LOW_MOODS: CheckInMood[] = ["struggling", "exhausted"];
const MOOD_SCORE: Record<CheckInMood, number> = { exhausted: 1, struggling: 2, okay: 3, good: 4 };

function detectPattern(history: CheckInHistoryEntry[]): PatternInsight | null {
  const today = new Date();
  const todayStr = getTodayKey();

  // Get last 7 days of entries (not including today, which may not exist yet)
  const recent = history
    .filter((h) => {
      const diff = differenceInCalendarDays(today, new Date(h.date));
      return diff >= 0 && diff <= 7;
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  if (recent.length === 0) {
    // Check re-engagement: any history at all but nothing in last 2 days?
    if (history.length > 0) {
      const lastDate = new Date(history[0].date);
      const gap = differenceInCalendarDays(today, lastDate);
      if (gap >= 2) {
        return buildInsight("re_engage");
      }
    }
    return null;
  }

  // Re-engagement: last check-in was 2+ days ago
  const lastCheckIn = new Date(recent[0].date);
  const daysSinceLast = differenceInCalendarDays(today, lastCheckIn);
  if (daysSinceLast >= 2) {
    return buildInsight("re_engage");
  }

  // Consecutive exhausted (2+)
  const consecutive = getConsecutiveMoods(recent);
  if (consecutive.mood === "exhausted" && consecutive.count >= 2) {
    return buildInsight("consecutive_exhausted");
  }

  // Consecutive struggling (2+)
  if (consecutive.mood === "struggling" && consecutive.count >= 2) {
    return buildInsight("consecutive_struggling");
  }

  // Low energy week: 3+ low-mood days in past 7
  const lowCount = recent.filter((h) => LOW_MOODS.includes(h.mood)).length;
  if (lowCount >= 3) {
    return buildInsight("low_energy_week");
  }

  // Improving trend: previous 2 days were low, today/latest is okay or good
  if (recent.length >= 3) {
    const [latest, prev1, prev2] = recent;
    if (
      MOOD_SCORE[latest.mood] >= 3 &&
      MOOD_SCORE[prev1.mood] <= 2 &&
      MOOD_SCORE[prev2.mood] <= 2
    ) {
      return buildInsight("improving");
    }
  }

  // Consistent check-ins: 5+ days in last 7
  if (recent.length >= 5) {
    return buildInsight("consistent_checkins");
  }

  return null;
}

function getConsecutiveMoods(sorted: CheckInHistoryEntry[]): { mood: CheckInMood; count: number } {
  if (sorted.length === 0) return { mood: "okay", count: 0 };
  const firstMood = sorted[0].mood;
  let count = 0;
  for (const entry of sorted) {
    if (entry.mood === firstMood) count++;
    else break;
  }
  return { mood: firstMood, count };
}

function buildInsight(type: NonNullable<PatternType>): PatternInsight {
  const config = PATTERN_MESSAGES[type];
  return {
    type,
    message: pickRandom(config.messages),
    suggestion: config.suggestions ? pickRandom(config.suggestions) : undefined,
  };
}

// ── Hook ──────────────────────────────────────────────────────

export function useDailyCheckIn() {
  const [checkIn, setCheckIn] = useState<CheckInData | null>(getStoredCheckIn);
  const [showModal, setShowModal] = useState(false);
  const [history, setHistory] = useState<CheckInHistoryEntry[]>(getHistory);

  useEffect(() => {
    if (!checkIn) {
      const modalShownKey = `checkin_modal_shown_${getTodayKey()}`;
      if (!sessionStorage.getItem(modalShownKey)) {
        const t = setTimeout(() => setShowModal(true), 800);
        sessionStorage.setItem(modalShownKey, "1");
        return () => clearTimeout(t);
      }
    }
  }, [checkIn]);

  const patternInsight = useMemo(() => detectPattern(history), [history]);

  const submitCheckIn = useCallback((mood: CheckInMood): CheckInData => {
    const aiResponse = pickRandom(AI_RESPONSES[mood]);
    const suggestion = pickRandom(CARD_SUGGESTIONS[mood]);
    const todayKey = getTodayKey();
    const data: CheckInData = { mood, aiResponse, suggestion, timestamp: todayKey };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    setCheckIn(data);
    const updatedHistory = saveToHistory(todayKey, mood);
    setHistory(updatedHistory);
    return data;
  }, []);

  const resetCheckIn = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setCheckIn(null);
  }, []);

  const dismissModal = useCallback(() => setShowModal(false), []);

  return { checkIn, showModal, submitCheckIn, resetCheckIn, dismissModal, patternInsight, history };
}
