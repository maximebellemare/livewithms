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
          checklist: Json
          created_at: string
          date: string
          id: string
          location: string | null
          notes: string | null
          recurrence: string
          recurrence_parent_id: string | null
          reminder: string
          reminder_day_sent: boolean
          reminder_hour_sent: boolean
          time: string | null
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          checklist?: Json
          created_at?: string
          date: string
          id?: string
          location?: string | null
          notes?: string | null
          recurrence?: string
          recurrence_parent_id?: string | null
          reminder?: string
          reminder_day_sent?: boolean
          reminder_hour_sent?: boolean
          time?: string | null
          title: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          checklist?: Json
          created_at?: string
          date?: string
          id?: string
          location?: string | null
          notes?: string | null
          recurrence?: string
          recurrence_parent_id?: string | null
          reminder?: string
          reminder_day_sent?: boolean
          reminder_hour_sent?: boolean
          time?: string | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_recurrence_parent_id_fkey"
            columns: ["recurrence_parent_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      badge_events: {
        Row: {
          badge_id: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      coach_daily_usage: {
        Row: {
          created_at: string
          date: string
          id: string
          message_count: number
          user_id: string
        }
        Insert: {
          created_at?: string
          date?: string
          id?: string
          message_count?: number
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          message_count?: number
          user_id?: string
        }
        Relationships: []
      }
      coach_memory: {
        Row: {
          created_at: string
          id: string
          traits: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          traits?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          traits?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      coach_message_reactions: {
        Row: {
          created_at: string
          id: string
          message_index: number
          reaction: string
          session_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message_index: number
          reaction: string
          session_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message_index?: number
          reaction?: string
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_message_reactions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "coach_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          session_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role?: string
          session_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "coach_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_sessions: {
        Row: {
          created_at: string
          id: string
          is_pinned: boolean
          mode: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_pinned?: boolean
          mode?: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_pinned?: boolean
          mode?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      cognitive_sessions: {
        Row: {
          created_at: string
          details: Json | null
          duration_seconds: number
          game_type: string
          id: string
          played_at: string
          score: number
          user_id: string
        }
        Insert: {
          created_at?: string
          details?: Json | null
          duration_seconds?: number
          game_type: string
          id?: string
          played_at?: string
          score?: number
          user_id: string
        }
        Update: {
          created_at?: string
          details?: Json | null
          duration_seconds?: number
          game_type?: string
          id?: string
          played_at?: string
          score?: number
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
      conversations: {
        Row: {
          created_at: string
          id: string
          last_message_at: string
          participant_1: string
          participant_2: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string
          participant_1: string
          participant_2: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string
          participant_1?: string
          participant_2?: string
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
      diet_goal_logs: {
        Row: {
          completed: boolean
          created_at: string
          date: string
          goal_id: string
          id: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          date: string
          goal_id: string
          id?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          date?: string
          goal_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "diet_goal_logs_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "diet_goals"
            referencedColumns: ["id"]
          },
        ]
      }
      diet_goals: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          target: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          target?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          target?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      diet_plans: {
        Row: {
          created_at: string
          daily_goals: Json
          description: string
          emoji: string
          food_lists: Json
          id: string
          name: string
          recipes: Json
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          daily_goals?: Json
          description?: string
          emoji?: string
          food_lists?: Json
          id?: string
          name: string
          recipes?: Json
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          daily_goals?: Json
          description?: string
          emoji?: string
          food_lists?: Json
          id?: string
          name?: string
          recipes?: Json
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      energy_activities: {
        Row: {
          budget_id: string
          completed: boolean
          created_at: string
          id: string
          name: string
          sort_order: number
          spoon_cost: number
          user_id: string
        }
        Insert: {
          budget_id: string
          completed?: boolean
          created_at?: string
          id?: string
          name: string
          sort_order?: number
          spoon_cost?: number
          user_id: string
        }
        Update: {
          budget_id?: string
          completed?: boolean
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
          spoon_cost?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "energy_activities_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "energy_budgets"
            referencedColumns: ["id"]
          },
        ]
      }
      energy_budgets: {
        Row: {
          created_at: string
          date: string
          id: string
          total_spoons: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          total_spoons?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          total_spoons?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      energy_forecast_cache: {
        Row: {
          created_at: string
          forecast_data: Json
          forecast_date: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          forecast_data?: Json
          forecast_date?: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          forecast_data?: Json
          forecast_date?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      exercise_logs: {
        Row: {
          created_at: string
          date: string
          duration_minutes: number
          id: string
          intensity: string
          notes: string | null
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          duration_minutes?: number
          id?: string
          intensity?: string
          notes?: string | null
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          duration_minutes?: number
          id?: string
          intensity?: string
          notes?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      fatigue_pattern_cache: {
        Row: {
          created_at: string
          id: string
          pattern_data: Json
          user_id: string
          week_start: string
        }
        Insert: {
          created_at?: string
          id?: string
          pattern_data?: Json
          user_id: string
          week_start?: string
        }
        Update: {
          created_at?: string
          id?: string
          pattern_data?: Json
          user_id?: string
          week_start?: string
        }
        Relationships: []
      }
      feedback_comments: {
        Row: {
          body: string
          created_at: string
          display_name: string
          id: string
          is_anonymous: boolean
          post_id: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          display_name?: string
          id?: string
          is_anonymous?: boolean
          post_id: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          display_name?: string
          id?: string
          is_anonymous?: boolean
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "feedback_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback_posts: {
        Row: {
          body: string
          category: Database["public"]["Enums"]["feedback_category"]
          comments_count: number
          created_at: string
          display_name: string
          id: string
          is_anonymous: boolean
          status: Database["public"]["Enums"]["feedback_status"]
          title: string
          updated_at: string
          upvotes_count: number
          user_id: string
        }
        Insert: {
          body: string
          category?: Database["public"]["Enums"]["feedback_category"]
          comments_count?: number
          created_at?: string
          display_name?: string
          id?: string
          is_anonymous?: boolean
          status?: Database["public"]["Enums"]["feedback_status"]
          title: string
          updated_at?: string
          upvotes_count?: number
          user_id: string
        }
        Update: {
          body?: string
          category?: Database["public"]["Enums"]["feedback_category"]
          comments_count?: number
          created_at?: string
          display_name?: string
          id?: string
          is_anonymous?: boolean
          status?: Database["public"]["Enums"]["feedback_status"]
          title?: string
          updated_at?: string
          upvotes_count?: number
          user_id?: string
        }
        Relationships: []
      }
      feedback_upvotes: {
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
            foreignKeyName: "feedback_upvotes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "feedback_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      fitness_plans: {
        Row: {
          abilities: string[]
          created_at: string
          equipment: string[]
          fitness_level: string
          goals: string[]
          has_gym: boolean
          id: string
          is_active: boolean
          limitations: string | null
          plan_data: Json
          preferred_time_of_day: string | null
          session_duration: string | null
          title: string
          updated_at: string
          user_id: string
          weekly_frequency: string | null
        }
        Insert: {
          abilities?: string[]
          created_at?: string
          equipment?: string[]
          fitness_level?: string
          goals?: string[]
          has_gym?: boolean
          id?: string
          is_active?: boolean
          limitations?: string | null
          plan_data?: Json
          preferred_time_of_day?: string | null
          session_duration?: string | null
          title?: string
          updated_at?: string
          user_id: string
          weekly_frequency?: string | null
        }
        Update: {
          abilities?: string[]
          created_at?: string
          equipment?: string[]
          fitness_level?: string
          goals?: string[]
          has_gym?: boolean
          id?: string
          is_active?: boolean
          limitations?: string | null
          plan_data?: Json
          preferred_time_of_day?: string | null
          session_duration?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          weekly_frequency?: string | null
        }
        Relationships: []
      }
      fitness_workout_logs: {
        Row: {
          completed_at: string
          day_name: string
          id: string
          notes: string | null
          plan_id: string
          rating: number | null
          user_id: string
        }
        Insert: {
          completed_at?: string
          day_name: string
          id?: string
          notes?: string | null
          plan_id: string
          rating?: number | null
          user_id: string
        }
        Update: {
          completed_at?: string
          day_name?: string
          id?: string
          notes?: string | null
          plan_id?: string
          rating?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fitness_workout_logs_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "fitness_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      grounding_sessions: {
        Row: {
          completed_at: string
          created_at: string
          id: string
          reflections: Json
          user_id: string
        }
        Insert: {
          completed_at?: string
          created_at?: string
          id?: string
          reflections?: Json
          user_id: string
        }
        Update: {
          completed_at?: string
          created_at?: string
          id?: string
          reflections?: Json
          user_id?: string
        }
        Relationships: []
      }
      inflammatory_scans: {
        Row: {
          created_at: string
          flags: Json
          id: string
          meal_name: string
          overall_label: string
          overall_score: string
          positives: Json
          scanned_at: string
          summary: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          flags?: Json
          id?: string
          meal_name: string
          overall_label?: string
          overall_score?: string
          positives?: Json
          scanned_at?: string
          summary?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          flags?: Json
          id?: string
          meal_name?: string
          overall_label?: string
          overall_score?: string
          positives?: Json
          scanned_at?: string
          summary?: string | null
          user_id?: string
        }
        Relationships: []
      }
      learn_articles: {
        Row: {
          body: string
          category: string
          created_at: string
          id: string
          published: boolean
          read_time: string
          sort_order: number
          summary: string
          title: string
          updated_at: string
        }
        Insert: {
          body?: string
          category: string
          created_at?: string
          id?: string
          published?: boolean
          read_time?: string
          sort_order?: number
          summary: string
          title: string
          updated_at?: string
        }
        Update: {
          body?: string
          category?: string
          created_at?: string
          id?: string
          published?: boolean
          read_time?: string
          sort_order?: number
          summary?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      learn_bookmarks: {
        Row: {
          article_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          article_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          article_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learn_bookmarks_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "learn_articles"
            referencedColumns: ["id"]
          },
        ]
      }
      learn_progress: {
        Row: {
          article_id: string
          id: string
          progress: number
          updated_at: string
          user_id: string
        }
        Insert: {
          article_id: string
          id?: string
          progress?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          article_id?: string
          id?: string
          progress?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learn_progress_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "learn_articles"
            referencedColumns: ["id"]
          },
        ]
      }
      learn_reads: {
        Row: {
          article_id: string
          id: string
          read_at: string
          user_id: string
        }
        Insert: {
          article_id: string
          id?: string
          read_at?: string
          user_id: string
        }
        Update: {
          article_id?: string
          id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learn_reads_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "learn_articles"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_logs: {
        Row: {
          created_at: string
          date: string
          id: string
          meal_type: string
          name: string
          notes: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          date?: string
          id?: string
          meal_type?: string
          name: string
          notes?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          meal_type?: string
          name?: string
          notes?: string | null
          user_id?: string
        }
        Relationships: []
      }
      meal_ratings: {
        Row: {
          created_at: string
          diet_plan: string | null
          id: string
          meal_name: string
          rating: string
          user_id: string
        }
        Insert: {
          created_at?: string
          diet_plan?: string | null
          id?: string
          meal_name: string
          rating: string
          user_id: string
        }
        Update: {
          created_at?: string
          diet_plan?: string | null
          id?: string
          meal_name?: string
          rating?: string
          user_id?: string
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
      medication_side_effects: {
        Row: {
          created_at: string
          date: string
          effect: string
          id: string
          medication_id: string
          notes: string | null
          severity: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date?: string
          effect: string
          id?: string
          medication_id: string
          notes?: string | null
          severity?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          effect?: string
          id?: string
          medication_id?: string
          notes?: string | null
          severity?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "medication_side_effects_medication_id_fkey"
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
          end_date: string | null
          id: string
          infusion_interval_months: number | null
          name: string
          pills_per_dose: number | null
          refill_date: string | null
          reminder_time: string | null
          schedule_type: string
          start_date: string | null
          supply_count: number | null
          supply_unit: string | null
          times_per_day: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          color?: string | null
          created_at?: string
          dosage?: string | null
          end_date?: string | null
          id?: string
          infusion_interval_months?: number | null
          name: string
          pills_per_dose?: number | null
          refill_date?: string | null
          reminder_time?: string | null
          schedule_type?: string
          start_date?: string | null
          supply_count?: number | null
          supply_unit?: string | null
          times_per_day?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          color?: string | null
          created_at?: string
          dosage?: string | null
          end_date?: string | null
          id?: string
          infusion_interval_months?: number | null
          name?: string
          pills_per_dose?: number | null
          refill_date?: string | null
          reminder_time?: string | null
          schedule_type?: string
          start_date?: string | null
          supply_count?: number | null
          supply_unit?: string | null
          times_per_day?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          body: string
          conversation_id: string
          created_at: string
          id: string
          is_read: boolean
          sender_id: string
        }
        Insert: {
          body: string
          conversation_id: string
          created_at?: string
          id?: string
          is_read?: boolean
          sender_id: string
        }
        Update: {
          body?: string
          conversation_id?: string
          created_at?: string
          id?: string
          is_read?: boolean
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
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
      premium_programs: {
        Row: {
          completed_at: string | null
          created_at: string
          day_number: number
          id: string
          last_activity_at: string
          program_id: string
          started_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          day_number?: number
          id?: string
          last_activity_at?: string
          program_id: string
          started_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          day_number?: number
          id?: string
          last_activity_at?: string
          program_id?: string
          started_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age_range: string | null
          ai_memory_enabled: boolean
          allow_dms: boolean
          avatar_url: string | null
          city: string | null
          cog_streak_freeze_enabled: boolean
          country: string | null
          created_at: string
          diagnosis_date: string | null
          display_name: string | null
          excluded_ingredients: string[]
          goal_weight: number | null
          goal_weight_unit: string
          goals: string[] | null
          grounding_weekly_goal: number
          height_cm: number | null
          hydration_goal: number
          hydration_reminder_hour: number
          id: string
          is_premium: boolean
          last_digest_sent_at: string | null
          last_report_sent_at: string | null
          medications: string[] | null
          monthly_reports_reset_at: string | null
          monthly_reports_used: number
          ms_type: string | null
          neurologist_email: string | null
          neurologist_name: string | null
          neurologist_phone: string | null
          notify_post_bookmarks: boolean
          notify_post_comments: boolean
          notify_post_likes: boolean
          notify_push_enabled: boolean
          notify_thread_replies: boolean
          onboarding_completed: boolean
          pinned_metrics: string[]
          premium_started_at: string | null
          premium_until: string | null
          sleep_goal: number
          streak_freeze_enabled: boolean
          symptoms: string[] | null
          updated_at: string
          user_id: string
          weekly_digest_enabled: boolean
          weekly_exercise_goal_minutes: number
          weekly_log_goal: number
          year_diagnosed: string | null
        }
        Insert: {
          age_range?: string | null
          ai_memory_enabled?: boolean
          allow_dms?: boolean
          avatar_url?: string | null
          city?: string | null
          cog_streak_freeze_enabled?: boolean
          country?: string | null
          created_at?: string
          diagnosis_date?: string | null
          display_name?: string | null
          excluded_ingredients?: string[]
          goal_weight?: number | null
          goal_weight_unit?: string
          goals?: string[] | null
          grounding_weekly_goal?: number
          height_cm?: number | null
          hydration_goal?: number
          hydration_reminder_hour?: number
          id?: string
          is_premium?: boolean
          last_digest_sent_at?: string | null
          last_report_sent_at?: string | null
          medications?: string[] | null
          monthly_reports_reset_at?: string | null
          monthly_reports_used?: number
          ms_type?: string | null
          neurologist_email?: string | null
          neurologist_name?: string | null
          neurologist_phone?: string | null
          notify_post_bookmarks?: boolean
          notify_post_comments?: boolean
          notify_post_likes?: boolean
          notify_push_enabled?: boolean
          notify_thread_replies?: boolean
          onboarding_completed?: boolean
          pinned_metrics?: string[]
          premium_started_at?: string | null
          premium_until?: string | null
          sleep_goal?: number
          streak_freeze_enabled?: boolean
          symptoms?: string[] | null
          updated_at?: string
          user_id: string
          weekly_digest_enabled?: boolean
          weekly_exercise_goal_minutes?: number
          weekly_log_goal?: number
          year_diagnosed?: string | null
        }
        Update: {
          age_range?: string | null
          ai_memory_enabled?: boolean
          allow_dms?: boolean
          avatar_url?: string | null
          city?: string | null
          cog_streak_freeze_enabled?: boolean
          country?: string | null
          created_at?: string
          diagnosis_date?: string | null
          display_name?: string | null
          excluded_ingredients?: string[]
          goal_weight?: number | null
          goal_weight_unit?: string
          goals?: string[] | null
          grounding_weekly_goal?: number
          height_cm?: number | null
          hydration_goal?: number
          hydration_reminder_hour?: number
          id?: string
          is_premium?: boolean
          last_digest_sent_at?: string | null
          last_report_sent_at?: string | null
          medications?: string[] | null
          monthly_reports_reset_at?: string | null
          monthly_reports_used?: number
          ms_type?: string | null
          neurologist_email?: string | null
          neurologist_name?: string | null
          neurologist_phone?: string | null
          notify_post_bookmarks?: boolean
          notify_post_comments?: boolean
          notify_post_likes?: boolean
          notify_push_enabled?: boolean
          notify_thread_replies?: boolean
          onboarding_completed?: boolean
          pinned_metrics?: string[]
          premium_started_at?: string | null
          premium_until?: string | null
          sleep_goal?: number
          streak_freeze_enabled?: boolean
          symptoms?: string[] | null
          updated_at?: string
          user_id?: string
          weekly_digest_enabled?: boolean
          weekly_exercise_goal_minutes?: number
          weekly_log_goal?: number
          year_diagnosed?: string | null
        }
        Relationships: []
      }
      program_day_logs: {
        Row: {
          completed_at: string
          day_number: number
          id: string
          notes: string | null
          program_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          day_number: number
          id?: string
          notes?: string | null
          program_id: string
          user_id: string
        }
        Update: {
          completed_at?: string
          day_number?: number
          id?: string
          notes?: string | null
          program_id?: string
          user_id?: string
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
      relapses: {
        Row: {
          created_at: string
          end_date: string | null
          id: string
          is_recovered: boolean
          notes: string | null
          severity: string
          start_date: string
          symptoms: string[]
          treatment: string | null
          triggers: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          end_date?: string | null
          id?: string
          is_recovered?: boolean
          notes?: string | null
          severity?: string
          start_date: string
          symptoms?: string[]
          treatment?: string | null
          triggers?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          end_date?: string | null
          id?: string
          is_recovered?: boolean
          notes?: string | null
          severity?: string
          start_date?: string
          symptoms?: string[]
          treatment?: string | null
          triggers?: string[] | null
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
      risk_scores: {
        Row: {
          created_at: string
          factors: string[]
          id: string
          level: string
          score: number
          user_id: string
          week_end: string
          week_start: string
        }
        Insert: {
          created_at?: string
          factors?: string[]
          id?: string
          level: string
          score: number
          user_id: string
          week_end: string
          week_start: string
        }
        Update: {
          created_at?: string
          factors?: string[]
          id?: string
          level?: string
          score?: number
          user_id?: string
          week_end?: string
          week_start?: string
        }
        Relationships: []
      }
      smart_match_profiles: {
        Row: {
          bio: string | null
          created_at: string
          id: string
          looking_for: string | null
          opt_in: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          bio?: string | null
          created_at?: string
          id?: string
          looking_for?: string | null
          opt_in?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          bio?: string | null
          created_at?: string
          id?: string
          looking_for?: string | null
          opt_in?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      supplement_logs: {
        Row: {
          created_at: string
          date: string
          id: string
          name: string
          taken: boolean
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          name: string
          taken?: boolean
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          name?: string
          taken?: boolean
          user_id?: string
        }
        Relationships: []
      }
      user_blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
          id: string
          reason: string | null
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
          id?: string
          reason?: string | null
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
          id?: string
          reason?: string | null
        }
        Relationships: []
      }
      user_diet_plans: {
        Row: {
          active: boolean
          created_at: string
          id: string
          plan_id: string
          swapped_recipes: Json
          updated_at: string
          user_id: string
          weekly_selections: Json
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          plan_id: string
          swapped_recipes?: Json
          updated_at?: string
          user_id: string
          weekly_selections?: Json
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          plan_id?: string
          swapped_recipes?: Json
          updated_at?: string
          user_id?: string
          weekly_selections?: Json
        }
        Relationships: [
          {
            foreignKeyName: "user_diet_plans_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "diet_plans"
            referencedColumns: ["id"]
          },
        ]
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
      weight_logs: {
        Row: {
          created_at: string
          date: string
          id: string
          unit: string
          user_id: string
          weight: number
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          unit?: string
          user_id: string
          weight: number
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          unit?: string
          user_id?: string
          weight?: number
        }
        Relationships: []
      }
    }
    Views: {
      profiles_public: {
        Row: {
          avatar_url: string | null
          display_name: string | null
          is_premium: boolean | null
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          display_name?: string | null
          is_premium?: boolean | null
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          display_name?: string | null
          is_premium?: boolean | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_badge_leaderboard: {
        Args: { result_limit?: number }
        Returns: {
          avatar_url: string
          badge_count: number
          display_name: string
          latest_badge_at: string
          previous_rank: number
          user_id: string
        }[]
      }
      get_coach_feedback_stats: {
        Args: never
        Returns: {
          session_created_at: string
          session_id: string
          session_mode: string
          session_title: string
          thumbs_down: number
          thumbs_up: number
          user_display_name: string
        }[]
      }
      get_smart_matches: {
        Args: { requesting_user_id: string; result_limit?: number }
        Returns: {
          age_range: string
          avatar_url: string
          bio: string
          display_name: string
          looking_for: string
          ms_type: string
          opt_in: boolean
          user_id: string
        }[]
      }
      get_user_join_date: { Args: { target_user_id: string }; Returns: string }
      get_user_public_badges: {
        Args: { target_user_id: string }
        Returns: {
          badge_id: string
          earned_at: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      user_allows_dms: { Args: { target_user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      feedback_category: "feature" | "ui" | "bug" | "integration" | "other"
      feedback_status: "new" | "planned" | "in_progress" | "done" | "declined"
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
      feedback_category: ["feature", "ui", "bug", "integration", "other"],
      feedback_status: ["new", "planned", "in_progress", "done", "declined"],
    },
  },
} as const
