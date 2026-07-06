export type CreatorAccess = {
  affiliateUserId: string;
  affiliateId: string;
  email: string;
  linkedUserId: string | null;
};

export type CreatorClickEvent = {
  id: string;
  slug: string | null;
  source: string | null;
  medium: string | null;
  campaign: string | null;
  referrer: string | null;
  createdAt: string | null;
};

export type CreatorCommissionEvent = {
  id: string;
  amount: number;
  commission: number;
  currency: string;
  status: string;
  revenuecatTransactionId: string | null;
  createdAt: string | null;
  paidAt: string | null;
};

export type CreatorPayoutEvent = {
  id: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string | null;
  paidAt: string | null;
  notes: string | null;
};

export type CreatorDashboardData = {
  affiliateId: string;
  name: string;
  email: string | null;
  handle: string | null;
  status: string;
  promoCode: string | null;
  referralSlug: string | null;
  referralLink: string;
  commissionPercent: number | null;
  totalClicks: number;
  totalInstalls: number;
  premiumSubscribers: number;
  pendingCommission: number;
  paidCommission: number;
  lifetimeCommission: number;
  recentClicks: CreatorClickEvent[];
  recentCommissions: CreatorCommissionEvent[];
  payouts: CreatorPayoutEvent[];
  inviteMessage: string;
};
