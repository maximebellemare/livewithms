export type AffiliateDashboardSummary = {
  totalAffiliates: number;
  totalClicks: number;
  totalInstalls: number;
  totalPendingCommission: number;
  totalPaidCommission: number;
  pendingCommissionCount: number;
  paidCommissionCount: number;
};

export type AffiliateDashboardRow = {
  id: string;
  name: string;
  email: string | null;
  promoCode: string | null;
  referralSlug: string | null;
  referralLink: string;
  clicks: number;
  installs: number;
  pendingCommission: number;
  paidCommission: number;
  pendingCommissionCount: number;
  paidCommissionCount: number;
  status: string;
};

export type AffiliateDashboardData = {
  summary: AffiliateDashboardSummary;
  affiliates: AffiliateDashboardRow[];
};

export type AffiliateFormInput = {
  id?: string;
  name: string;
  email: string;
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
