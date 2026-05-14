import env from "../../lib/env";
import { normalizeError } from "../../lib/errors";
import { supabase } from "../../lib/supabase/client";
import type { CareNote, CareNoteInput } from "./types";

const SELECT_FIELDS = "id, user_id, title, body, category, created_at, updated_at";

function mapCareNoteRow(row: {
  id: string;
  user_id: string;
  title: string | null;
  body: string;
  category: string | null;
  created_at: string;
  updated_at: string;
}): CareNote {
  return {
    id: row.id,
    user_id: row.user_id,
    title: row.title,
    body: row.body,
    category: row.category,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

async function getAuthenticatedCareNotesUser(userId: string) {
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError) {
    throw normalizeError(authError);
  }

  const currentUser = authData.user;

  if (!currentUser?.id) {
    throw new Error("Missing authenticated user for care notes.");
  }

  if (userId && currentUser.id !== userId) {
    throw new Error("Authenticated user does not match requested care notes action.");
  }

  return currentUser;
}

export const careNotesApi = {
  async listCareNotes(userId: string) {
    if (!userId) {
      throw new Error("Missing user id for care notes query.");
    }

    if (!env.isSupabaseConfigured) {
      return [] as CareNote[];
    }

    const { data, error } = await supabase
      .from("care_notes")
      .select(SELECT_FIELDS)
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });

    if (error) {
      throw normalizeError(error);
    }

    return (data ?? []).map((row) =>
      mapCareNoteRow(
        row as {
          id: string;
          user_id: string;
          title: string | null;
          body: string;
          category: string | null;
          created_at: string;
          updated_at: string;
        },
      ),
    );
  },

  async createCareNote(userId: string, input: CareNoteInput) {
    if (!env.isSupabaseConfigured) {
      throw new Error("Supabase is not configured for care notes.");
    }

    const currentUser = await getAuthenticatedCareNotesUser(userId);
    const body = input.body.trim();

    if (!body) {
      throw new Error("Please enter a note before saving.");
    }

    const payload = {
      user_id: currentUser.id,
      title: input.title?.trim() || null,
      body,
      category: input.category?.trim() || null,
    };

    const { data, error } = await supabase
      .from("care_notes")
      .insert(payload)
      .select(SELECT_FIELDS)
      .single();

    if (error) {
      throw normalizeError(error);
    }

    return mapCareNoteRow(
      data as {
        id: string;
        user_id: string;
        title: string | null;
        body: string;
        category: string | null;
        created_at: string;
        updated_at: string;
      },
    );
  },

  async updateCareNote(userId: string, noteId: string, input: CareNoteInput) {
    if (!env.isSupabaseConfigured) {
      throw new Error("Supabase is not configured for care notes.");
    }

    if (!noteId) {
      throw new Error("Missing note id for care note update.");
    }

    const currentUser = await getAuthenticatedCareNotesUser(userId);
    const body = input.body.trim();

    if (!body) {
      throw new Error("Please enter a note before saving.");
    }

    const payload = {
      title: input.title?.trim() || null,
      body,
      category: input.category?.trim() || null,
    };

    const { data, error } = await supabase
      .from("care_notes")
      .update(payload)
      .eq("id", noteId)
      .eq("user_id", currentUser.id)
      .select(SELECT_FIELDS)
      .single();

    if (error) {
      throw normalizeError(error);
    }

    return mapCareNoteRow(
      data as {
        id: string;
        user_id: string;
        title: string | null;
        body: string;
        category: string | null;
        created_at: string;
        updated_at: string;
      },
    );
  },

  async deleteCareNote(userId: string, noteId: string) {
    if (!env.isSupabaseConfigured) {
      throw new Error("Supabase is not configured for care notes.");
    }

    if (!noteId) {
      throw new Error("Missing note id for care note delete.");
    }

    const currentUser = await getAuthenticatedCareNotesUser(userId);

    const { error } = await supabase
      .from("care_notes")
      .delete()
      .eq("id", noteId)
      .eq("user_id", currentUser.id);

    if (error) {
      throw normalizeError(error);
    }
  },
};
