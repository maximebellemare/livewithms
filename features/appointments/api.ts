import env from "../../lib/env";
import { normalizeError } from "../../lib/errors";
import { supabase } from "../../lib/supabase/client";
import type { Appointment, AppointmentInput } from "./types";

const SELECT_FIELDS =
  "id, user_id, title, appointment_date, appointment_time, provider, location, notes, created_at, updated_at";

function normalizeDate(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    throw new Error("Please enter an appointment date.");
  }

  return trimmed.slice(0, 10);
}

function mapAppointmentRow(row: {
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
}): Appointment {
  return {
    id: row.id,
    user_id: row.user_id,
    title: row.title,
    appointment_date: row.appointment_date,
    appointment_time: row.appointment_time,
    provider: row.provider,
    location: row.location,
    notes: row.notes,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export const appointmentsApi = {
  async listAppointments(userId: string) {
    if (!userId) {
      throw new Error("Missing user id for appointments query.");
    }

    if (!env.isSupabaseConfigured) {
      return [] as Appointment[];
    }

    const { data, error } = await supabase
      .from("appointments")
      .select(SELECT_FIELDS)
      .eq("user_id", userId)
      .order("appointment_date", { ascending: true })
      .order("appointment_time", { ascending: true });

    if (error) {
      throw normalizeError(error);
    }

    return (data ?? []).map((row) =>
      mapAppointmentRow(
        row as {
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
        },
      ),
    );
  },

  async createAppointment(userId: string, input: AppointmentInput) {
    if (!env.isSupabaseConfigured) {
      throw new Error("Supabase is not configured for appointments.");
    }

    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError) {
      throw normalizeError(authError);
    }

    const currentUser = authData.user;

    if (!currentUser?.id) {
      throw new Error("Missing authenticated user for appointment save.");
    }

    if (userId && currentUser.id !== userId) {
      throw new Error("Authenticated user does not match requested appointment save.");
    }

    const payload = {
      user_id: currentUser.id,
      title: input.title.trim(),
      appointment_date: normalizeDate(input.appointment_date),
      appointment_time: input.appointment_time?.trim() || null,
      provider: input.provider?.trim() || null,
      location: input.location?.trim() || null,
      notes: input.notes?.trim() || null,
      // Keep legacy columns in sync until generated Supabase types fully match the newer schema.
      date: normalizeDate(input.appointment_date),
      time: input.appointment_time?.trim() || null,
    };

    if (!payload.title) {
      throw new Error("Please enter an appointment title.");
    }

    const { data, error } = await supabase
      .from("appointments")
      .insert(payload)
      .select(SELECT_FIELDS)
      .single();

    if (error) {
      throw normalizeError(error);
    }

    return mapAppointmentRow(
      data as {
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
      },
    );
  },

  async updateAppointment(userId: string, appointmentId: string, input: AppointmentInput) {
    if (!env.isSupabaseConfigured) {
      throw new Error("Supabase is not configured for appointments.");
    }

    if (!appointmentId) {
      throw new Error("Missing appointment id for update.");
    }

    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError) {
      throw normalizeError(authError);
    }

    const currentUser = authData.user;

    if (!currentUser?.id) {
      throw new Error("Missing authenticated user for appointment update.");
    }

    if (userId && currentUser.id !== userId) {
      throw new Error("Authenticated user does not match requested appointment update.");
    }

    const title = input.title.trim();

    if (!title) {
      throw new Error("Please enter an appointment title.");
    }

    const payload = {
      title,
      appointment_date: normalizeDate(input.appointment_date),
      appointment_time: input.appointment_time?.trim() || null,
      provider: input.provider?.trim() || null,
      location: input.location?.trim() || null,
      notes: input.notes?.trim() || null,
      date: normalizeDate(input.appointment_date),
      time: input.appointment_time?.trim() || null,
    };

    const { data, error } = await supabase
      .from("appointments")
      .update(payload)
      .eq("id", appointmentId)
      .eq("user_id", currentUser.id)
      .select(SELECT_FIELDS)
      .single();

    if (error) {
      throw normalizeError(error);
    }

    return mapAppointmentRow(
      data as {
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
      },
    );
  },

  async deleteAppointment(userId: string, appointmentId: string) {
    if (!env.isSupabaseConfigured) {
      throw new Error("Supabase is not configured for appointments.");
    }

    if (!appointmentId) {
      throw new Error("Missing appointment id for delete.");
    }

    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError) {
      throw normalizeError(authError);
    }

    const currentUser = authData.user;

    if (!currentUser?.id) {
      throw new Error("Missing authenticated user for appointment delete.");
    }

    if (userId && currentUser.id !== userId) {
      throw new Error("Authenticated user does not match requested appointment delete.");
    }

    const { error } = await supabase
      .from("appointments")
      .delete()
      .eq("id", appointmentId)
      .eq("user_id", currentUser.id);

    if (error) {
      throw normalizeError(error);
    }
  },
};
