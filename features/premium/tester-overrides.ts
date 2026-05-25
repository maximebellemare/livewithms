import type { SupabaseClient } from "@supabase/supabase-js";
import { logger } from "../../lib/logger";
import { supabase } from "../../lib/supabase/client";
import type { Database } from "../../lib/supabase/types";

export type PremiumTesterOverride = Database["public"]["Tables"]["premium_overrides"]["Row"];
export type PremiumAccessSource = "revenuecat" | "tester_override" | "dev_override" | "none";

type PremiumOverrideClient = Pick<SupabaseClient<Database>, "from">;
const INTERNAL_PREMIUM_DEBUG_EMAILS = new Set(["annadiaz@live.ca"]);

type PremiumOverrideLookupInput = {
  userId?: string | null;
  email?: string | null;
};

type GrantTesterPremiumOptions = {
  expiresAt?: string | null;
  note?: string | null;
  userId?: string | null;
  client?: PremiumOverrideClient;
};

export function normalizePremiumOverrideEmail(email: string | null | undefined) {
  return email?.trim().toLowerCase() ?? null;
}

export function shouldShowPremiumInternalDebug(email: string | null | undefined) {
  const normalizedEmail = normalizePremiumOverrideEmail(email);
  return normalizedEmail ? INTERNAL_PREMIUM_DEBUG_EMAILS.has(normalizedEmail) : false;
}

export function isTesterPremiumOverrideActive(
  override: PremiumTesterOverride | null | undefined,
  now = new Date(),
) {
  if (!override) {
    return false;
  }

  if (!override.active) {
    return false;
  }

  if (!override.expires_at) {
    return true;
  }

  return new Date(override.expires_at).getTime() > now.getTime();
}

async function findActiveOverridesForCurrentUser(client: PremiumOverrideClient) {
  const { data, error } = await client
    .from("premium_overrides")
    .select("*")
    .eq("active", true)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function getActiveTesterPremiumOverride(
  input: PremiumOverrideLookupInput,
  client: PremiumOverrideClient = supabase,
) {
  const normalizedEmail = normalizePremiumOverrideEmail(input.email);

  if (!input.userId && !normalizedEmail) {
    return null;
  }

  const candidates = await findActiveOverridesForCurrentUser(client);

  return (
    candidates.find((candidate) => {
      if (!isTesterPremiumOverrideActive(candidate)) {
        return false;
      }

      if (input.userId && candidate.user_id === input.userId) {
        return true;
      }

      return Boolean(
        normalizedEmail &&
          candidate.email &&
          normalizePremiumOverrideEmail(candidate.email) === normalizedEmail,
      );
    }) ?? null
  );
}

export async function getActiveTesterPremiumOverrideSafely(
  input: PremiumOverrideLookupInput,
  client: PremiumOverrideClient = supabase,
) {
  try {
    return await getActiveTesterPremiumOverride(input, client);
  } catch (error) {
    logger.warn("Tester premium override lookup failed", {
      message: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

export async function grantTesterPremium(email: string, options: GrantTesterPremiumOptions = {}) {
  const normalizedEmail = normalizePremiumOverrideEmail(email);

  if (!normalizedEmail) {
    throw new Error("A valid email is required to grant tester premium access.");
  }

  const client = options.client ?? supabase;
  const payload: Database["public"]["Tables"]["premium_overrides"]["Insert"] = {
    email: normalizedEmail,
    user_id: options.userId ?? null,
    active: true,
    expires_at: options.expiresAt ?? null,
    note: options.note ?? "Temporary beta tester premium access",
  };

  const { data, error } = await client
    .from("premium_overrides")
    .upsert(payload, { onConflict: "email" })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}
