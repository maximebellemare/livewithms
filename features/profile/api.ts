import env from "../../lib/env";
import { getMockProfile } from "../../lib/dev-auth";
import { normalizeError } from "../../lib/errors";
import { logger } from "../../lib/logger";
import { supabase } from "../../lib/supabase/client";
import type { Profile } from "./types";

const PROFILE_SELECT =
  "user_id, onboarding_completed, display_name, ms_type, year_diagnosed, symptoms, goals, country, age_range, updated_at";
export const PROFILE_WRITE_MODE = "user_id" as const;

if (__DEV__) {
  console.info("[profile] profiles write mode", {
    writeMode: PROFILE_WRITE_MODE,
    keyColumn: "user_id",
    supabaseUrl: env.supabaseUrl || null,
    projectRef: env.supabaseProjectRef,
  });
}

type ProfileRow = Partial<Profile>;

type ProfileUpsertPayload = {
  user_id: string;
  display_name?: string | null;
  onboarding_completed?: boolean;
  ms_type?: string | null;
  year_diagnosed?: string | null;
  symptoms?: string[];
  goals?: string[];
  country?: string | null;
  age_range?: string | null;
  updated_at: string;
};

let hasLoggedProfileSchemaDiagnostic = false;
let lastProfileSaveDebug: ProfileSaveDebug | null = null;
const completedOnboardingUserIds = new Set<string>();

export type ProfileSaveDebug = {
  writeMode: typeof PROFILE_WRITE_MODE;
  keyColumn: "user_id";
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
  status?: number | null;
  statusText?: string | null;
  context: string;
};

function getSupabaseErrorDetails(error: unknown) {
  const maybeError = error as {
    message?: unknown;
    code?: unknown;
    details?: unknown;
    hint?: unknown;
  };

  return {
    message: typeof maybeError?.message === "string" ? maybeError.message : "Unknown error",
    code: typeof maybeError?.code === "string" ? maybeError.code : undefined,
    details: typeof maybeError?.details === "string" ? maybeError.details : undefined,
    hint: typeof maybeError?.hint === "string" ? maybeError.hint : undefined,
  };
}

function createProfileSaveError(message: string, error?: unknown) {
  const details = error ? getSupabaseErrorDetails(error) : null;
  const saveError = new Error(message) as Error & {
    code?: string;
    details?: string;
    hint?: string;
    cause?: unknown;
  };

  if (details) {
    saveError.code = details.code;
    saveError.details = details.details;
    saveError.hint = details.hint;
    saveError.cause = error;
  }

  return saveError;
}

function isNetworkFailure(error: unknown) {
  const details = getSupabaseErrorDetails(error);
  const combined = `${details.message} ${details.details ?? ""} ${details.hint ?? ""}`.toLowerCase();
  return combined.includes("network request failed") || combined.includes("failed to fetch") || combined.includes("networkerror");
}

function logRawProfileSaveResponse(input: {
  context: string;
  data: unknown;
  error: unknown;
  status?: number | null;
  statusText?: string | null;
}) {
  const details = input.error ? getSupabaseErrorDetails(input.error) : null;
  const status = input.status ?? null;
  const statusText = input.statusText ?? null;

  lastProfileSaveDebug = {
    writeMode: PROFILE_WRITE_MODE,
    keyColumn: "user_id",
    code: details?.code,
    message: details?.message,
    details: details?.details,
    hint: details?.hint,
    status,
    statusText,
    context: input.context,
  };

  if (!__DEV__) {
    return;
  }

  const logPayload = {
    data: input.data,
    error: input.error,
    status,
    statusText,
    message: details?.message,
    code: details?.code,
    details: details?.details,
    hint: details?.hint,
    writeMode: PROFILE_WRITE_MODE,
    keyColumn: "user_id",
    supabaseUrl: env.supabaseUrl || null,
    projectRef: env.supabaseProjectRef,
    context: input.context,
  };

  if (input.error) {
    console.error("[profile] raw profile save response", logPayload);
    return;
  }

  if (status === 200 || status === 201) {
    console.info("[profile] profile save response", logPayload);
    return;
  }

  console.info("[profile] profile save response", logPayload);
}

export function getProfileSaveDebugSnapshot() {
  return lastProfileSaveDebug;
}

async function logProfileSchemaDiagnostic(context: string, originalError?: unknown) {
  if (!__DEV__ || hasLoggedProfileSchemaDiagnostic) {
    return;
  }

  hasLoggedProfileSchemaDiagnostic = true;

  const { data, error } = await supabase.from("profiles").select("*").limit(1);
  const firstRow = Array.isArray(data) ? data[0] : null;

  console.error("[profile] Supabase profiles schema diagnostic", {
    context,
    supabaseUrl: env.supabaseUrl || null,
    projectRef: env.supabaseProjectRef,
    anonKeyExists: Boolean(env.supabaseAnonKey),
    originalError: originalError ? getSupabaseErrorDetails(originalError) : null,
    probeError: error ? getSupabaseErrorDetails(error) : null,
    rowCount: Array.isArray(data) ? data.length : null,
    firstRowColumns: firstRow && typeof firstRow === "object" ? Object.keys(firstRow) : [],
  });
}

function buildFallbackProfile(userId: string): Profile {
  return {
    user_id: userId,
    onboarding_completed: completedOnboardingUserIds.has(userId),
    display_name: null,
    ms_type: null,
    year_diagnosed: null,
    symptoms: [],
    goals: [],
    country: null,
    age_range: null,
  };
}

