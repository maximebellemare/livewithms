import type { Database as GeneratedDatabase, Json } from "../../src/integrations/supabase/types";

type DailyCheckInsTable = {
  Row: {
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
  Insert: {
    id?: string;
    user_id: string;
    checkin_date: string;
    mood?: number | null;
    energy?: number | null;
    pain?: number | null;
    fatigue?: number | null;
    mobility?: number | null;
    notes?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    user_id?: string;
    checkin_date?: string;
    mood?: number | null;
    energy?: number | null;
    pain?: number | null;
    fatigue?: number | null;
    mobility?: number | null;
    notes?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  Relationships: [];
};

export type Database = Omit<GeneratedDatabase, "public"> & {
  public: Omit<GeneratedDatabase["public"], "Tables"> & {
    Tables: GeneratedDatabase["public"]["Tables"] & {
      daily_checkins: DailyCheckInsTable;
    };
  };
};

export type { Json };
