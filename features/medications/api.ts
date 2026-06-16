import env from "../../lib/env";
import { getCachedJson, setCachedJson } from "../../lib/local-cache";
import { normalizeError } from "../../lib/errors";
import { supabase } from "../../lib/supabase/client";
import type { Medication, MedicationInput } from "./types";
import {
  buildMedicationScheduleSummary,
  buildMedicationTakenKey,
  normalizeMedicationDoseTimes,
  normalizeMedicationScheduleType,
  normalizeMedicationSelectedDays,
} from "./schedule";

const BASE_SELECT_FIELDS =
  "id, user_id, name, dosage, schedule_type, frequency, time_of_day, notes, active, is_active, created_at, updated_at";
const SELECT_FIELDS = `${BASE_SELECT_FIELDS}, dose_times, selected_days`;
const SAVE_SELECT_FIELDS = BASE_SELECT_FIELDS;

function isMissingScheduleColumnsError(error: unknown) {
  const maybeError = error as { code?: string; message?: string } | null;
  const message = maybeError?.message?.toLowerCase() ?? "";

  return (
    maybeError?.code === "PGRST204" &&
    (message.includes("dose_times") || message.includes("selected_days") || message.includes("scheduled_time"))
  );
}

function getRowScheduledTime(row: { scheduled_time?: string | null; time?: string | null }) {
  return typeof row.scheduled_time === "string"
    ? row.scheduled_time
    : typeof row.time === "string"
      ? row.time
      : null;
}

