import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";

export type CheckInMood = "good" | "okay" | "struggling" | "exhausted";

interface CheckInData {
  mood: CheckInMood;
  aiResponse: string;
  timestamp: string;
}

const STORAGE_KEY = "daily_checkin";

const AI_RESPONSES: Record<CheckInMood, string[]> = {
  good: [
    "That's wonderful to hear! Enjoy this good energy — you deserve it. 💛",
    "What a great start. Let's make the most of today, at your pace.",
    "I'm glad you're feeling good. Soak it in — these days matter.",
  ],
  okay: [
    "Okay is perfectly valid. Some days just are — and that's enough.",
    "You're here, you're checking in. That takes strength, even on an 'okay' day.",
    "Middle-ground days can surprise you. Let's see what feels right today.",
  ],
  struggling: [
    "I hear you. Some days are heavier than others — you're still showing up, and that matters.",
    "Struggling doesn't mean failing. You're doing more than you think right now.",
    "It's okay to have hard days. Be gentle with yourself — I'm here if you need anything.",
  ],
  exhausted: [
    "Rest isn't giving up — it's how your body heals. Take what you need today. 🤍",
    "Exhaustion is real, and I see you. Let's keep today as simple as possible.",
    "Your body is telling you something important. Listening to it is an act of strength.",
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

export function useDailyCheckIn() {
  const [checkIn, setCheckIn] = useState<CheckInData | null>(getStoredCheckIn);
  const [showModal, setShowModal] = useState(false);

  // Show modal on first visit of the day (if not already checked in)
  useEffect(() => {
    if (!checkIn) {
      const modalShownKey = `checkin_modal_shown_${getTodayKey()}`;
      if (!sessionStorage.getItem(modalShownKey)) {
        // Small delay so the page renders first
        const t = setTimeout(() => setShowModal(true), 800);
        sessionStorage.setItem(modalShownKey, "1");
        return () => clearTimeout(t);
      }
    }
  }, [checkIn]);

  const submitCheckIn = useCallback((mood: CheckInMood) => {
    const responses = AI_RESPONSES[mood];
    const aiResponse = responses[Math.floor(Math.random() * responses.length)];
    const data: CheckInData = { mood, aiResponse, timestamp: getTodayKey() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    setCheckIn(data);
    return data;
  }, []);

  const dismissModal = useCallback(() => setShowModal(false), []);

  return { checkIn, showModal, submitCheckIn, dismissModal };
}
