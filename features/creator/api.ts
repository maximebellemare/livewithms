import { supabase } from "../../lib/supabase/client";
import type {
  CreatorAccess,
  CreatorClickEvent,
  CreatorCommissionEvent,
  CreatorDashboardData,
  CreatorPayoutEvent,
} from "./types";

type RecordLike = Record<string, unknown>;
type DynamicSupabaseQuery = {
  eq: (column: string, value: unknown) => DynamicSupabaseQuery;
  order: (column: string, options?: { ascending?: boolean }) => DynamicSupabaseQuery;
  limit: (count: number) => Promise<{ data: unknown[] | null; error: unknown }>;
  maybeSingle: () => Promise<{ data: RecordLike | null; error: unknown }>;
  select: (query: string) => DynamicSupabaseQuery;
  update: (payload: Record<string, unknown>) => DynamicSupabaseQuery;
};
type DynamicSupabaseTable = {
  select: (query: string) => DynamicSupabaseQuery;
  update: (payload: Record<string, unknown>) => DynamicSupabaseQuery;
};
type DynamicSupabaseClient = {
  from: (table: string) => DynamicSupabaseTable;
};

const creatorSupabase = supabase as unknown as DynamicSupabaseClient;
const LIVEWITHMS_BASE_URL = "https://www.livewithms.com";

