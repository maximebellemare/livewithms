import { supabase } from "@/integrations/supabase/client";

const REFERRAL_STORAGE_KEY = "livewithms_affiliate_ref";
const REFERRAL_COOKIE_KEY = "livewithms_affiliate_ref";
const REFERRAL_STORAGE_META_KEY = "livewithms_affiliate_ref_meta";
const REFERRAL_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;
const PENDING_REFERRAL_STORAGE_KEY = "livewithms_pending_referral_code";

const REFERRAL_MATCH_KEYS = [
  "slug",
  "code",
  "ref",
  "referral_code",
  "short_code",
  "path_slug",
  "handle",
  "promo_code",
] as const;

type RecordLike = Record<string, unknown>;
type DynamicSupabaseTable = {
  select: (query: string) => {
    limit: (count: number) => Promise<{ data: unknown; error: unknown }>;
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

export const normalizeReferral = (value: string | null | undefined) => value?.trim().toLowerCase() ?? "";

const isRecordLike = (value: unknown): value is RecordLike =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const readReferralCookie = () => {
  if (typeof document === "undefined") return null;

  const cookieValue = document.cookie
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${REFERRAL_COOKIE_KEY}=`));

  if (!cookieValue) return null;
  return decodeURIComponent(cookieValue.split("=").slice(1).join("="));
};

const readReferralStorageMeta = () => {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(REFERRAL_STORAGE_META_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
};

const isStoredReferralFresh = (meta: unknown) => {
  if (!meta || typeof meta !== "object") return false;
  const capturedAt = "capturedAt" in meta && typeof meta.capturedAt === "string" ? Date.parse(meta.capturedAt) : NaN;
  if (Number.isNaN(capturedAt)) return false;
  return Date.now() - capturedAt <= REFERRAL_COOKIE_MAX_AGE * 1000;
};

const clearStoredReferral = () => {
  if (typeof window === "undefined") return;

  window.localStorage.removeItem(REFERRAL_STORAGE_KEY);
  window.localStorage.removeItem(REFERRAL_STORAGE_META_KEY);
  document.cookie =
    `${REFERRAL_COOKIE_KEY}=; path=/; max-age=0; SameSite=Lax`;
};

export const getStoredReferral = () => {
  if (typeof window === "undefined") return null;

  const stored = window.localStorage.getItem(REFERRAL_STORAGE_KEY);
  if (stored) {
    if (isStoredReferralFresh(readReferralStorageMeta())) {
      return stored;
    }

    clearStoredReferral();
  }

  return readReferralCookie();
};

export const storeReferral = (ref: string) => {
  if (typeof window === "undefined") return;

  const normalizedRef = normalizeReferral(ref);
  if (!normalizedRef) return;

  window.localStorage.setItem(REFERRAL_STORAGE_KEY, normalizedRef);
  window.localStorage.setItem(
    REFERRAL_STORAGE_META_KEY,
    JSON.stringify({
      code: normalizedRef,
      capturedAt: new Date().toISOString(),
    }),
  );
  document.cookie =
    `${REFERRAL_COOKIE_KEY}=${encodeURIComponent(normalizedRef)}; path=/; max-age=${REFERRAL_COOKIE_MAX_AGE}; SameSite=Lax`;
};

export const getPendingReferralCode = () => {
  if (typeof window === "undefined") return null;

  const stored = window.localStorage.getItem(PENDING_REFERRAL_STORAGE_KEY);
  return stored ? normalizeReferral(stored) : null;
};

export const storePendingReferralCode = (ref: string) => {
  if (typeof window === "undefined") return;

  const normalizedRef = normalizeReferral(ref);
  if (!normalizedRef) return;

  window.localStorage.setItem(PENDING_REFERRAL_STORAGE_KEY, normalizedRef);
};

export const clearPendingReferralCode = () => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(PENDING_REFERRAL_STORAGE_KEY);
};

export const getReferralPrefill = (search?: string | null) => {
  if (typeof window === "undefined" && !search) return "";

  const params = new URLSearchParams(search ?? window.location.search);
  const directRef = params.get("ref") || params.get("affiliate") || params.get("creator");
  if (directRef) return normalizeReferral(directRef);

  const pendingRef = getPendingReferralCode();
  if (pendingRef) return pendingRef;

  return normalizeReferral(getStoredReferral() ?? "");
};

const findReferralMatch = (rows: unknown[], ref: string) => {
  const normalizedRef = normalizeReferral(ref);

  return rows.find((row) => {
    if (!isRecordLike(row)) return false;

    return REFERRAL_MATCH_KEYS.some((key) => {
      const candidate = row[key];
      return typeof candidate === "string" && normalizeReferral(candidate) === normalizedRef;
    });
  }) as RecordLike | undefined;
};

const resolveAffiliateRecord = async (table: "referral_links" | "affiliates", ref: string) => {
  const { data, error } = await affiliateSupabase.from(table).select("*").limit(200);

  if (error) {
    if (import.meta.env.DEV) {
      console.error("[affiliate] lookup failed", { table, ref, error });
    }
    return null;
  }

  return findReferralMatch(Array.isArray(data) ? data : [], ref) ?? null;
};

const getAffiliateIdFromMatch = (match: RecordLike | null) => {
  if (!match) return null;
  if (typeof match.affiliate_id === "string") return match.affiliate_id;
  if (typeof match.id === "string") return match.id;
  return null;
};

const buildClickPayloads = (match: RecordLike | null, ref: string, metadata: Record<string, unknown>) => {
  const referralLinkId =
    typeof match?.id === "string" ? match.id : typeof match?.referral_link_id === "string" ? match.referral_link_id : null;
  const affiliateId =
    typeof match?.affiliate_id === "string" ? match.affiliate_id : typeof match?.id === "string" ? match.id : null;

  return [
    {
      referral_link_id: referralLinkId,
      affiliate_id: affiliateId,
      referral_code: ref,
      slug: ref,
      metadata,
      landing_path: metadata.landingPath,
      referrer_url: metadata.referrerUrl,
      user_agent: metadata.userAgent,
    },
    {
      referral_link_id: referralLinkId,
      affiliate_id: affiliateId,
      referral_code: ref,
      metadata,
    },
    {
      referral_link_id: referralLinkId,
      affiliate_id: affiliateId,
      slug: ref,
      metadata,
    },
    {
      referral_link_id: referralLinkId,
      affiliate_id: affiliateId,
      code: ref,
      metadata,
    },
    {
      referral_link_id: referralLinkId,
      affiliate_id: affiliateId,
      metadata,
    },
    {
      referral_link_id: referralLinkId,
      affiliate_id: affiliateId,
    },
  ].filter((payload) => Object.values(payload).some((value) => value !== null && value !== undefined));
};

const insertAffiliateClick = async (payloads: Record<string, unknown>[]) => {
  let lastError: unknown = null;

  for (const payload of payloads) {
    const { error } = await affiliateSupabase.from("affiliate_clicks").insert(payload);
    if (!error) return true;
    lastError = error;
  }

  if (import.meta.env.DEV && lastError) {
    console.error("[affiliate] click insert failed", lastError);
  }

  return false;
};

export const trackAffiliateClick = async (ref: string, metadata: Record<string, unknown> = {}) => {
  const normalizedRef = normalizeReferral(ref);
  if (!normalizedRef) return false;

  storeReferral(normalizedRef);

  const enrichedMetadata = {
    source: metadata.source ?? "web",
    landingPath:
      metadata.landingPath ??
      (typeof window !== "undefined"
        ? `${window.location.pathname}${window.location.search}${window.location.hash}`
        : null),
    referrerUrl: metadata.referrerUrl ?? (typeof document !== "undefined" ? document.referrer || null : null),
    userAgent: metadata.userAgent ?? (typeof navigator !== "undefined" ? navigator.userAgent : null),
    capturedAt: metadata.capturedAt ?? new Date().toISOString(),
    ...metadata,
  };

  const referralLinkMatch = await resolveAffiliateRecord("referral_links", normalizedRef);
  const affiliateMatch = referralLinkMatch ? null : await resolveAffiliateRecord("affiliates", normalizedRef);
  const payloads = buildClickPayloads(referralLinkMatch ?? affiliateMatch, normalizedRef, enrichedMetadata);

  await insertAffiliateClick(payloads);
  return true;
};

export const appendReferralToUrl = (url: string, ref: string | null | undefined) => {
  const normalizedRef = normalizeReferral(ref);
  if (!url || !normalizedRef) return url;

  try {
    const resolvedUrl = new URL(url);
    resolvedUrl.searchParams.set("ref", normalizedRef);
    return resolvedUrl.toString();
  } catch {
    return url;
  }
};

export const getStoreLink = (baseUrl: string | null | undefined) =>
  appendReferralToUrl(baseUrl ?? "", getStoredReferral());

export const captureReferral = async (ref: string, metadata: Record<string, unknown> = {}) => {
  const normalizedRef = normalizeReferral(ref);
  if (!normalizedRef) return false;

  return trackAffiliateClick(normalizedRef, metadata);
};

export const detectAffiliatePlatform = () => {
  if (typeof navigator === "undefined") return "web";

  const userAgent = navigator.userAgent.toLowerCase();
  if (userAgent.includes("android")) return "android";
  if (userAgent.includes("iphone") || userAgent.includes("ipad") || userAgent.includes("ipod")) return "ios";
  return "web";
};

const updateProfileAffiliate = async (userId: string, affiliateId: string) => {
  const payloads = [
    { affiliate_id: affiliateId },
    { affiliate_id: affiliateId, updated_at: new Date().toISOString() },
  ];

  let lastError: unknown = null;

  for (const payload of payloads) {
    const { error } = await affiliateSupabase.from("profiles").update(payload).eq("user_id", userId);
    if (!error) return true;
    lastError = error;
  }

  if (import.meta.env.DEV && lastError) {
    console.error("[affiliate] profile affiliate update failed", { userId, affiliateId, error: lastError });
  }

  return false;
};

const insertAffiliateInstall = async (userId: string, affiliateId: string, platform: string, referralCode: string) => {
  const payloads = [
    { user_id: userId, affiliate_id: affiliateId, platform, referral_code: referralCode },
    { user_id: userId, affiliate_id: affiliateId, platform },
    { user_id: userId, affiliate_id: affiliateId },
  ];

  let lastError: unknown = null;

  for (const payload of payloads) {
    const { error } = await affiliateSupabase.from("affiliate_installs").insert(payload);
    if (!error) return true;

    const message = typeof (error as { message?: unknown })?.message === "string" ? (error as { message: string }).message.toLowerCase() : "";
    if (message.includes("duplicate") || message.includes("unique")) {
      return true;
    }

    lastError = error;
  }

  if (import.meta.env.DEV && lastError) {
    console.error("[affiliate] install insert failed", { userId, affiliateId, platform, error: lastError });
  }

  return false;
};

export const attributeAffiliateInstall = async (input: {
  userId: string;
  referralCode: string;
  platform?: string;
}) => {
  try {
    const normalizedRef = normalizeReferral(input.referralCode);
    if (!normalizedRef) return { ok: false, reason: "missing-referral" as const };

    storeReferral(normalizedRef);
    storePendingReferralCode(normalizedRef);

    const referralLinkMatch = await resolveAffiliateRecord("referral_links", normalizedRef);
    const affiliateMatch = referralLinkMatch ? null : await resolveAffiliateRecord("affiliates", normalizedRef);
    const affiliateId = getAffiliateIdFromMatch(referralLinkMatch) ?? getAffiliateIdFromMatch(affiliateMatch);

    if (!affiliateId) {
      return { ok: false, reason: "invalid-referral" as const };
    }

    await updateProfileAffiliate(input.userId, affiliateId);
    await insertAffiliateInstall(input.userId, affiliateId, input.platform ?? detectAffiliatePlatform(), normalizedRef);
    clearPendingReferralCode();

    return { ok: true, affiliateId };
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error("[affiliate] attribution failed", {
        userId: input.userId,
        referralCode: input.referralCode,
        error,
      });
    }

    return { ok: false, reason: "attribution-failed" as const };
  }
};
