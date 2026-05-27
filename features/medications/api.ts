import env from "../../lib/env";
import { getCachedJson, setCachedJson } from "../../lib/local-cache";
import { normalizeError } from "../../lib/errors";
import { supabase } from "../../lib/supabase/client";
import type { Medication, MedicationInput } from "./types";

const BASE_SELECT_FIELDS = "id, user_id, name, dosage, schedule_type, notes, active, created_at, updated_at";
const SELECT_FIELDS = `${BASE_SELECT_FIELDS}, reminder_time`;

function isMissingReminderTimeError(error: unknown) {
  const maybeError = error as { code?: string; message?: string } | null;
  const message = maybeError?.message?.toLowerCase() ?? "";

  return maybeError?.code === "PGRST204" && message.includes("reminder_time");
}

function mapMedicationRow(row: {
  id: string;
  user_id: string;
  name: string;
  dosage: string | null;
  schedule_type: string;
  reminder_time?: string | null;
  notes: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}): Medication {
  return {
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    dosage: row.dosage,
    frequency: row.schedule_type,
    reminder_time: row.reminder_time ?? null,
    notes: row.notes,
    active: row.active,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function getMedicationsCacheKey(userId: string) {
  return `cache.medications.${userId}`;
}

function getMedicationTakenCacheKey(userId: string, date: string) {
  return `cache.today.medications-taken.${userId}.${date}`;
}

function getCurrentTimeValue() {
  return new Date().toLocaleTimeString("en-CA", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export const medicationsApi = {
  async listMedications(userId: string) {
    if (!userId) {
      throw new Error("Missing user id for medications query.");
    }

    if (!env.isSupabaseConfigured) {
      return [] as Medication[];
    }

    try {
      let response = await supabase
        .from("medications")
        .select(SELECT_FIELDS)
        .eq("user_id", userId)
        .order("active", { ascending: false })
        .order("created_at", { ascending: false });

      if (response.error && isMissingReminderTimeError(response.error)) {
        response = await supabase
          .from("medications")
          .select(BASE_SELECT_FIELDS)
          .eq("user_id", userId)
          .order("active", { ascending: false })
          .order("created_at", { ascending: false });
      }

      const { data, error } = response;

      if (error) {
        throw normalizeError(error);
      }

      const rows = (data ?? []).map((row) =>
        mapMedicationRow(
          row as {
            id: string;
            user_id: string;
            name: string;
            dosage: string | null;
            schedule_type: string;
            reminder_time?: string | null;
            notes: string | null;
            active: boolean;
            created_at: string;
            updated_at: string;
          },
        ),
      );
      await setCachedJson(getMedicationsCacheKey(userId), rows);
      return rows;
    } catch (error) {
      const cached = await getCachedJson<Medication[]>(getMedicationsCacheKey(userId));
      if (cached) {
        return cached;
      }
      throw error;
    }
  },

  async createMedication(userId: string, input: MedicationInput) {
    if (!env.isSupabaseConfigured) {
      throw new Error("Supabase is not configured for medications.");
    }

    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError) {
      throw normalizeError(authError);
    }

    const currentUser = authData.user;

    if (!currentUser?.id) {
      throw new Error("Missing authenticated user for medication save.");
    }

    if (userId && currentUser.id !== userId) {
      throw new Error("Authenticated user does not match requested medication save.");
    }

    const name = input.name.trim();
    const frequency = input.frequency.trim();

    if (!name) {
      throw new Error("Please enter a medication name.");
    }

    if (!frequency) {
      throw new Error("Please enter a medication frequency.");
    }

    const payload = {
      user_id: currentUser.id,
      name,
      dosage: input.dosage?.trim() || null,
      schedule_type: frequency,
      notes: input.notes?.trim() || null,
      active: input.active ?? true,
    };

    const { data, error } = await supabase
      .from("medications")
      .insert(payload)
      .select(BASE_SELECT_FIELDS)
      .single();

    if (error) {
      throw normalizeError(error);
    }

    return mapMedicationRow(
      data as {
        id: string;
        user_id: string;
        name: string;
        dosage: string | null;
        schedule_type: string;
        reminder_time?: string | null;
        notes: string | null;
        active: boolean;
        created_at: string;
        updated_at: string;
      },
    );
  },

  async updateMedication(userId: string, medicationId: string, input: MedicationInput) {
    if (!env.isSupabaseConfigured) {
      throw new Error("Supabase is not configured for medications.");
    }

    if (!medicationId) {
      throw new Error("Missing medication id for save.");
    }

    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError) {
      throw normalizeError(authError);
    }

    const currentUser = authData.user;

    if (!currentUser?.id) {
      throw new Error("Missing authenticated user for medication save.");
    }

    if (userId && currentUser.id !== userId) {
      throw new Error("Authenticated user does not match requested medication save.");
    }

    const name = input.name.trim();
    const frequency = input.frequency.trim();

    if (!name) {
      throw new Error("Please enter a medication name.");
    }

    if (!frequency) {
      throw new Error("Please enter a medication frequency.");
    }

    const payload = {
      name,
      dosage: input.dosage?.trim() || null,
      schedule_type: frequency,
      notes: input.notes?.trim() || null,
      active: input.active ?? true,
    };

    const { data, error } = await supabase
      .from("medications")
      .update(payload)
      .eq("id", medicationId)
      .eq("user_id", currentUser.id)
      .select(BASE_SELECT_FIELDS)
      .single();

    if (error) {
      throw normalizeError(error);
    }

    return mapMedicationRow(
      data as {
        id: string;
        user_id: string;
        name: string;
        dosage: string | null;
        schedule_type: string;
        reminder_time?: string | null;
        notes: string | null;
        active: boolean;
        created_at: string;
        updated_at: string;
      },
    );
  },

  async deleteMedication(userId: string, medicationId: string) {
    if (!env.isSupabaseConfigured) {
      throw new Error("Supabase is not configured for medications.");
    }

    if (!medicationId) {
      throw new Error("Missing medication id for delete.");
    }

    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError) {
      throw normalizeError(authError);
    }

    const currentUser = authData.user;

    if (!currentUser?.id) {
      throw new Error("Missing authenticated user for medication delete.");
    }

    if (userId && currentUser.id !== userId) {
      throw new Error("Authenticated user does not match requested medication delete.");
    }

    const { error } = await supabase
      .from("medications")
      .delete()
      .eq("id", medicationId)
      .eq("user_id", currentUser.id);

    if (error) {
      throw normalizeError(error);
    }
  },

  async listTakenToday(userId: string, date: string) {
    if (!userId) {
      throw new Error("Missing user id for medication taken query.");
    }

    if (!env.isSupabaseConfigured) {
      return (await getCachedJson<Record<string, string>>(getMedicationTakenCacheKey(userId, date))) ?? {};
    }

    try {
      const { data, error } = await supabase
        .from("medication_logs")
        .select("medication_id, created_at, time")
        .eq("user_id", userId)
        .eq("date", date)
        .eq("status", "taken");

      if (error) {
        throw normalizeError(error);
      }

      const taken = (data ?? []).reduce<Record<string, string>>((current, row) => {
        const medicationId = typeof row.medication_id === "string" ? row.medication_id : null;
        if (!medicationId) {
          return current;
        }

        return {
          ...current,
          [medicationId]: typeof row.created_at === "string" ? row.created_at : new Date().toISOString(),
        };
      }, {});

      await setCachedJson(getMedicationTakenCacheKey(userId, date), taken);
      return taken;
    } catch (error) {
      const cached = await getCachedJson<Record<string, string>>(getMedicationTakenCacheKey(userId, date));
      if (cached) {
        return cached;
      }
      throw error;
    }
  },

  async markTakenToday(userId: string, medicationId: string, date: string, takenAt: string) {
    if (!userId || !medicationId) {
      throw new Error("Missing medication taken details.");
    }

    const current = (await getCachedJson<Record<string, string>>(getMedicationTakenCacheKey(userId, date))) ?? {};
    await setCachedJson(getMedicationTakenCacheKey(userId, date), {
      ...current,
      [medicationId]: takenAt,
    });

    if (!env.isSupabaseConfigured) {
      return;
    }

    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError) {
      throw normalizeError(authError);
    }

    const currentUser = authData.user;
    if (!currentUser?.id || currentUser.id !== userId) {
      throw new Error("Authenticated user does not match requested medication log.");
    }

    const { error: deleteError } = await supabase
      .from("medication_logs")
      .delete()
      .eq("user_id", userId)
      .eq("medication_id", medicationId)
      .eq("date", date);

    if (deleteError) {
      throw normalizeError(deleteError);
    }

    const { error } = await supabase.from("medication_logs").insert({
      user_id: userId,
      medication_id: medicationId,
      date,
      status: "taken",
      time: getCurrentTimeValue(),
    });

    if (error) {
      throw normalizeError(error);
    }
  },

  async unmarkTakenToday(userId: string, medicationId: string, date: string) {
    if (!userId || !medicationId) {
      throw new Error("Missing medication taken details.");
    }

    const current = (await getCachedJson<Record<string, string>>(getMedicationTakenCacheKey(userId, date))) ?? {};
    const next = { ...current };
    delete next[medicationId];
    await setCachedJson(getMedicationTakenCacheKey(userId, date), next);

    if (!env.isSupabaseConfigured) {
      return;
    }

    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError) {
      throw normalizeError(authError);
    }

    const currentUser = authData.user;
    if (!currentUser?.id || currentUser.id !== userId) {
      throw new Error("Authenticated user does not match requested medication log.");
    }

    const { error } = await supabase
      .from("medication_logs")
      .delete()
      .eq("user_id", userId)
      .eq("medication_id", medicationId)
      .eq("date", date);

    if (error) {
      throw normalizeError(error);
    }
  },
};