function normalizeProfile(data: ProfileRow | null | undefined, userId: string): Profile {
  return {
    ...buildFallbackProfile(userId),
    ...data,
    user_id: data?.user_id ?? userId,
    onboarding_completed: data?.onboarding_completed ?? completedOnboardingUserIds.has(userId),
    display_name: data?.display_name ?? null,
    symptoms: data?.symptoms ?? [],
    goals: data?.goals ?? [],
  };
}

function hasProfileInput<K extends keyof ProfileUpdateInput>(input: ProfileUpdateInput, key: K) {
  return Object.prototype.hasOwnProperty.call(input, key);
}

function cleanNullableText(value: string | null | undefined) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function buildProfileUpsertPayload(userId: string, input: ProfileUpdateInput): ProfileUpsertPayload {
  const payload: ProfileUpsertPayload = {
    user_id: userId,
    updated_at: new Date().toISOString(),
  };

  if (hasProfileInput(input, "display_name")) {
    payload.display_name = cleanNullableText(input.display_name);
  }

  if (hasProfileInput(input, "onboarding_completed") && input.onboarding_completed !== undefined) {
    payload.onboarding_completed = input.onboarding_completed;
  }

  if (hasProfileInput(input, "ms_type")) {
    payload.ms_type = cleanNullableText(input.ms_type);
  }

  if (hasProfileInput(input, "year_diagnosed")) {
    payload.year_diagnosed = cleanNullableText(input.year_diagnosed);
  }

  if (hasProfileInput(input, "symptoms")) {
    payload.symptoms = input.symptoms ?? [];
  }

  if (hasProfileInput(input, "goals")) {
    payload.goals = input.goals ?? [];
  }

  if (hasProfileInput(input, "country")) {
    payload.country = cleanNullableText(input.country);
  }

  if (hasProfileInput(input, "age_range")) {
    payload.age_range = cleanNullableText(input.age_range);
  }

  return payload;
}

export type ProfileUpdateInput = Partial<{
  display_name: string | null;
  ms_type: string | null;
  year_diagnosed: string | null;
  symptoms: string[];
  goals: string[];
  country: string | null;
  age_range: string | null;
  onboarding_completed: boolean;
}>;

export const profileApi = {
  async getMyProfile(userId: string) {
    if (!userId) {
      throw new Error("Missing user id for profile query");
    }

    if (!env.isSupabaseConfigured) {
      return getMockProfile();
    }

    const { data, error } = await supabase
      .from("profiles")
      .select(PROFILE_SELECT)
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      await logProfileSchemaDiagnostic("profile_lookup", error);
      logger.warn("Profile lookup failed; using safe fallback", {
        userId,
        friendlyMessage: normalizeError(error).message,
        ...getSupabaseErrorDetails(error),
      });
      return buildFallbackProfile(userId);
    }

    if (!data) {
      return profileApi.createFallbackProfile(userId);
    }

    return normalizeProfile(data as ProfileRow, userId);
  },

  async createFallbackProfile(userId: string) {
    if (!env.isSupabaseConfigured) {
      return getMockProfile();
    }

    const { data, error, status, statusText } = await supabase
      .from("profiles")
      .upsert(
        {
          user_id: userId,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id",
        },
      )
      .select(PROFILE_SELECT)
      .maybeSingle();

    logRawProfileSaveResponse({
      context: "profile_auto_create",
      data,
      error,
      status,
      statusText,
    });

    if (error) {
      await logProfileSchemaDiagnostic("profile_auto_create", error);
      logger.warn("Profile auto-create failed; using safe fallback", {
        userId,
        friendlyMessage: normalizeError(error).message,
        ...getSupabaseErrorDetails(error),
      });
      return buildFallbackProfile(userId);
    }

    return normalizeProfile(data as ProfileRow, userId);
  },

  async updateMyProfile(userId: string, input: ProfileUpdateInput) {
    if (!userId) {
      throw new Error("Missing user id for profile update");
    }

    if (!env.isSupabaseConfigured) {
      return {
        ...getMockProfile(),
        ...input,
      } as Profile;
    }

    const payload = buildProfileUpsertPayload(userId, input);
    if (input.onboarding_completed === true) {
      completedOnboardingUserIds.add(userId);
    }

    if (__DEV__) {
      console.info("[profile] profile upsert payload", {
        payload,
        select: PROFILE_SELECT,
        writeMode: PROFILE_WRITE_MODE,
        keyColumn: "user_id",
      });
    }

    const { data, error, status, statusText } = await supabase
      .from("profiles")
      .upsert(payload, {
        onConflict: "user_id",
      })
      .select(PROFILE_SELECT)
      .maybeSingle();

    logRawProfileSaveResponse({
      context: "profile_upsert",
      data,
      error,
      status,
      statusText,
    });

    if (error) {
      await logProfileSchemaDiagnostic("profile_upsert", error);
      const details = getSupabaseErrorDetails(error);
      logger.error("Profile update failed", {
        userId,
        input: payload,
        query: "profiles.upsert.user_id",
        writeMode: PROFILE_WRITE_MODE,
        friendlyMessage: normalizeError(error).message,
        ...details,
        error,
      });

      if (isNetworkFailure(error)) {
        throw createProfileSaveError("Network connection failed. Check your connection and try again.", error);
      }

      throw createProfileSaveError("Could not save profile. Please try again.", error);
    }

    return normalizeProfile(data as ProfileRow, userId);
  },
};
