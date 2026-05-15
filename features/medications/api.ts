import env from "../../lib/env";
import { getCachedJson, setCachedJson } from "../../lib/local-cache";
import { normalizeError } from "../../lib/errors";
import { supabase } from "../../lib/supabase/client";
import type { Medication, MedicationInput } from "./types";

const SELECT_FIELDS = "id, user_id, name, dosage, schedule_type, notes, active, created_at, updated_at";

function mapMedicationRow(row: {
  id: string;
  user_id: string;
  name: string;
  dosage: string | null;
  schedule_type: string;
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
    notes: row.notes,
    active: row.active,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function getMedicationsCacheKey(userId: string) {
  return `cache.medications.${userId}`;
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
      const { data, error } = await supabase
        .from("medications")
        .select(SELECT_FIELDS)
        .eq("user_id", userId)
        .order("active", { ascending: false })
        .order("created_at", { ascending: false });

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
      active: true,
    };

    const { data, error } = await supabase
      .from("medications")
      .insert(payload)
      .select(SELECT_FIELDS)
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
        notes: string | null;
        active: boolean;
        created_at: string;
        updated_at: string;
      },
    );
  },
};
