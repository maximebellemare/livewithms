import { Platform } from "react-native";
import env from "../../lib/env";
import { appSecureStore } from "../../lib/secure-store";
import { supabase } from "../../lib/supabase/client";
import { profileApi } from "../profile/api";

const PENDING_REFERRAL_KEY = "livewithms.pending-affiliate-referral";

const REFERRAL_MATCH_KEYS = [
  "slug",
  "code",
  "ref",
  "referral_code",
  "short_code",
  "path_slug",
  "handle",
  "promo_code",
  "affiliate",
];

type RecordLike = Record<string, unknown>;
type PendingReferralRecord = {
  referralCode: string;
  source: string;
  capturedAt: string;
};

type AttributionResult =
  | {
      ok: true;
      affiliateId: string;
      affiliateName: string | null;
      reason: "attributed" | "already-attributed";
    }
  | {
      ok: false;
      reason:
        | "missing-referral"
        | "invalid-referral"
        | "supabase-not-configured"
        | "profile-update-failed"
        | "install-insert-failed"
        | "attribution-failed";
    };

type DynamicSupabaseTable = {
  select: (query: string) => {
    limit: (count: number) => Promise<{ data: unknown; error: unknown }>;
    eq: (column: string, value: string) => {
      maybeSingle: () => Promise<{ data: unknown; error: unknown }>;
    };
  };
  insert: (payload: Record<string, unknown>) => Promise<{ error: unknown }>;
  update: (payload: Record<string, unknown>) => {
    eq: (column: string, value: string) => Promise<{ data?: unknown; error: unknown }>;
  };
};

type DynamicSupabaseClient = {
  from: (table: string) => DynamicSupabaseTable;
};

const affiliateSupabase = supabase as unknown as DynamicSupabaseClient;

