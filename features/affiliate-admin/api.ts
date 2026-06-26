import { supabase } from "../../lib/supabase/client";
import type {
  AffiliateCommissionRow,
  AffiliateDashboardData,
  AffiliateDashboardRow,
  AffiliateDetailData,
  AffiliateFormInput,
  AffiliatePayoutRow,
} from "./types";

type RecordLike = Record<string, unknown>;
type QueryResult<T = unknown> = Promise<{ data: T; error: unknown }>;
type DynamicSupabaseQuery = {
  eq: (column: string, value: unknown) => DynamicSupabaseQuery;
  order: (column: string, options?: { ascending?: boolean }) => DynamicSupabaseQuery;
  limit: (count: number) => QueryResult<unknown[] | null>;
  maybeSingle: () => QueryResult<RecordLike | null>;
  select: (query: string) => DynamicSupabaseQuery;
};
type DynamicSupabaseTable = {
  select: (query: string) => DynamicSupabaseQuery;
  insert: (payload: Record<string, unknown>) => DynamicSupabaseQuery;
  update: (payload: Record<string, unknown>) => DynamicSupabaseQuery;
};
type DynamicSupabaseClient = {
  from: (table: string) => DynamicSupabaseTable;
};

const affiliateSupabase = supabase as unknown as DynamicSupabaseClient;
const LIVEWITHMS_BASE_URL = "https://www.livewithms.com";

