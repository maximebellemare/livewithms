export type DailyCheckIn = {
  id: string;
  user_id: string;
  checkin_date: string;
  mood: number | null;
  energy: number | null;
  pain: number | null;
  fatigue: number | null;
  mobility: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type DailyCheckInInput = {
  mood: number | null;
  energy: number | null;
  pain: number | null;
  fatigue: number | null;
  mobility: number | null;
  notes: string | null;
};