function isRecordLike(value: unknown): value is RecordLike {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function normalizeReferralCode(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

function logAffiliateStep(message: string, payload?: Record<string, unknown>) {
  if (payload) {
    console.log(`[affiliate] ${message}`, payload);
    return;
  }

  console.log(`[affiliate] ${message}`);
}

function logAffiliateError(message: string, payload?: Record<string, unknown>) {
  if (payload) {
    console.error(`[affiliate] ${message}`, payload);
    return;
  }

  console.error(`[affiliate] ${message}`);
}

export async function getPendingAffiliateReferralRecord(): Promise<PendingReferralRecord | null> {
  const stored = await appSecureStore.getItem(PENDING_REFERRAL_KEY);
  if (!stored) {
    return null;
  }

  try {
    const parsed = JSON.parse(stored) as Partial<PendingReferralRecord>;
    if (typeof parsed.referralCode === "string" && normalizeReferralCode(parsed.referralCode)) {
      return {
        referralCode: normalizeReferralCode(parsed.referralCode),
        source: typeof parsed.source === "string" ? parsed.source : "unknown",
        capturedAt: typeof parsed.capturedAt === "string" ? parsed.capturedAt : new Date().toISOString(),
      };
    }
  } catch {
    const normalized = normalizeReferralCode(stored);
    if (normalized) {
      return {
        referralCode: normalized,
        source: "legacy",
        capturedAt: new Date().toISOString(),
      };
    }
  }

  return null;
}

export async function getPendingAffiliateReferralCode() {
  const record = await getPendingAffiliateReferralRecord();
  return record?.referralCode ?? "";
}

export async function storePendingAffiliateReferral(referralCode: string, source: string) {
  const normalizedReferral = normalizeReferralCode(referralCode);
  if (!normalizedReferral) {
    return false;
  }

  const payload: PendingReferralRecord = {
    referralCode: normalizedReferral,
    source,
    capturedAt: new Date().toISOString(),
  };

  await appSecureStore.setItem(PENDING_REFERRAL_KEY, JSON.stringify(payload));
  logAffiliateStep("referral stored", payload);
  return true;
}

export async function clearPendingAffiliateReferral() {
  await appSecureStore.deleteItem(PENDING_REFERRAL_KEY);
}

function findReferralMatch(rows: unknown[], referralCode: string) {
  const normalizedReferral = normalizeReferralCode(referralCode);

  return rows.find((row) => {
    if (!isRecordLike(row)) {
      return false;
    }

    return REFERRAL_MATCH_KEYS.some((key) => {
      const candidate = row[key];
      return typeof candidate === "string" && normalizeReferralCode(candidate) === normalizedReferral;
    });
  }) as RecordLike | undefined;
}

async function resolveAffiliateRecord(table: "referral_links" | "affiliates", referralCode: string) {
  const { data, error } = await affiliateSupabase.from(table).select("*").limit(200);
  if (error) {
    logAffiliateError("affiliate lookup failed", {
      table,
      referralCode,
      error,
    });
    return null;
  }

  return findReferralMatch(Array.isArray(data) ? data : [], referralCode) ?? null;
}

function getAffiliateIdFromMatch(match: RecordLike | null) {
  if (!match) {
    return null;
  }

  if (typeof match.affiliate_id === "string") {
    return match.affiliate_id;
  }

  if (typeof match.id === "string") {
    return match.id;
  }

  return null;
}

function getAffiliateNameFromMatch(match: RecordLike | null) {
  if (!match) {
    return null;
  }

  const candidateKeys = ["name", "display_name", "full_name", "title"];
  for (const key of candidateKeys) {
    const candidate = match[key];
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
  }

  return null;
}

async function getAffiliateNameById(affiliateId: string) {
  const { data, error } = await affiliateSupabase
    .from("affiliates")
    .select("name, display_name")
    .eq("id", affiliateId)
    .maybeSingle();

  if (error) {
    logAffiliateError("affiliate name lookup failed", {
      affiliateId,
      error,
    });
    return null;
  }

  return isRecordLike(data) ? getAffiliateNameFromMatch(data) : null;
}

async function getExistingProfileAffiliateId(userId: string) {
  const { data, error } = await affiliateSupabase
    .from("profiles")
    .select("affiliate_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    logAffiliateError("profile affiliate lookup failed", {
      userId,
      error,
    });
    return null;
  }

  if (!isRecordLike(data) || typeof data.affiliate_id !== "string" || !data.affiliate_id) {
    return null;
  }

  return data.affiliate_id;
}

async function updateProfileAffiliate(userId: string, affiliateId: string) {
  await profileApi.createFallbackProfile(userId);

  const payloads = [
    { affiliate_id: affiliateId },
    { affiliate_id: affiliateId, updated_at: new Date().toISOString() },
  ];

  let lastError: unknown = null;

  for (const payload of payloads) {
    const { error } = await affiliateSupabase.from("profiles").update(payload).eq("user_id", userId);
    if (!error) {
      logAffiliateStep("profile updated", { userId, affiliateId, payloadKeys: Object.keys(payload) });
      return true;
    }

    lastError = error;
  }

  logAffiliateError("profile update failed", {
    userId,
    affiliateId,
    error: lastError,
  });
  return false;
}

async function insertAffiliateInstall(userId: string, affiliateId: string, platform: string, referralCode: string) {
  const payloads = [
    { user_id: userId, affiliate_id: affiliateId, platform, referral_code: referralCode },
    { user_id: userId, affiliate_id: affiliateId, platform },
    { user_id: userId, affiliate_id: affiliateId },
  ];

  let lastError: unknown = null;

  for (const payload of payloads) {
    const { error } = await affiliateSupabase.from("affiliate_installs").insert(payload);
    if (!error) {
      logAffiliateStep("affiliate_install inserted", { userId, affiliateId, platform, payloadKeys: Object.keys(payload) });
      return true;
    }

    const maybeError = error as { message?: unknown };
    const message = typeof maybeError?.message === "string" ? maybeError.message.toLowerCase() : "";
    if (message.includes("duplicate") || message.includes("unique")) {
      logAffiliateStep("affiliate_install inserted", {
        userId,
        affiliateId,
        platform,
        duplicate: true,
      });
      return true;
    }

    lastError = error;
  }

  logAffiliateError("affiliate install insert failed", {
    userId,
    affiliateId,
    platform,
    error: lastError,
  });
  return false;
}

