export type AffiliateDashboardSummary = {
  totalAffiliates: number;
  totalClicks: number;
  totalInstalls: number;
  totalPendingCommission: number;
  totalPaidCommission: number;
  totalLifetimeCommission: number;
  pendingCommissionCount: number;
  paidCommissionCount: number;
};

export type AffiliateDashboardRow = {
  id: string;
  name: string;
  email: string | null;
  handle: string | null;
  createdAt: string | null;
  commissionPercent: number | null;
  promoCode: string | null;
  referralSlug: string | null;
  referralLink: string;
  inviteMessage: string;
  clicks: number;
  installs: number;
  pendingCommission: number;
  paidCommission: number;
  lifetimeCommission: number;
  conversionRate: number | null;
  pendingCommissionCount: number;
  paidCommissionCount: number;
  status: string;
};

export type AffiliateDashboardClickEvent = {
  id: string;
  affiliateId: string | null;
  affiliateName: string;
  slug: string | null;
  source: string | null;
  medium: string | null;
  campaign: string | null;
  referrer: string | null;
  createdAt: string | null;
};

export type AffiliateDashboardInstallEvent = {
  id: string;
  affiliateId: string | null;
  affiliateName: string;
  platform: string | null;
  referralCode: string | null;
  createdAt: string | null;
};

export type AffiliateDashboardPurchaseEvent = {
  id: string;
  affiliateId: string | null;
  affiliateName: string;
  userId: string | null;
  amount: number;
  commission: number;
  currency: string;
  status: string;
  revenuecatTransactionId: string | null;
  createdAt: string | null;
};

export type AffiliateDashboardPayoutEvent = {
  id: string;
  affiliateId: string | null;
  affiliateName: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string | null;
  paidAt: string | null;
};

export type AffiliateDashboardData = {
  summary: AffiliateDashboardSummary;
  affiliates: AffiliateDashboardRow[];
  clickEvents: AffiliateDashboardClickEvent[];
  installEvents: AffiliateDashboardInstallEvent[];
  purchaseEvents: AffiliateDashboardPurchaseEvent[];
  payoutEvents: AffiliateDashboardPayoutEvent[];
};

export type AffiliateFormInput = {
  id?: string;
  name: string;
  email: string;
  handle: string;
  commissionPercent: string;
  promoCode: string;
  referralSlug: string;
  status: string;
};

export type AffiliateClickPoint = {
  date: string;
  count: number;
};

export type AffiliateCommissionRow = {
  id: string;
  amount: number;
  commission: number;
  currency: string;
  status: string;
  revenuecatTransactionId: string | null;
  createdAt: string | null;
  paidAt: string | null;
};

export type AffiliatePayoutRow = {
  id: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string | null;
  paidAt: string | null;
  notes: string | null;
};

export type AffiliateDetailData = {
  affiliate: AffiliateDashboardRow;
  clickSeries: AffiliateClickPoint[];
  installs: number;
  latestInstallAt: string | null;
  commissions: AffiliateCommissionRow[];
  payouts: AffiliatePayoutRow[];
};
