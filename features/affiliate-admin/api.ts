import { supabase } from "../../lib/supabase/client";
import type {
  AffiliateDashboardClickEvent,
  AffiliateCommissionRow,
  AffiliateDashboardData,
  AffiliateDashboardRow,
  AffiliateDashboardInstallEvent,
  AffiliateDashboardPayoutEvent,
  AffiliateDashboardPurchaseEvent,
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

export function generateAffiliateSlug(value: string) {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || "livewithms-partner";
}

export function generateAffiliatePromoCode(value: string) {
  const normalized = value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "");

  return normalized.slice(0, 18) || "LIVEWITHMS";
}

function buildInviteMessage(input: {
  referralLink: string;
  promoCode: string | null;
  commissionPercent: number | null;
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

function getAffiliateHandle(record: RecordLike) {
  return getFirstText(record, [
    "instagram_handle",
    "tiktok_handle",
    "social_handle",
    "handle",
    "creator_handle",
  ]);
}

function getAffiliateCommissionPercent(record: RecordLike) {
  return getFirstNumber(record, ["commission_percent", "commission_rate", "percentage"]);
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
      const commissionPercent = getAffiliateCommissionPercent(row);
      const pendingCommission = Number(((pendingSums.get(id) ?? 0)).toFixed(2));
      const paidCommission = Number(((paidSums.get(id) ?? 0)).toFixed(2));
      const lifetimeCommission = Number((pendingCommission + paidCommission).toFixed(2));
      const clicks = clickCounts.get(id) ?? 0;
      const installs = installCounts.get(id) ?? 0;
      const referralLink = buildReferralLink(referralSlug, promoCode);

      const item: AffiliateDashboardRow = {
        id,
        name: getAffiliateName(row),
        email: getFirstText(row, ["email"]),
        handle: getAffiliateHandle(row),
        createdAt: getFirstText(row, ["created_at"]),
        commissionPercent,
        promoCode,
        referralSlug,
        referralLink,
        inviteMessage: buildInviteMessage({
          referralLink,
          promoCode,
          commissionPercent,
        }),
        clicks,
        installs,
        pendingCommission,
        paidCommission,
        lifetimeCommission,
        conversionRate: clicks > 0 ? Number(((installs / clicks) * 100).toFixed(1)) : null,
        pendingCommissionCount: pendingCounts.get(id) ?? 0,
        paidCommissionCount: paidCounts.get(id) ?? 0,
        status: getAffiliateStatus(row),
      };

      return item;
    })
    .filter((row): row is AffiliateDashboardRow => Boolean(row))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function buildAffiliateNameMap(affiliates: AffiliateDashboardRow[]) {
  return new Map(affiliates.map((affiliate) => [affiliate.id, affiliate.name]));
}

function buildClickEvents(input: {
  clickRows: RecordLike[];
  referralLinkRows: RecordLike[];
  affiliates: AffiliateDashboardRow[];
}) {
  const affiliateIdByReferralLinkId = new Map<string, string>();

  for (const row of input.referralLinkRows) {
    const affiliateId = asText(row.affiliate_id);
    const linkId = asText(row.id);
    if (affiliateId && linkId) {
      affiliateIdByReferralLinkId.set(linkId, affiliateId);
    }
  }

  const affiliateNameById = buildAffiliateNameMap(input.affiliates);

  return input.clickRows
    .map((row): AffiliateDashboardClickEvent | null => {
      const id = asText(row.id);
      if (!id) {
        return null;
      }

      const affiliateId = asText(row.affiliate_id) ?? affiliateIdByReferralLinkId.get(asText(row.referral_link_id) ?? "") ?? null;

      return {
        id,
        affiliateId,
        affiliateName: affiliateId ? affiliateNameById.get(affiliateId) ?? "Unknown affiliate" : "Unknown affiliate",
        slug: getFirstText(row, ["slug"]),
        source: getFirstText(row, ["source"]),
        medium: getFirstText(row, ["medium"]),
        campaign: getFirstText(row, ["campaign"]),
        referrer: getFirstText(row, ["referrer", "referrer_url"]),
        createdAt: getFirstText(row, ["created_at"]),
      };
    })
    .filter((row): row is AffiliateDashboardClickEvent => Boolean(row))
    .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
}

function buildInstallEvents(input: {
  installRows: RecordLike[];
  affiliates: AffiliateDashboardRow[];
}) {
  const affiliateNameById = buildAffiliateNameMap(input.affiliates);

  return input.installRows
    .map((row): AffiliateDashboardInstallEvent | null => {
      const id = asText(row.id);
      if (!id) {
        return null;
      }

      const affiliateId = asText(row.affiliate_id);

      return {
        id,
        affiliateId,
        affiliateName: affiliateId ? affiliateNameById.get(affiliateId) ?? "Unknown affiliate" : "Unknown affiliate",
        platform: getFirstText(row, ["platform"]),
        referralCode: getFirstText(row, ["referral_code"]),
        createdAt: getFirstText(row, ["created_at"]),
      };
    })
    .filter((row): row is AffiliateDashboardInstallEvent => Boolean(row))
    .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
}

function buildPurchaseEvents(input: {
  commissionRows: RecordLike[];
  affiliates: AffiliateDashboardRow[];
}) {
  const affiliateNameById = buildAffiliateNameMap(input.affiliates);

  return input.commissionRows
    .map((row): AffiliateDashboardPurchaseEvent | null => {
      const id = asText(row.id);
      if (!id) {
        return null;
      }

      const affiliateId = asText(row.affiliate_id);

      return {
        id,
        affiliateId,
        affiliateName: affiliateId ? affiliateNameById.get(affiliateId) ?? "Unknown affiliate" : "Unknown affiliate",
        userId: getFirstText(row, ["user_id"]),
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
      };
    })
    .filter((row): row is AffiliateDashboardPurchaseEvent => Boolean(row))
    .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
}

function buildPayoutEvents(input: {
  payoutRows: RecordLike[];
  affiliates: AffiliateDashboardRow[];
}) {
  const affiliateNameById = buildAffiliateNameMap(input.affiliates);

  return input.payoutRows
    .map((row): AffiliateDashboardPayoutEvent | null => {
      const id = asText(row.id);
      if (!id) {
        return null;
      }

      const affiliateId = asText(row.affiliate_id);

      return {
        id,
        affiliateId,
        affiliateName: affiliateId ? affiliateNameById.get(affiliateId) ?? "Unknown affiliate" : "Unknown affiliate",
        amount: getFirstNumber(row, ["amount", "payout_amount"]) ?? 0,
        currency: getCurrency(row),
        status: getFirstText(row, ["status"]) ?? "paid",
        createdAt: getFirstText(row, ["created_at"]),
        paidAt: getFirstText(row, ["paid_at", "processed_at", "created_at"]),
      };
    })
    .filter((row): row is AffiliateDashboardPayoutEvent => Boolean(row))
    .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
}

export async function fetchAffiliateDashboard(): Promise<AffiliateDashboardData> {
  const [affiliateRows, referralLinkRows, clickRows, installRows, commissionRows, payoutRows] = await Promise.all([
    selectAll("affiliates"),
    selectAll("referral_links"),
    selectAll("affiliate_clicks"),
    selectAll("affiliate_installs"),
    selectAll("commissions"),
    selectAll("affiliate_payouts"),
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
  const totalLifetimeCommission = affiliates.reduce((sum, affiliate) => sum + affiliate.lifetimeCommission, 0);
  const totalClicks = affiliates.reduce((sum, affiliate) => sum + affiliate.clicks, 0);
  const totalInstalls = affiliates.reduce((sum, affiliate) => sum + affiliate.installs, 0);
  const pendingCommissionCount = affiliates.reduce((sum, affiliate) => sum + affiliate.pendingCommissionCount, 0);
  const paidCommissionCount = affiliates.reduce((sum, affiliate) => sum + affiliate.paidCommissionCount, 0);
  const clickEvents = buildClickEvents({
    clickRows,
    referralLinkRows,
    affiliates,
  });
  const installEvents = buildInstallEvents({
    installRows,
    affiliates,
  });
  const purchaseEvents = buildPurchaseEvents({
    commissionRows,
    affiliates,
  });
  const payoutEvents = buildPayoutEvents({
    payoutRows,
    affiliates,
  });

  return {
    summary: {
      totalAffiliates: affiliates.length,
      totalClicks,
      totalInstalls,
      totalPendingCommission: Number(totalPendingCommission.toFixed(2)),
      totalPaidCommission: Number(totalPaidCommission.toFixed(2)),
      totalLifetimeCommission: Number(totalLifetimeCommission.toFixed(2)),
      pendingCommissionCount,
      paidCommissionCount,
    },
    affiliates,
    clickEvents,
    installEvents,
    purchaseEvents,
    payoutEvents,
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

async function saveAffiliateUser(input: {
  affiliateId: string;
  email: string;
}) {
  const normalizedEmail = input.email.trim().toLowerCase();
  if (!normalizedEmail) {
    return;
  }

  const affiliateUserRows = await selectAll("affiliate_users");
  const existingRow = affiliateUserRows.find((row) => asText(row.affiliate_id) === input.affiliateId);
  const existingEmail = existingRow ? normalizeCode(asText(existingRow.email)) : "";
  const emailChanged = Boolean(existingRow) && existingEmail !== normalizedEmail;
  const primaryUpdatePayload: Record<string, unknown> = {
    email: normalizedEmail,
    updated_at: new Date().toISOString(),
  };

  if (emailChanged) {
    primaryUpdatePayload.user_id = null;
  }

  const updatePayloads = [
    primaryUpdatePayload,
    { email: normalizedEmail },
  ];
  const insertPayloads = [
    { affiliate_id: input.affiliateId, email: normalizedEmail, updated_at: new Date().toISOString() },
    { affiliate_id: input.affiliateId, email: normalizedEmail },
  ];

  if (existingRow && asText(existingRow.id)) {
    await updateWithFallback("affiliate_users", asText(existingRow.id) ?? "", updatePayloads);
    return;
  }

  await insertWithFallback("affiliate_users", insertPayloads);
}

export async function saveAffiliate(input: AffiliateFormInput) {
  const name = input.name.trim();
  const email = input.email.trim();
  const handle = input.handle.trim();
  const commissionPercentValue = input.commissionPercent.trim();
  const commissionPercent = commissionPercentValue ? Number(commissionPercentValue) : null;
  const promoCode = normalizeCode(input.promoCode);
  const status = input.status.trim() || "active";
  const now = new Date().toISOString();

  if (!name) {
    throw new Error("Affiliate name is required.");
  }

  if (!promoCode) {
    throw new Error("Promo code is required.");
  }

  if (commissionPercentValue && !Number.isFinite(commissionPercent)) {
    throw new Error("Commission % must be a valid number.");
  }

  const richAffiliatePayload = {
    name,
    email: email || null,
    instagram_handle: handle || null,
    commission_percent: commissionPercent,
    promo_code: promoCode,
    status,
    updated_at: now,
  };

  const basicAffiliatePayload = {
    name,
    email: email || null,
    promo_code: promoCode,
    status,
    updated_at: now,
  };

  if (input.id) {
    const affiliate = await updateWithFallback("affiliates", input.id, [
      richAffiliatePayload,
      { ...richAffiliatePayload, updated_at: undefined },
      basicAffiliatePayload,
      { ...basicAffiliatePayload, updated_at: undefined },
      { name, email: email || null, promo_code: promoCode },
    ]);

    const referralLinkRows = await selectAll("referral_links");
    const existingLink = referralLinkRows.find((row) => asText(row.affiliate_id) === input.id);
    await saveReferralLink({
      affiliateId: input.id,
      existingLinkId: asText(existingLink?.id),
      referralSlug: input.referralSlug || promoCode,
    });
    await saveAffiliateUser({
      affiliateId: input.id,
      email,
    });

    return affiliate;
  }

  const insertedAffiliate = await insertWithFallback("affiliates", [
    richAffiliatePayload,
    { ...richAffiliatePayload, updated_at: undefined },
    basicAffiliatePayload,
    { ...basicAffiliatePayload, updated_at: undefined },
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
  await saveAffiliateUser({
    affiliateId,
    email,
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
