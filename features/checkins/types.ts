export type DailyCheckIn = {
  id: string;
  user_id: string;
  date: string;
  fatigue: number | null;
  pain: number | null;
  brain_fog: number | null;
  mood: number | null;
  mobility: number | null;
  stress: number | null;
  sleep_hours: number | null;
  water_glasses: number | null;
  notes: string | null;
  mood_tags: string[];
  created_at: string;
  updated_at: string;
};

export type DailyCheckInInput = {
  fatigue: number | null;
  pain: number | null;
  brain_fog: number | null;
  mood: number | null;
  mobility: number | null;
  stress: number | null;
  sleep_hours: number | null;
  water_glasses: number | null;
  notes: string | null;
  mood_tags: string[];
};
