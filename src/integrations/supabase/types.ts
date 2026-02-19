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
      community_bookmarks: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_bookmarks_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      community_channels: {
        Row: {
          category: string
          created_at: string
          description: string | null
          emoji: string
          id: string
          is_locked: boolean
          name: string
          sort_order: number
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          emoji?: string
          id?: string
          is_locked?: boolean
          name: string
          sort_order?: number
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          emoji?: string
          id?: string
          is_locked?: boolean
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      community_comments: {
        Row: {
          body: string
          created_at: string
          display_name: string
          id: string
          is_hidden: boolean
          post_id: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          display_name?: string
          id?: string
          is_hidden?: boolean
          post_id: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          display_name?: string
          id?: string
          is_hidden?: boolean
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      community_likes: {
        Row: {
          comment_id: string | null
          created_at: string
          id: string
          post_id: string | null
          reaction_type: string
          user_id: string
        }
        Insert: {
          comment_id?: string | null
          created_at?: string
          id?: string
          post_id?: string | null
          reaction_type?: string
          user_id: string
        }
        Update: {
          comment_id?: string | null
          created_at?: string
          id?: string
          post_id?: string | null
          reaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "community_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      community_posts: {
        Row: {
          body: string
          channel_id: string
          comments_count: number
          created_at: string
          display_name: string
          id: string
          is_hidden: boolean
          is_pinned: boolean
          likes_count: number
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          body: string
          channel_id: string
          comments_count?: number
          created_at?: string
          display_name?: string
          id?: string
          is_hidden?: boolean
          is_pinned?: boolean
          likes_count?: number
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string
          channel_id?: string
          comments_count?: number
          created_at?: string
          display_name?: string
          id?: string
          is_hidden?: boolean
          is_pinned?: boolean
          likes_count?: number
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_posts_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "community_channels"
            referencedColumns: ["id"]
          },
        ]
      }
      community_reports: {
        Row: {
          comment_id: string | null
          created_at: string
          id: string
          post_id: string | null
          reason: string
          reporter_id: string
          resolved_at: string | null
          resolved_by: string | null
          status: string
        }
        Insert: {
          comment_id?: string | null
          created_at?: string
          id?: string
          post_id?: string | null
          reason: string
          reporter_id: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
        }
        Update: {
          comment_id?: string | null
          created_at?: string
          id?: string
          post_id?: string | null
          reason?: string
          reporter_id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_reports_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "community_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_reports_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
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
      notifications: {
        Row: {
          actor_id: string | null
          actor_name: string | null
          body: string | null
          comment_id: string | null
          created_at: string
          id: string
          is_read: boolean
          post_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          actor_id?: string | null
          actor_name?: string | null
          body?: string | null
          comment_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          post_id?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          actor_id?: string | null
          actor_name?: string | null
          body?: string | null
          comment_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          post_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "community_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          age_range: string | null
          avatar_url: string | null
          created_at: string
          display_name: string | null
          goals: string[] | null
          hydration_goal: number
          id: string
          last_digest_sent_at: string | null
          last_report_sent_at: string | null
          medications: string[] | null
          ms_type: string | null
          neurologist_email: string | null
          neurologist_name: string | null
          notify_post_comments: boolean
          notify_post_likes: boolean
          notify_push_enabled: boolean
          notify_thread_replies: boolean
          symptoms: string[] | null
          updated_at: string
          user_id: string
          weekly_digest_enabled: boolean
          weekly_log_goal: number
          year_diagnosed: string | null
        }
        Insert: {
          age_range?: string | null
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          goals?: string[] | null
          hydration_goal?: number
          id?: string
          last_digest_sent_at?: string | null
          last_report_sent_at?: string | null
          medications?: string[] | null
          ms_type?: string | null
          neurologist_email?: string | null
          neurologist_name?: string | null
          notify_post_comments?: boolean
          notify_post_likes?: boolean
          notify_push_enabled?: boolean
          notify_thread_replies?: boolean
          symptoms?: string[] | null
          updated_at?: string
          user_id: string
          weekly_digest_enabled?: boolean
          weekly_log_goal?: number
          year_diagnosed?: string | null
        }
        Update: {
          age_range?: string | null
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          goals?: string[] | null
          hydration_goal?: number
          id?: string
          last_digest_sent_at?: string | null
          last_report_sent_at?: string | null
          medications?: string[] | null
          ms_type?: string | null
          neurologist_email?: string | null
          neurologist_name?: string | null
          notify_post_comments?: boolean
          notify_post_likes?: boolean
          notify_push_enabled?: boolean
          notify_thread_replies?: boolean
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
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      profiles_public: {
        Row: {
          avatar_url: string | null
          display_name: string | null
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          display_name?: string | null
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          display_name?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