export async function resolveAffiliateByReferralCode(referralCode: string) {
  const normalizedReferralCode = normalizeReferralCode(referralCode);
  if (!normalizedReferralCode || !env.isSupabaseConfigured) {
    return null;
  }

  const referralLinkMatch = await resolveAffiliateRecord("referral_links", normalizedReferralCode);
  const affiliateMatch = referralLinkMatch ? null : await resolveAffiliateRecord("affiliates", normalizedReferralCode);
  const affiliateId = getAffiliateIdFromMatch(referralLinkMatch) ?? getAffiliateIdFromMatch(affiliateMatch);

  if (!affiliateId) {
    return null;
  }

  const affiliateName =
    getAffiliateNameFromMatch(referralLinkMatch) ??
    getAffiliateNameFromMatch(affiliateMatch) ??
    (await getAffiliateNameById(affiliateId));

  return {
    affiliateId,
    affiliateName,
    referralCode: normalizedReferralCode,
  };
}

export async function attributeReferralCodeForUser(input: {
  userId: string;
  referralCode: string;
  source: string;
}): Promise<AttributionResult> {
  try {
    const normalizedReferralCode = normalizeReferralCode(input.referralCode);
    if (!normalizedReferralCode) {
      return { ok: false, reason: "missing-referral" };
    }

    await storePendingAffiliateReferral(normalizedReferralCode, input.source);

    const resolved = await resolveAffiliateByReferralCode(normalizedReferralCode);
    if (!resolved) {
      await clearPendingAffiliateReferral();
      logAffiliateError("affiliate resolve failed", {
        userId: input.userId,
        referralCode: normalizedReferralCode,
      });
      return { ok: false, reason: "invalid-referral" };
    }

    const existingAffiliateId = await getExistingProfileAffiliateId(input.userId);
    const affiliateId = existingAffiliateId ?? resolved.affiliateId;

    if (!existingAffiliateId) {
      logAffiliateStep("affiliate resolved", {
        userId: input.userId,
        referralCode: normalizedReferralCode,
        affiliateId,
      });

      const profileUpdated = await updateProfileAffiliate(input.userId, affiliateId);
      if (!profileUpdated) {
        return { ok: false, reason: "profile-update-failed" };
      }
    } else {
      logAffiliateStep("affiliate already attributed", {
        userId: input.userId,
        affiliateId: existingAffiliateId,
      });
    }

    const installInserted = await insertAffiliateInstall(input.userId, affiliateId, Platform.OS, normalizedReferralCode);
    if (!installInserted) {
      return { ok: false, reason: "install-insert-failed" };
    }

    await clearPendingAffiliateReferral();
    return {
      ok: true,
      affiliateId,
      affiliateName: resolved.affiliateName,
      reason: existingAffiliateId ? "already-attributed" : "attributed",
    };
  } catch (error) {
    logAffiliateError("attribution failed", {
      userId: input.userId,
      error,
    });
    return { ok: false, reason: "attribution-failed" };
  }
}

export async function attributePendingAffiliateReferral(userId: string): Promise<AttributionResult> {
  try {
    const pendingReferral = await getPendingAffiliateReferralRecord();
    if (!pendingReferral?.referralCode) {
      return { ok: false, reason: "missing-referral" };
    }
    return attributeReferralCodeForUser({
      userId,
      referralCode: pendingReferral.referralCode,
      source: pendingReferral.source,
    });
  } catch (error) {
    logAffiliateError("attribution failed", {
      userId,
      error,
    });
    return { ok: false, reason: "attribution-failed" };
  }
}