function mapMedicationRow(row: {
  id: string;
  user_id: string;
  name: string;
  dosage: string | null;
  schedule_type: string;
  frequency?: string | null;
  time_of_day?: string | null;
  dose_times?: unknown;
  selected_days?: unknown;
  notes: string | null;
  active?: boolean | null;
  is_active?: boolean | null;
  created_at: string;
  updated_at: string;
}): Medication {
  const scheduleType = normalizeMedicationScheduleType(row.schedule_type);
  const doseTimes = normalizeMedicationDoseTimes({
    raw: row.dose_times,
    scheduleType,
    scheduleLabel: row.schedule_type,
    reminderTime: row.time_of_day ?? null,
    dosage: row.dosage,
  });
  const selectedDays = normalizeMedicationSelectedDays({
    raw: row.selected_days,
    scheduleType,
  });

  return {
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    dosage: row.dosage,
    frequency: buildMedicationScheduleSummary({
      scheduleType,
      doseTimes,
      selectedDays,
    }),
    schedule_type: scheduleType,
    dose_times: doseTimes,
    selected_days: selectedDays,
    reminder_time: doseTimes[0]?.time ?? row.time_of_day ?? null,
    notes: row.notes,
    active: row.active ?? row.is_active ?? true,
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

      if (response.error && isMissingScheduleColumnsError(response.error)) {
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
            frequency?: string | null;
            time_of_day?: string | null;
            dose_times?: unknown;
            selected_days?: unknown;
            notes: string | null;
            active?: boolean | null;
            is_active?: boolean | null;
            created_at: string;
            updated_at: string;
          },
        ),
      );
      await setCachedJson(getMedicationsCacheKey(userId), rows);
      return rows;
    } catch (error) {
      const details =
        error && typeof error === "object"
          ? (error as { message?: unknown; code?: unknown; details?: unknown; hint?: unknown })
          : null;

      console.error("[care] medications refresh failed", {
        message: typeof details?.message === "string" ? details.message : String(error),
        code: typeof details?.code === "string" ? details.code : undefined,
        details: typeof details?.details === "string" ? details.details : undefined,
        hint: typeof details?.hint === "string" ? details.hint : undefined,
      });

      const cached = await getCachedJson<Medication[]>(getMedicationsCacheKey(userId));
      if (cached) {
        return cached;
      }

      return [] as Medication[];
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
    if (!name) {
      throw new Error("Please enter a medication name.");
    }

    const normalizedDoseTimes = normalizeMedicationDoseTimes({
      raw: input.dose_times,
      scheduleType: input.schedule_type,
      dosage: input.dosage,
    });
    const normalizedDays = normalizeMedicationSelectedDays({
      raw: input.selected_days,
      scheduleType: input.schedule_type,
    });
    const payload = {
      user_id: currentUser.id,
      name,
      dosage: input.dosage?.trim() || null,
      schedule_type: input.schedule_type,
      frequency: null,
      time_of_day: normalizedDoseTimes[0]?.time ?? null,
      dose_times: normalizedDoseTimes,
      selected_days: normalizedDays,
      notes: input.notes?.trim() || null,
      active: input.active ?? true,
    };

    console.log("[medications] create payload", payload);

    const { data, error } = await supabase
      .from("medications")
      .insert(payload)
      .select(SAVE_SELECT_FIELDS)
      .single();

    if (error) {
      throw normalizeError(error);
    }

    return mapMedicationRow({
      ...(data as {
        id: string;
        user_id: string;
        name: string;
        dosage: string | null;
        schedule_type: string;
        frequency?: string | null;
        time_of_day?: string | null;
        notes: string | null;
        active?: boolean | null;
        is_active?: boolean | null;
        created_at: string;
        updated_at: string;
      }),
      dose_times: normalizedDoseTimes,
      selected_days: normalizedDays,
    });
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
    if (!name) {
      throw new Error("Please enter a medication name.");
    }

    const normalizedDoseTimes = normalizeMedicationDoseTimes({
      raw: input.dose_times,
      scheduleType: input.schedule_type,
      dosage: input.dosage,
    });
    const normalizedDays = normalizeMedicationSelectedDays({
      raw: input.selected_days,
      scheduleType: input.schedule_type,
    });
    const payload = {
      name,
      dosage: input.dosage?.trim() || null,
      schedule_type: input.schedule_type,
      frequency: null,
      time_of_day: normalizedDoseTimes[0]?.time ?? null,
      dose_times: normalizedDoseTimes,
      selected_days: normalizedDays,
      notes: input.notes?.trim() || null,
      active: input.active ?? true,
    };

    console.log("[medications] update payload", {
      medicationId,
      userId: currentUser.id,
      ...payload,
    });

    const { data, error } = await supabase
      .from("medications")
      .update(payload)
      .eq("id", medicationId)
      .eq("user_id", currentUser.id)
      .select(SAVE_SELECT_FIELDS)
      .single();

    if (error) {
      throw normalizeError(error);
    }

    return mapMedicationRow({
      ...(data as {
        id: string;
        user_id: string;
        name: string;
        dosage: string | null;
        schedule_type: string;
        frequency?: string | null;
        time_of_day?: string | null;
        notes: string | null;
        active?: boolean | null;
        is_active?: boolean | null;
        created_at: string;
        updated_at: string;
      }),
      dose_times: normalizedDoseTimes,
      selected_days: normalizedDays,
    });
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
      let response = await supabase
        .from("medication_logs")
        .select("medication_id, created_at, time, scheduled_time")
        .eq("user_id", userId)
        .eq("date", date)
        .eq("status", "taken");

      if (response.error && isMissingScheduleColumnsError(response.error)) {
        response = await supabase
          .from("medication_logs")
          .select("medication_id, created_at, time")
          .eq("user_id", userId)
          .eq("date", date)
          .eq("status", "taken");
      }

      const { data, error } = response;

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
          [buildMedicationTakenKey(
            medicationId,
            getRowScheduledTime(row as { scheduled_time?: string | null; time?: string | null }),
          )]: typeof row.created_at === "string" ? row.created_at : new Date().toISOString(),
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

  async markTakenToday(userId: string, medicationId: string, date: string, takenAt: string, scheduledTime?: string | null) {
    if (!userId || !medicationId) {
      throw new Error("Missing medication taken details.");
    }

    const current = (await getCachedJson<Record<string, string>>(getMedicationTakenCacheKey(userId, date))) ?? {};
    const takenKey = buildMedicationTakenKey(medicationId, scheduledTime);
    await setCachedJson(getMedicationTakenCacheKey(userId, date), {
      ...current,
      [takenKey]: takenAt,
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

    let deleteResponse = await supabase
      .from("medication_logs")
      .delete()
      .eq("user_id", userId)
      .eq("medication_id", medicationId)
      .eq("date", date)
      .eq("scheduled_time", scheduledTime ?? null);

    if (deleteResponse.error && isMissingScheduleColumnsError(deleteResponse.error)) {
      deleteResponse = await supabase
        .from("medication_logs")
        .delete()
        .eq("user_id", userId)
        .eq("medication_id", medicationId)
        .eq("date", date)
        .eq("time", scheduledTime ?? null);
    }

    const deleteError = deleteResponse.error;

    if (deleteError) {
      throw normalizeError(deleteError);
    }

    let insertResponse = await supabase.from("medication_logs").insert({
      user_id: userId,
      medication_id: medicationId,
      date,
      status: "taken",
      time: getCurrentTimeValue(),
      scheduled_time: scheduledTime ?? null,
    });

    if (insertResponse.error && isMissingScheduleColumnsError(insertResponse.error)) {
      insertResponse = await supabase.from("medication_logs").insert({
        user_id: userId,
        medication_id: medicationId,
        date,
        status: "taken",
        time: scheduledTime ?? null,
      });
    }

    const error = insertResponse.error;

    if (error) {
      throw normalizeError(error);
    }
  },

  async unmarkTakenToday(userId: string, medicationId: string, date: string, scheduledTime?: string | null) {
    if (!userId || !medicationId) {
      throw new Error("Missing medication taken details.");
    }

    const current = (await getCachedJson<Record<string, string>>(getMedicationTakenCacheKey(userId, date))) ?? {};
    const next = { ...current };
    delete next[buildMedicationTakenKey(medicationId, scheduledTime)];
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

    let deleteResponse = await supabase
      .from("medication_logs")
      .delete()
      .eq("user_id", userId)
      .eq("medication_id", medicationId)
      .eq("date", date)
      .eq("scheduled_time", scheduledTime ?? null);

    if (deleteResponse.error && isMissingScheduleColumnsError(deleteResponse.error)) {
      deleteResponse = await supabase
        .from("medication_logs")
        .delete()
        .eq("user_id", userId)
        .eq("medication_id", medicationId)
        .eq("date", date)
        .eq("time", scheduledTime ?? null);
    }

    const error = deleteResponse.error;

    if (error) {
      throw normalizeError(error);
    }
  },
};
