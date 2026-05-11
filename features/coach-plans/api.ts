import env from "../../lib/env";
import { supabase } from "../../lib/supabase/client";
import type { CoachPlan, CoachPlanInput } from "./types";

const SELECT_FIELDS =
  "id, user_id, date, priority, avoid, support_action, created_at, updated_at";

function normalizeDate(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    throw new Error("Missing date for coach plan.");
  }

  return trimmed.slice(0, 10);
}

export const coachPlansApi = {
  async getCoachPlanByDate(userId: string, date: string) {
    if (!userId) {
      throw new Error("Missing user id for coach plan query.");
    }

    if (!date) {
      throw new Error("Missing date for coach plan query.");
    }

    if (!env.isSupabaseConfigured) {
      return null as CoachPlan | null;
    }

    const { data, error } = await supabase
      .from("coach_plans")
      .select(SELECT_FIELDS)
      .eq("user_id", userId)
      .eq("date", normalizeDate(date))
      .maybeSingle();

    if (error) {
      throw error;
    }

    return (data ?? null) as CoachPlan | null;
  },

  async upsertCoachPlan(userId: string, date: string, input: CoachPlanInput) {
    if (!env.isSupabaseConfigured) {
      throw new Error("Supabase is not configured for coach plans.");
    }

    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError) {
      throw authError;
    }

    const currentUser = authData.user;

    if (!currentUser?.id) {
      throw new Error("Missing authenticated user for coach plan save.");
    }

    if (userId && currentUser.id !== userId) {
      throw new Error("Authenticated user does not match requested coach plan save.");
    }

    const payload = {
      user_id: currentUser.id,
      date: normalizeDate(date),
      priority: input.priority?.trim() || null,
      avoid: input.avoid?.trim() || null,
      support_action: input.support_action?.trim() || null,
    };

    const hasContent = payload.priority || payload.avoid || payload.support_action;

    if (!hasContent) {
      throw new Error("Add at least one plan detail before saving.");
    }

    const { data, error } = await supabase
      .from("coach_plans")
      .upsert(payload, { onConflict: "user_id,date" })
      .select(SELECT_FIELDS)
      .single();

    if (error) {
      throw error;
    }

    return data as CoachPlan;
  },
};
