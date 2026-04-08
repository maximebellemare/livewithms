import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";

export type CheckInMood = "good" | "okay" | "struggling" | "exhausted";

export interface CheckInData {
  mood: CheckInMood;
  aiResponse: string;
  suggestion: string;
  timestamp: string;
}

const STORAGE_KEY = "daily_checkin";

/**
 * 8+ responses per mood — warm, human, never clinical.
 * Each is 1–2 short sentences max.
 */
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

/** Short, gentle suggestion lines — shown on the Today card after check-in */
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

function getTodayKey(): string {
  return format(new Date(), "yyyy-MM-dd");
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

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function useDailyCheckIn() {
  const [checkIn, setCheckIn] = useState<CheckInData | null>(getStoredCheckIn);
  const [showModal, setShowModal] = useState(false);

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

  const submitCheckIn = useCallback((mood: CheckInMood): CheckInData => {
    const aiResponse = pickRandom(AI_RESPONSES[mood]);
    const suggestion = pickRandom(CARD_SUGGESTIONS[mood]);
    const data: CheckInData = { mood, aiResponse, suggestion, timestamp: getTodayKey() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    setCheckIn(data);
    return data;
  }, []);

  const resetCheckIn = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setCheckIn(null);
  }, []);

  const dismissModal = useCallback(() => setShowModal(false), []);

  return { checkIn, showModal, submitCheckIn, resetCheckIn, dismissModal };
}