function normalizeCode(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

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
    if (value && value.trim().length > 0) {
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

function getAffiliateName(record: RecordLike) {
  return (
    getFirstText(record, ["name", "display_name", "full_name", "affiliate_name"]) ??
    "Unnamed affiliate"
  );
}

function getAffiliateStatus(record: RecordLike) {
  return getFirstText(record, ["status", "state"]) ?? "active";
}

function getAffiliatePromoCode(record: RecordLike) {
  return getFirstText(record, ["promo_code", "code", "referral_code", "slug"]);
}

function getReferralSlug(record: RecordLike) {
  return getFirstText(record, ["slug", "code", "referral_code", "short_code", "handle", "path_slug", "ref"]);
}

function buildReferralLink(slug: string | null, promoCode: string | null) {
  const code = normalizeCode(slug ?? promoCode);
  return code ? `${LIVEWITHMS_BASE_URL}/?ref=${encodeURIComponent(code)}` : LIVEWITHMS_BASE_URL;
}

function getCurrency(record: RecordLike) {
  return getFirstText(record, ["currency", "currency_code"])?.toUpperCase() ?? "USD";
}

async function selectAll(table: string) {
  const { data, error } = await affiliateSupabase
    .from(table)
    .select("*")
    .limit(1000);

  if (error) {
    throw error;
  }

  return ensureArray(data);
}

function buildDashboardRows(input: {
  affiliateRows: RecordLike[];
  referralLinkRows: RecordLike[];
  clickRows: RecordLike[];
  installRows: RecordLike[];
  commissionRows: RecordLike[];
}) {
  const referralLinksByAffiliateId = new Map<string, RecordLike[]>();
  const affiliateIdByReferralLinkId = new Map<string, string>();

  for (const row of input.referralLinkRows) {
    const affiliateId = asText(row.affiliate_id);
    const linkId = asText(row.id);
    if (affiliateId) {
      const list = referralLinksByAffiliateId.get(affiliateId) ?? [];
      list.push(row);
      referralLinksByAffiliateId.set(affiliateId, list);
    }
    if (affiliateId && linkId) {
      affiliateIdByReferralLinkId.set(linkId, affiliateId);
    }
  }

  const clickCounts = new Map<string, number>();
  const installCounts = new Map<string, number>();
  const pendingSums = new Map<string, number>();
  const paidSums = new Map<string, number>();
  const pendingCounts = new Map<string, number>();
  const paidCounts = new Map<string, number>();

  for (const row of input.clickRows) {
    const affiliateId = asText(row.affiliate_id) ?? affiliateIdByReferralLinkId.get(asText(row.referral_link_id) ?? "");
    if (!affiliateId) {
      continue;
    }
    clickCounts.set(affiliateId, (clickCounts.get(affiliateId) ?? 0) + 1);
  }

  for (const row of input.installRows) {
    const affiliateId = asText(row.affiliate_id);
    if (!affiliateId) {
      continue;
    }
    installCounts.set(affiliateId, (installCounts.get(affiliateId) ?? 0) + 1);
  }

  for (const row of input.commissionRows) {
    const affiliateId = asText(row.affiliate_id);
    if (!affiliateId) {
      continue;
    }

    const commissionValue = getFirstNumber(row, ["commission", "commission_amount", "amount"]) ?? 0;
    const normalizedStatus = normalizeCode(getFirstText(row, ["status"]) ?? "pending");

    if (normalizedStatus === "paid") {
      paidSums.set(affiliateId, (paidSums.get(affiliateId) ?? 0) + commissionValue);
      paidCounts.set(affiliateId, (paidCounts.get(affiliateId) ?? 0) + 1);
      continue;
    }

    pendingSums.set(affiliateId, (pendingSums.get(affiliateId) ?? 0) + commissionValue);
    pendingCounts.set(affiliateId, (pendingCounts.get(affiliateId) ?? 0) + 1);
  }

  return input.affiliateRows
    .map((row) => {
      const id = asText(row.id);
      if (!id) {
        return null;
      }

      const referralLinks = referralLinksByAffiliateId.get(id) ?? [];
      const primaryReferralLink = referralLinks[0] ?? null;
      const promoCode = getAffiliatePromoCode(row);
      const referralSlug = primaryReferralLink ? getReferralSlug(primaryReferralLink) : promoCode;

      const item: AffiliateDashboardRow = {
        id,
        name: getAffiliateName(row),
        email: getFirstText(row, ["email"]),
        promoCode,
        referralSlug,
        referralLink: buildReferralLink(referralSlug, promoCode),
        clicks: clickCounts.get(id) ?? 0,
        installs: installCounts.get(id) ?? 0,
        pendingCommission: Number(((pendingSums.get(id) ?? 0)).toFixed(2)),
        paidCommission: Number(((paidSums.get(id) ?? 0)).toFixed(2)),
        pendingCommissionCount: pendingCounts.get(id) ?? 0,
        paidCommissionCount: paidCounts.get(id) ?? 0,
        status: getAffiliateStatus(row),
      };

      return item;
    })
    .filter((row): row is AffiliateDashboardRow => Boolean(row))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function fetchAffiliateDashboard(): Promise<AffiliateDashboardData> {
  const [affiliateRows, referralLinkRows, clickRows, installRows, commissionRows] = await Promise.all([
    selectAll("affiliates"),
    selectAll("referral_links"),
    selectAll("affiliate_clicks"),
    selectAll("affiliate_installs"),
    selectAll("commissions"),
  ]);

  const affiliates = buildDashboardRows({
    affiliateRows,
    referralLinkRows,
    clickRows,
    installRows,
    commissionRows,
  });

  const totalPendingCommission = affiliates.reduce((sum, affiliate) => sum + affiliate.pendingCommission, 0);
  const totalPaidCommission = affiliates.reduce((sum, affiliate) => sum + affiliate.paidCommission, 0);
  const totalClicks = affiliates.reduce((sum, affiliate) => sum + affiliate.clicks, 0);
  const totalInstalls = affiliates.reduce((sum, affiliate) => sum + affiliate.installs, 0);
  const pendingCommissionCount = affiliates.reduce((sum, affiliate) => sum + affiliate.pendingCommissionCount, 0);
  const paidCommissionCount = affiliates.reduce((sum, affiliate) => sum + affiliate.paidCommissionCount, 0);

  return {
    summary: {
      totalAffiliates: affiliates.length,
      totalClicks,
      totalInstalls,
      totalPendingCommission: Number(totalPendingCommission.toFixed(2)),
      totalPaidCommission: Number(totalPaidCommission.toFixed(2)),
      pendingCommissionCount,
      paidCommissionCount,
    },
    affiliates,
  };
}

function normalizeCommissionRow(row: RecordLike): AffiliateCommissionRow | null {
  const id = asText(row.id);
  if (!id) {
    return null;
  }

  return {
    id,
    amount: getFirstNumber(row, ["amount", "price_in_purchased_currency"]) ?? 0,
    commission: getFirstNumber(row, ["commission", "commission_amount"]) ?? 0,
    currency: getCurrency(row),
    status: getFirstText(row, ["status"]) ?? "pending",
    revenuecatTransactionId: getFirstText(row, [
      "revenuecat_transaction_id",
      "transaction_id",
      "store_transaction_id",
    ]),
    createdAt: getFirstText(row, ["created_at"]),
    paidAt: getFirstText(row, ["paid_at", "updated_at"]),
  };
}

function normalizePayoutRow(row: RecordLike): AffiliatePayoutRow | null {
  const id = asText(row.id);
  if (!id) {
    return null;
  }

  return {
    id,
    amount: getFirstNumber(row, ["amount", "payout_amount"]) ?? 0,
    currency: getCurrency(row),
    status: getFirstText(row, ["status"]) ?? "paid",
    createdAt: getFirstText(row, ["created_at"]),
    paidAt: getFirstText(row, ["paid_at", "processed_at", "created_at"]),
    notes: getFirstText(row, ["notes", "memo", "description"]),
  };
}

export async function fetchAffiliateDetail(affiliateId: string): Promise<AffiliateDetailData | null> {
  const [dashboard, clickRows, installRows, commissionRows, payoutRows, referralLinkRows] = await Promise.all([
    fetchAffiliateDashboard(),
    selectAll("affiliate_clicks"),
    selectAll("affiliate_installs"),
    selectAll("commissions"),
    selectAll("affiliate_payouts"),
    selectAll("referral_links"),
  ]);

  const affiliate = dashboard.affiliates.find((item) => item.id === affiliateId);
  if (!affiliate) {
    return null;
  }

  const referralLinkIds = new Set(
    referralLinkRows
      .filter((row) => asText(row.affiliate_id) === affiliateId)
      .map((row) => asText(row.id))
      .filter((value): value is string => Boolean(value)),
  );

  const affiliateClickRows = clickRows.filter((row) => {
    const clickAffiliateId = asText(row.affiliate_id);
    const referralLinkId = asText(row.referral_link_id);
    return clickAffiliateId === affiliateId || (referralLinkId ? referralLinkIds.has(referralLinkId) : false);
  });

  const clickBuckets = new Map<string, number>();
  for (const row of affiliateClickRows) {
    const createdAt = getFirstText(row, ["created_at"]);
    if (!createdAt) {
      continue;
    }

    const dateKey = createdAt.slice(0, 10);
    clickBuckets.set(dateKey, (clickBuckets.get(dateKey) ?? 0) + 1);
  }

  const clickSeries = Array.from(clickBuckets.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-14);

  const affiliateInstallRows = installRows
    .filter((row) => asText(row.affiliate_id) === affiliateId)
    .sort((a, b) => (getFirstText(b, ["created_at"]) ?? "").localeCompare(getFirstText(a, ["created_at"]) ?? ""));

  const commissions = commissionRows
    .filter((row) => asText(row.affiliate_id) === affiliateId)
    .map(normalizeCommissionRow)
    .filter((row): row is AffiliateCommissionRow => Boolean(row))
    .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));

  const payouts = payoutRows
    .filter((row) => asText(row.affiliate_id) === affiliateId)
    .map(normalizePayoutRow)
    .filter((row): row is AffiliatePayoutRow => Boolean(row))
    .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));

  return {
    affiliate,
    clickSeries,
    installs: affiliateInstallRows.length,
    latestInstallAt: getFirstText(affiliateInstallRows[0] ?? {}, ["created_at"]),
    commissions,
    payouts,
  };
}

