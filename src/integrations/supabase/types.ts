export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          created_at: string
          date: string
          id: string
          location: string | null
          notes: string | null
          time: string | null
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          location?: string | null
          notes?: string | null
          time?: string | null
          title: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          location?: string | null
          notes?: string | null
          time?: string | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_entries: {
        Row: {
          brain_fog: number | null
          created_at: string
          date: string
          fatigue: number | null
          id: string
          mobility: number | null
          mood: number | null
          mood_tags: string[] | null
          notes: string | null
          pain: number | null
          sleep_hours: number | null
          spasticity: number | null
          stress: number | null
          updated_at: string
          user_id: string
          water_glasses: number | null
        }
        Insert: {
          brain_fog?: number | null
          created_at?: string
          date: string
          fatigue?: number | null
          id?: string
          mobility?: number | null
          mood?: number | null
          mood_tags?: string[] | null
          notes?: string | null
          pain?: number | null
          sleep_hours?: number | null
          spasticity?: number | null
          stress?: number | null
          updated_at?: string
          user_id: string
          water_glasses?: number | null
        }
        Update: {
          brain_fog?: number | null
          created_at?: string
          date?: string
          fatigue?: number | null
          id?: string
          mobility?: number | null
          mood?: number | null
          mood_tags?: string[] | null
          notes?: string | null
          pain?: number | null
          sleep_hours?: number | null
          spasticity?: number | null
          stress?: number | null
          updated_at?: string
          user_id?: string
          water_glasses?: number | null
        }
        Relationships: []
      }
      medication_logs: {
        Row: {
          created_at: string
          date: string
          id: string
          medication_id: string
          status: string
          time: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          medication_id: string
          status?: string
          time?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          medication_id?: string
          status?: string
          time?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "medication_logs_medication_id_fkey"
            columns: ["medication_id"]
            isOneToOne: false
            referencedRelation: "medications"
            referencedColumns: ["id"]
          },
        ]
      }
      medications: {
        Row: {
          active: boolean
          color: string | null
          created_at: string
          dosage: string | null
          id: string
          infusion_interval_months: number | null
          name: string
          schedule_type: string
          times_per_day: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          color?: string | null
          created_at?: string
          dosage?: string | null
          id?: string
          infusion_interval_months?: number | null
          name: string
          schedule_type?: string
          times_per_day?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          color?: string | null
          created_at?: string
          dosage?: string | null
          id?: string
          infusion_interval_months?: number | null
          name?: string
          schedule_type?: string
          times_per_day?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age_range: string | null
          created_at: string
          goals: string[] | null
          hydration_goal: number
          id: string
          last_digest_sent_at: string | null
          last_report_sent_at: string | null
          medications: string[] | null
          ms_type: string | null
          neurologist_email: string | null
          neurologist_name: string | null
          symptoms: string[] | null
          updated_at: string
          user_id: string
          weekly_digest_enabled: boolean
          weekly_log_goal: number
          year_diagnosed: string | null
        }
        Insert: {
          age_range?: string | null
          created_at?: string
          goals?: string[] | null
          hydration_goal?: number
          id?: string
          last_digest_sent_at?: string | null
          last_report_sent_at?: string | null
          medications?: string[] | null
          ms_type?: string | null
          neurologist_email?: string | null
          neurologist_name?: string | null
          symptoms?: string[] | null
          updated_at?: string
          user_id: string
          weekly_digest_enabled?: boolean
          weekly_log_goal?: number
          year_diagnosed?: string | null
        }
        Update: {
          age_range?: string | null
          created_at?: string
          goals?: string[] | null
          hydration_goal?: number
          id?: string
          last_digest_sent_at?: string | null
          last_report_sent_at?: string | null
          medications?: string[] | null
          ms_type?: string | null
          neurologist_email?: string | null
          neurologist_name?: string | null
          symptoms?: string[] | null
          updated_at?: string
          user_id?: string
          weekly_digest_enabled?: boolean
          weekly_log_goal?: number
          year_diagnosed?: string | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          reminder_hour: number
          updated_at: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          reminder_hour?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          reminder_hour?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      report_history: {
        Row: {
          created_at: string
          end_date: string
          file_name: string | null
          id: string
          recipient_email: string
          recipient_name: string | null
          sent_at: string
          start_date: string
          user_id: string
        }
        Insert: {
          created_at?: string
          end_date: string
          file_name?: string | null
          id?: string
          recipient_email: string
          recipient_name?: string | null
          sent_at?: string
          start_date: string
          user_id: string
        }
        Update: {
          created_at?: string
          end_date?: string
          file_name?: string | null
          id?: string
          recipient_email?: string
          recipient_name?: string | null
          sent_at?: string
          start_date?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