function isRecordLike(value: unknown): value is RecordLike {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function ensureArray(value: unknown) {
  return Array.isArray(value) ? value.filter(isRecordLike) : [];
}

function asText(value: unknown) {
  return typeof value === "string" ? value : null;
}

function asNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

function getFirstText(record: RecordLike, keys: string[]) {
  for (const key of keys) {
    const value = asText(record[key]);
    if (value && value.trim()) {
      return value.trim();
    }
  }

  return null;
}

function getFirstNumber(record: RecordLike, keys: string[]) {
  for (const key of keys) {
    const value = asNumber(record[key]);
    if (value !== null) {
      return value;
    }
  }

  return null;
}

function normalizeCode(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

function buildReferralLink(slug: string | null, promoCode: string | null) {
  const code = normalizeCode(slug ?? promoCode);
  return code ? `${LIVEWITHMS_BASE_URL}/?ref=${encodeURIComponent(code)}` : LIVEWITHMS_BASE_URL;
}

function buildInviteMessage(input: {
  referralLink: string;
  promoCode: string | null;
}) {
  return [
    "Welcome to the LiveWithMS Creator Program ❤️",
    "",
    `Your creator code is: ${input.promoCode ?? "—"}`,
    "",
    "Your referral link is:",
    input.referralLink,
    "",
    "When someone joins LiveWithMS using your code and starts a subscription, you’ll earn commission.",
    "",
    "You can log into the LiveWithMS app with this email to view your Creator Dashboard.",
  ].join("\n");
}

async function selectSingleByEmail(email: string) {
  const { data, error } = await creatorSupabase
    .from("affiliate_users")
    .select("*")
    .eq("email", email)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return isRecordLike(data) ? data : null;
}

async function selectSingleByUserId(userId: string) {
  const { data, error } = await creatorSupabase
    .from("affiliate_users")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return isRecordLike(data) ? data : null;
}

async function selectAll(table: string, affiliateId?: string) {
  const query = creatorSupabase.from(table).select("*");
  const { data, error } = affiliateId
    ? await query.eq("affiliate_id", affiliateId).limit(1000)
    : await query.limit(1000);

  if (error) {
    throw error;
  }

  return ensureArray(data);
}

export async function ensureCreatorAffiliateLink(userId?: string | null, email?: string | null) {
  const normalizedEmail = email?.trim().toLowerCase() ?? "";
  if (!userId || !normalizedEmail) {
    return null;
  }

  try {
    const existingByUserId = await selectSingleByUserId(userId);
    if (existingByUserId) {
      return {
        affiliateUserId: asText(existingByUserId.id) ?? "",
        affiliateId: asText(existingByUserId.affiliate_id) ?? "",
        email: getFirstText(existingByUserId, ["email"]) ?? normalizedEmail,
        linkedUserId: asText(existingByUserId.user_id),
      } satisfies CreatorAccess;
    }

    const existingByEmail = await selectSingleByEmail(normalizedEmail);
    if (!existingByEmail) {
      return null;
    }

    const affiliateUserId = asText(existingByEmail.id);
    const affiliateId = asText(existingByEmail.affiliate_id);
    if (!affiliateUserId || !affiliateId) {
      return null;
    }

    if (asText(existingByEmail.user_id) === userId) {
      return {
        affiliateUserId,
        affiliateId,
        email: getFirstText(existingByEmail, ["email"]) ?? normalizedEmail,
        linkedUserId: userId,
      };
    }

    const { data, error } = await creatorSupabase
      .from("affiliate_users")
      .update({
        user_id: userId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", affiliateUserId)
      .select("*")
      .maybeSingle();

    if (error) {
      console.error("[creator] affiliate user link failed", {
        userId,
        email: normalizedEmail,
        error,
      });
      throw error;
    }

    const linked = isRecordLike(data) ? data : existingByEmail;
    console.log("[creator] affiliate user linked", {
      userId,
      email: normalizedEmail,
      affiliateId,
    });

    return {
      affiliateUserId,
      affiliateId,
      email: getFirstText(linked, ["email"]) ?? normalizedEmail,
      linkedUserId: asText(linked.user_id),
    };
  } catch (error) {
    console.error("[creator] affiliate link lookup failed", {
      userId,
      email: normalizedEmail,
      error,
    });
    return null;
  }
}

export async function fetchCreatorAccess(userId?: string | null, email?: string | null) {
  return ensureCreatorAffiliateLink(userId, email);
}

export async function fetchCreatorDashboard(userId?: string | null, email?: string | null): Promise<CreatorDashboardData | null> {
  const access = await ensureCreatorAffiliateLink(userId, email);
  if (!access?.affiliateId) {
    return null;
  }

  const affiliateId = access.affiliateId;

  const { data: affiliateRow, error: affiliateError } = await creatorSupabase
    .from("affiliates")
    .select("*")
    .eq("id", affiliateId)
    .maybeSingle();

  if (affiliateError) {
    throw affiliateError;
  }

  if (!isRecordLike(affiliateRow)) {
    return null;
  }

  const [referralLinks, clickRows, installRows, commissionRows, payoutRows] = await Promise.all([
    selectAll("referral_links", affiliateId),
    selectAll("affiliate_clicks"),
    selectAll("affiliate_installs", affiliateId),
    selectAll("commissions", affiliateId),
    selectAll("affiliate_payouts", affiliateId),
  ]);

  const primaryReferralLink = referralLinks[0] ?? null;
  const promoCode = getFirstText(affiliateRow, ["promo_code", "code", "referral_code", "slug"]);
  const referralSlug = primaryReferralLink
    ? getFirstText(primaryReferralLink, ["slug", "code", "referral_code", "path_slug", "ref"])
    : promoCode;
  const referralLink = buildReferralLink(referralSlug, promoCode);

  const recentClicks = clickRows
    .map((row): CreatorClickEvent | null => {
      const id = asText(row.id);
      if (!id) return null;
      return {
        id,
        slug: getFirstText(row, ["slug"]),
        source: getFirstText(row, ["source"]),
        medium: getFirstText(row, ["medium"]),
        campaign: getFirstText(row, ["campaign"]),
        referrer: getFirstText(row, ["referrer", "referrer_url"]),
        createdAt: getFirstText(row, ["created_at"]),
      };
    })
    .filter((row): row is CreatorClickEvent => Boolean(row))
    .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""))
    .slice(0, 10);

  const recentCommissions = commissionRows
    .map((row): CreatorCommissionEvent | null => {
      const id = asText(row.id);
      if (!id) return null;
      return {
        id,
        amount: getFirstNumber(row, ["amount", "price_in_purchased_currency"]) ?? 0,
        commission: getFirstNumber(row, ["commission", "commission_amount"]) ?? 0,
        currency: getFirstText(row, ["currency", "currency_code"])?.toUpperCase() ?? "USD",
        status: getFirstText(row, ["status"]) ?? "pending",
        revenuecatTransactionId: getFirstText(row, ["revenuecat_transaction_id", "transaction_id", "store_transaction_id"]),
        createdAt: getFirstText(row, ["created_at"]),
        paidAt: getFirstText(row, ["paid_at", "updated_at"]),
      };
    })
    .filter((row): row is CreatorCommissionEvent => Boolean(row))
    .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""))
    .slice(0, 10);

  const payouts = payoutRows
    .map((row): CreatorPayoutEvent | null => {
      const id = asText(row.id);
      if (!id) return null;
      return {
        id,
        amount: getFirstNumber(row, ["amount", "payout_amount"]) ?? 0,
        currency: getFirstText(row, ["currency", "currency_code"])?.toUpperCase() ?? "USD",
        status: getFirstText(row, ["status"]) ?? "paid",
        createdAt: getFirstText(row, ["created_at"]),
        paidAt: getFirstText(row, ["paid_at", "processed_at", "created_at"]),
        notes: getFirstText(row, ["notes", "memo", "description"]),
      };
    })
    .filter((row): row is CreatorPayoutEvent => Boolean(row))
    .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));

  const pendingCommission = Number(
    recentCommissions
      .filter((row) => row.status.toLowerCase() !== "paid")
      .reduce((sum, row) => sum + row.commission, 0)
      .toFixed(2),
  );

  const paidCommission = Number(
    recentCommissions
      .filter((row) => row.status.toLowerCase() === "paid")
      .reduce((sum, row) => sum + row.commission, 0)
      .toFixed(2),
  );

  const allCommissionRows = commissionRows
    .map((row) => ({
      commission: getFirstNumber(row, ["commission", "commission_amount"]) ?? 0,
      status: (getFirstText(row, ["status"]) ?? "pending").toLowerCase(),
      userId: getFirstText(row, ["user_id"]),
    }));
  const pendingCommissionAll = Number(
    allCommissionRows
      .filter((row) => row.status !== "paid")
      .reduce((sum, row) => sum + row.commission, 0)
      .toFixed(2),
  );
  const paidCommissionAll = Number(
    allCommissionRows
      .filter((row) => row.status === "paid")
      .reduce((sum, row) => sum + row.commission, 0)
      .toFixed(2),
  );

  return {
    affiliateId,
    name: getFirstText(affiliateRow, ["name", "display_name", "full_name"]) ?? "Creator",
    email: getFirstText(affiliateRow, ["email"]),
    handle: getFirstText(affiliateRow, ["instagram_handle", "tiktok_handle", "social_handle", "handle"]),
    status: getFirstText(affiliateRow, ["status", "state"]) ?? "active",
    promoCode,
    referralSlug,
    referralLink,
    commissionPercent: getFirstNumber(affiliateRow, ["commission_percent", "commission_rate", "percentage"]),
    totalClicks: clickRows.length,
    totalInstalls: installRows.length,
    premiumSubscribers: new Set(allCommissionRows.map((row) => row.userId).filter((value): value is string => Boolean(value))).size || commissionRows.length,
    pendingCommission: pendingCommissionAll,
    paidCommission: paidCommissionAll,
    lifetimeCommission: Number((pendingCommissionAll + paidCommissionAll).toFixed(2)),
    recentClicks,
    recentCommissions,
    payouts,
    inviteMessage: buildInviteMessage({
      referralLink,
      promoCode,
    }),
  };
}