async function insertWithFallback(table: string, payloads: Record<string, unknown>[]) {
  let lastError: unknown = null;

  for (const payload of payloads) {
    const { data, error } = await affiliateSupabase
      .from(table)
      .insert(payload)
      .select("*")
      .maybeSingle();

    if (!error) {
      return data;
    }

    lastError = error;
  }

  throw lastError;
}

async function updateWithFallback(table: string, id: string, payloads: Record<string, unknown>[]) {
  let lastError: unknown = null;

  for (const payload of payloads) {
    const { data, error } = await affiliateSupabase
      .from(table)
      .update(payload)
      .eq("id", id)
      .select("*")
      .maybeSingle();

    if (!error) {
      return data;
    }

    lastError = error;
  }

  throw lastError;
}

async function saveReferralLink(input: {
  affiliateId: string;
  existingLinkId?: string | null;
  referralSlug: string;
}) {
  const slug = normalizeCode(input.referralSlug);
  if (!slug) {
    return;
  }

  const updatePayloads = [
    { slug, updated_at: new Date().toISOString() },
    { slug },
    { code: slug, updated_at: new Date().toISOString() },
    { code: slug },
  ];

  const insertPayloads = [
    { affiliate_id: input.affiliateId, slug, status: "active", updated_at: new Date().toISOString() },
    { affiliate_id: input.affiliateId, slug, status: "active" },
    { affiliate_id: input.affiliateId, slug },
    { affiliate_id: input.affiliateId, code: slug, status: "active" },
    { affiliate_id: input.affiliateId, code: slug },
  ];

  if (input.existingLinkId) {
    await updateWithFallback("referral_links", input.existingLinkId, updatePayloads);
    return;
  }

  await insertWithFallback("referral_links", insertPayloads);
}

