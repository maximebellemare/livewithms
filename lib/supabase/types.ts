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

type AppointmentsTable = {
  Row: {
    id: string;
    user_id: string;
    title: string;
    appointment_date: string;
    appointment_time: string | null;
    provider: string | null;
    location: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
    date?: string;
    time?: string | null;
    type?: string;
  };
  Insert: {
    id?: string;
    user_id: string;
    title: string;
    appointment_date: string;
    appointment_time?: string | null;
    provider?: string | null;
    location?: string | null;
    notes?: string | null;
    created_at?: string;
    updated_at?: string;
    date?: string;
    time?: string | null;
    type?: string;
  };
  Update: {
    id?: string;
    user_id?: string;
    title?: string;
    appointment_date?: string;
    appointment_time?: string | null;
    provider?: string | null;
    location?: string | null;
    notes?: string | null;
    created_at?: string;
    updated_at?: string;
    date?: string;
    time?: string | null;
    type?: string;
  };
  Relationships: [];
};

type MedicationsTable = {
  Row: {
    id: string;
    user_id: string;
    name: string;
    dosage: string | null;
    schedule_type: string;
    notes: string | null;
    active: boolean;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    user_id: string;
    name: string;
    dosage?: string | null;
    schedule_type?: string;
    notes?: string | null;
    active?: boolean;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    user_id?: string;
    name?: string;
    dosage?: string | null;
    schedule_type?: string;
    notes?: string | null;
    active?: boolean;
    created_at?: string;
    updated_at?: string;
  };
  Relationships: [];
};

type CareNotesTable = {
  Row: {
    id: string;
    user_id: string;
    title: string | null;
    body: string;
    category: string | null;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    user_id: string;
    title?: string | null;
    body: string;
    category?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    user_id?: string;
    title?: string | null;
    body?: string;
    category?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  Relationships: [];
};

type CoachPlansTable = {
  Row: {
    id: string;
    user_id: string;
    date: string;
    priority: string | null;
    avoid: string | null;
    support_action: string | null;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    user_id: string;
    date: string;
    priority?: string | null;
    avoid?: string | null;
    support_action?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    user_id?: string;
    date?: string;
    priority?: string | null;
    avoid?: string | null;
    support_action?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  Relationships: [];
};

type CoachMessagesTable = {
  Row: {
    id: string;
    user_id: string;
    role: string;
    content: string;
    created_at: string;
  };
  Insert: {
    id?: string;
    user_id: string;
    role: string;
    content: string;
    created_at?: string;
  };
  Update: {
    id?: string;
    user_id?: string;
    role?: string;
    content?: string;
    created_at?: string;
  };
  Relationships: [];
};

export type Database = Omit<GeneratedDatabase, "public"> & {
  public: Omit<GeneratedDatabase["public"], "Tables"> & {
    Tables: GeneratedDatabase["public"]["Tables"] & {
      daily_checkins: DailyCheckInsTable;
      appointments: AppointmentsTable;
      medications: MedicationsTable;
      care_notes: CareNotesTable;
      coach_plans: CoachPlansTable;
      coach_messages: CoachMessagesTable;
    };
  };
};

export type { Json };