export async function saveAffiliate(input: AffiliateFormInput) {
  const name = input.name.trim();
  const email = input.email.trim();
  const promoCode = normalizeCode(input.promoCode);
  const status = input.status.trim() || "active";
  const now = new Date().toISOString();

  if (!name) {
    throw new Error("Affiliate name is required.");
  }

  if (!promoCode) {
    throw new Error("Promo code is required.");
  }

  if (input.id) {
    const affiliate = await updateWithFallback("affiliates", input.id, [
      { name, email: email || null, promo_code: promoCode, status, updated_at: now },
      { name, email: email || null, promo_code: promoCode, status },
      { name, email: email || null, promo_code: promoCode },
    ]);

    const referralLinkRows = await selectAll("referral_links");
    const existingLink = referralLinkRows.find((row) => asText(row.affiliate_id) === input.id);
    await saveReferralLink({
      affiliateId: input.id,
      existingLinkId: asText(existingLink?.id),
      referralSlug: input.referralSlug || promoCode,
    });

    return affiliate;
  }

  const insertedAffiliate = await insertWithFallback("affiliates", [
    { name, email: email || null, promo_code: promoCode, status, updated_at: now },
    { name, email: email || null, promo_code: promoCode, status },
    { name, email: email || null, promo_code: promoCode },
  ]);

  const affiliateId = asText(insertedAffiliate?.id);
  if (!affiliateId) {
    throw new Error("Affiliate was created, but no affiliate id was returned.");
  }

  await saveReferralLink({
    affiliateId,
    referralSlug: input.referralSlug || promoCode,
  });

  return insertedAffiliate;
}

export async function markCommissionPaid(input: {
  commissionId: string;
  affiliateId: string;
  amount: number;
  currency: string;
}) {
  const paidAt = new Date().toISOString();

  await updateWithFallback("commissions", input.commissionId, [
    { status: "paid", paid_at: paidAt, updated_at: paidAt },
    { status: "paid", paid_at: paidAt },
    { status: "paid", updated_at: paidAt },
    { status: "paid" },
  ]);

  try {
    await insertWithFallback("affiliate_payouts", [
      {
        affiliate_id: input.affiliateId,
        commission_id: input.commissionId,
        amount: input.amount,
        currency: input.currency,
        status: "paid",
        paid_at: paidAt,
        created_at: paidAt,
        updated_at: paidAt,
      },
      {
        affiliate_id: input.affiliateId,
        commission_id: input.commissionId,
        amount: input.amount,
        currency: input.currency,
        status: "paid",
        paid_at: paidAt,
      },
      {
        affiliate_id: input.affiliateId,
        amount: input.amount,
        currency: input.currency,
        status: "paid",
        paid_at: paidAt,
      },
      {
        affiliate_id: input.affiliateId,
        amount: input.amount,
        paid_at: paidAt,
      },
    ]);
  } catch (error) {
    console.error("[affiliate-admin] payout insert skipped", {
      commissionId: input.commissionId,
      affiliateId: input.affiliateId,
      error,
    });
  }
}
