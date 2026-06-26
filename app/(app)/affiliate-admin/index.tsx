import { ReactNode, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Clipboard, Modal, Pressable, ScrollView, Share, StyleSheet, TextInput, View } from "react-native";
import { router } from "expo-router";
import AppButton from "../../../components/ui/AppButton";
import AppScreen from "../../../components/ui/AppScreen";
import AppText from "../../../components/ui/AppText";
import CalmSkeleton from "../../../components/ui/CalmSkeleton";
import ErrorState from "../../../components/ui/ErrorState";
import { colors, radii, shadows, spacing } from "../../../components/ui/design";
import { useIsAdmin } from "../../../features/admin/hooks";
import { useAuth } from "../../../features/auth/hooks";
import { generateAffiliatePromoCode, generateAffiliateSlug } from "../../../features/affiliate-admin/api";
import { useAffiliateDashboard, useSaveAffiliate } from "../../../features/affiliate-admin/hooks";
import type {
  AffiliateDashboardClickEvent,
  AffiliateDashboardPurchaseEvent,
  AffiliateDashboardRow,
  AffiliateFormInput,
} from "../../../features/affiliate-admin/types";
import { getErrorMessage } from "../../../lib/errors";

const EMPTY_FORM: AffiliateFormInput = {
  name: "",
  email: "",
  handle: "",
  commissionPercent: "20",
  promoCode: "",
  referralSlug: "",
  status: "active",
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function StatCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper?: string;
}) {
  return (
    <View style={styles.statCard}>
      <AppText style={styles.statLabel}>{label}</AppText>
      <AppText style={styles.statValue}>{value}</AppText>
      {helper ? <AppText style={styles.statHelper}>{helper}</AppText> : null}
    </View>
  );
}

function formatPercent(value: number | null) {
  return value === null ? "—" : `${value}%`;
}

function formatDateLabel(value: string | null) {
  if (!value) {
    return "—";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }

  return parsed.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function formatDateTimeLabel(value: string | null) {
  if (!value) {
    return "—";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }

  return parsed.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

type RangeKey = "today" | "7d" | "30d" | "lifetime";
type SortKey = "revenue" | "clicks" | "installs" | "name" | "newest";

const RANGE_OPTIONS: Array<{ key: RangeKey; label: string }> = [
  { key: "today", label: "Today" },
  { key: "7d", label: "7 Days" },
  { key: "30d", label: "30 Days" },
  { key: "lifetime", label: "Lifetime" },
];

const SORT_OPTIONS: Array<{ key: SortKey; label: string }> = [
  { key: "revenue", label: "Revenue" },
  { key: "clicks", label: "Clicks" },
  { key: "installs", label: "Installs" },
  { key: "newest", label: "Newest" },
  { key: "name", label: "Name" },
];

function getRangeStart(range: RangeKey) {
  const now = new Date();
  const start = new Date(now);

  if (range === "today") {
    start.setHours(0, 0, 0, 0);
    return start;
  }

  if (range === "7d") {
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  if (range === "30d") {
    start.setDate(start.getDate() - 29);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  return null;
}

function isWithinRange(value: string | null, range: RangeKey) {
  if (range === "lifetime") {
    return true;
  }

  if (!value) {
    return false;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return false;
  }

  const start = getRangeStart(range);
  if (!start) {
    return true;
  }

  return parsed >= start;
}

function getMonthStart() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function isOnOrAfter(value: string | null, start: Date) {
  if (!value) {
    return false;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return false;
  }

  return parsed >= start;
}

function SearchField({
  value,
  onChangeText,
}: {
  value: string;
  onChangeText: (value: string) => void;
}) {
  return (
    <View style={styles.searchCard}>
      <AppText style={styles.fieldLabel}>Search affiliates</AppText>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder="Search by name, email, handle, code, or slug"
        placeholderTextColor="#9ca3af"
        style={styles.textInput}
      />
    </View>
  );
}

function ChipGroup<T extends string>({
  label,
  options,
  selected,
  onSelect,
}: {
  label: string;
  options: Array<{ key: T; label: string }>;
  selected: T;
  onSelect: (value: T) => void;
}) {
  return (
    <View style={styles.chipGroup}>
      <AppText style={styles.fieldLabel}>{label}</AppText>
      <View style={styles.chipWrap}>
        {options.map((option) => {
          const active = option.key === selected;
          return (
            <Pressable
              key={option.key}
              onPress={() => onSelect(option.key)}
              style={[styles.filterChip, active && styles.filterChipActive]}
            >
              <AppText style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                {option.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function SectionCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.tableCard}>
      <AppText style={styles.sectionTitle}>{title}</AppText>
      {subtitle ? <AppText style={styles.sectionBody}>{subtitle}</AppText> : null}
      {children}
    </View>
  );
}

function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  autoCapitalize = "none",
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  autoCapitalize?: "none" | "words" | "sentences" | "characters";
}) {
  return (
    <View style={styles.formField}>
      <AppText style={styles.fieldLabel}>{label}</AppText>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9ca3af"
        autoCapitalize={autoCapitalize}
        style={styles.textInput}
      />
    </View>
  );
}

function shouldRegenerateGeneratedValue(currentValue: string, sourceName: string, generator: (value: string) => string) {
  if (!currentValue.trim()) {
    return true;
  }

  return currentValue.trim().toLowerCase() === generator(sourceName).toLowerCase();
}

function AffiliateEditorModal({
  visible,
  form,
  onClose,
  onChange,
  onNameChange,
  onSave,
  isSaving,
}: {
  visible: boolean;
  form: AffiliateFormInput;
  onClose: () => void;
  onChange: (next: AffiliateFormInput) => void;
  onNameChange: (value: string) => void;
  onSave: () => void;
  isSaving: boolean;
}) {
  const title = form.id ? "Edit affiliate" : "Add affiliate";

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <AppScreen title={title} subtitle="Add the essentials first. You can refine details later.">
        <ScrollView contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={false}>
          <FormField
            label="Name"
            value={form.name}
            onChangeText={onNameChange}
            placeholder="Affiliate name"
            autoCapitalize="words"
          />
          <FormField
            label="Email"
            value={form.email}
            onChangeText={(value) => onChange({ ...form, email: value })}
            placeholder="name@example.com"
          />
          <FormField
            label="Instagram / TikTok handle"
            value={form.handle}
            onChangeText={(value) => onChange({ ...form, handle: value })}
            placeholder="@creatorname"
          />
          <FormField
            label="Commission %"
            value={form.commissionPercent}
            onChangeText={(value) => onChange({ ...form, commissionPercent: value.replace(/[^0-9.]/g, "") })}
            placeholder="20"
          />
          <FormField
            label="Promo code"
            value={form.promoCode}
            onChangeText={(value) => onChange({ ...form, promoCode: value.replace(/\s+/g, "") })}
            placeholder="SARAH"
            autoCapitalize="characters"
          />
          <FormField
            label="Referral slug"
            value={form.referralSlug}
            onChangeText={(value) => onChange({ ...form, referralSlug: value.replace(/\s+/g, "") })}
            placeholder="sarah"
          />
          <FormField
            label="Status"
            value={form.status}
            onChangeText={(value) => onChange({ ...form, status: value })}
            placeholder="active"
          />
          <View style={styles.modalActions}>
            <AppButton label="Cancel" onPress={onClose} variant="secondary" />
            <AppButton label={isSaving ? "Saving..." : "Save affiliate"} onPress={onSave} disabled={isSaving} />
          </View>
        </ScrollView>
      </AppScreen>
    </Modal>
  );
}

export default function AffiliateAdminDashboardScreen() {
  const { user } = useAuth();
  const adminQuery = useIsAdmin(user?.id);
  const dashboardQuery = useAffiliateDashboard(adminQuery.data === true);
  const saveAffiliateMutation = useSaveAffiliate();
  const [editorVisible, setEditorVisible] = useState(false);
  const [form, setForm] = useState<AffiliateFormInput>(EMPTY_FORM);
  const [selectedRange, setSelectedRange] = useState<RangeKey>("30d");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("revenue");

  const canOpenDashboard = adminQuery.data === true;
  const summary = dashboardQuery.data?.summary;
  const affiliateRows = useMemo(() => dashboardQuery.data?.affiliates ?? [], [dashboardQuery.data?.affiliates]);
  const clickEvents = useMemo(() => dashboardQuery.data?.clickEvents ?? [], [dashboardQuery.data?.clickEvents]);
  const installEvents = useMemo(() => dashboardQuery.data?.installEvents ?? [], [dashboardQuery.data?.installEvents]);
  const purchaseEvents = useMemo(() => dashboardQuery.data?.purchaseEvents ?? [], [dashboardQuery.data?.purchaseEvents]);
  const payoutEvents = useMemo(() => dashboardQuery.data?.payoutEvents ?? [], [dashboardQuery.data?.payoutEvents]);

  const todayClicks = useMemo(
    () => clickEvents.filter((event) => isWithinRange(event.createdAt, "today")).length,
    [clickEvents],
  );
  const todayInstalls = useMemo(
    () => installEvents.filter((event) => isWithinRange(event.createdAt, "today")).length,
    [installEvents],
  );
  const todayPremiumSubscribers = useMemo(() => {
    const todaysPurchases = purchaseEvents.filter((event) => isWithinRange(event.createdAt, "today"));
    const uniqueUsers = new Set(todaysPurchases.map((event) => event.userId).filter((value): value is string => Boolean(value)));
    return uniqueUsers.size > 0 ? uniqueUsers.size : todaysPurchases.length;
  }, [purchaseEvents]);
  const todayRevenue = useMemo(
    () =>
      purchaseEvents
        .filter((event) => isWithinRange(event.createdAt, "today"))
        .reduce((sum, event) => sum + event.amount, 0),
    [purchaseEvents],
  );
  const monthlyRevenue = useMemo(() => {
    const monthStart = getMonthStart();
    return purchaseEvents
      .filter((event) => isOnOrAfter(event.createdAt, monthStart))
      .reduce((sum, event) => sum + event.amount, 0);
  }, [purchaseEvents]);
  const lifetimeRevenue = useMemo(
    () => purchaseEvents.reduce((sum, event) => sum + event.amount, 0),
    [purchaseEvents],
  );
  const pendingPayoutsAmount = useMemo(() => {
    const payoutPending = payoutEvents
      .filter((event) => (event.status || "").toLowerCase() !== "paid")
      .reduce((sum, event) => sum + event.amount, 0);

    return payoutPending > 0 ? payoutPending : summary?.totalPendingCommission ?? 0;
  }, [payoutEvents, summary?.totalPendingCommission]);
  const pendingPayoutsCount = useMemo(() => {
    const payoutPending = payoutEvents.filter((event) => (event.status || "").toLowerCase() !== "paid").length;
    return payoutPending > 0 ? payoutPending : summary?.pendingCommissionCount ?? 0;
  }, [payoutEvents, summary?.pendingCommissionCount]);

  const filteredClicks = useMemo(
    () => clickEvents.filter((event) => isWithinRange(event.createdAt, selectedRange)),
    [clickEvents, selectedRange],
  );
  const filteredInstalls = useMemo(
    () => installEvents.filter((event) => isWithinRange(event.createdAt, selectedRange)),
    [installEvents, selectedRange],
  );
  const filteredPurchases = useMemo(
    () => purchaseEvents.filter((event) => isWithinRange(event.createdAt, selectedRange)),
    [purchaseEvents, selectedRange],
  );

  const topAffiliates = useMemo(() => {
    const byAffiliate = new Map<
      string,
      { affiliate: AffiliateDashboardRow; clicks: number; installs: number; revenue: number }
    >();

    for (const affiliate of affiliateRows) {
      byAffiliate.set(affiliate.id, {
        affiliate,
        clicks: 0,
        installs: 0,
        revenue: 0,
      });
    }

    for (const event of filteredClicks) {
      if (!event.affiliateId || !byAffiliate.has(event.affiliateId)) continue;
      byAffiliate.get(event.affiliateId)!.clicks += 1;
    }

    for (const event of filteredInstalls) {
      if (!event.affiliateId || !byAffiliate.has(event.affiliateId)) continue;
      byAffiliate.get(event.affiliateId)!.installs += 1;
    }

    for (const event of filteredPurchases) {
      if (!event.affiliateId || !byAffiliate.has(event.affiliateId)) continue;
      byAffiliate.get(event.affiliateId)!.revenue += event.amount;
    }

    return Array.from(byAffiliate.values())
      .sort((a, b) => b.revenue - a.revenue || b.installs - a.installs || b.clicks - a.clicks)
      .slice(0, 5);
  }, [affiliateRows, filteredClicks, filteredInstalls, filteredPurchases]);

  const topCampaigns = useMemo(() => {
    const byCampaign = new Map<string, { label: string; clicks: number }>();

    for (const event of filteredClicks) {
      const label = event.campaign || event.source || event.medium || "Direct / Unknown";
      const current = byCampaign.get(label) ?? { label, clicks: 0 };
      current.clicks += 1;
      byCampaign.set(label, current);
    }

    return Array.from(byCampaign.values())
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 5);
  }, [filteredClicks]);

  const newestAffiliates = useMemo(
    () =>
      [...affiliateRows]
        .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""))
        .slice(0, 5),
    [affiliateRows],
  );

  const recentClicks = useMemo(() => filteredClicks.slice(0, 8), [filteredClicks]);
  const recentPurchases = useMemo(() => filteredPurchases.slice(0, 8), [filteredPurchases]);

  const visibleAffiliateRows = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();
    const clickCounts = new Map<string, number>();
    const installCounts = new Map<string, number>();
    const revenueSums = new Map<string, number>();

    for (const event of filteredClicks) {
      if (!event.affiliateId) continue;
      clickCounts.set(event.affiliateId, (clickCounts.get(event.affiliateId) ?? 0) + 1);
    }

    for (const event of filteredInstalls) {
      if (!event.affiliateId) continue;
      installCounts.set(event.affiliateId, (installCounts.get(event.affiliateId) ?? 0) + 1);
    }

    for (const event of filteredPurchases) {
      if (!event.affiliateId) continue;
      revenueSums.set(event.affiliateId, (revenueSums.get(event.affiliateId) ?? 0) + event.amount);
    }

    const rows = affiliateRows.filter((affiliate) => {
      if (!normalizedSearch) {
        return true;
      }

      const haystack = [
        affiliate.name,
        affiliate.email ?? "",
        affiliate.handle ?? "",
        affiliate.promoCode ?? "",
        affiliate.referralSlug ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    });

    return rows.sort((a, b) => {
      if (sortKey === "name") {
        return a.name.localeCompare(b.name);
      }

      if (sortKey === "newest") {
        return (b.createdAt ?? "").localeCompare(a.createdAt ?? "");
      }

      if (sortKey === "clicks") {
        return (clickCounts.get(b.id) ?? 0) - (clickCounts.get(a.id) ?? 0);
      }

      if (sortKey === "installs") {
        return (installCounts.get(b.id) ?? 0) - (installCounts.get(a.id) ?? 0);
      }

      return (revenueSums.get(b.id) ?? 0) - (revenueSums.get(a.id) ?? 0);
    });
  }, [affiliateRows, filteredClicks, filteredInstalls, filteredPurchases, searchQuery, sortKey]);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setEditorVisible(true);
  };

  const openEdit = (affiliate: AffiliateDashboardRow) => {
    setForm({
      id: affiliate.id,
      name: affiliate.name,
      email: affiliate.email ?? "",
      handle: affiliate.handle ?? "",
      commissionPercent: affiliate.commissionPercent !== null ? String(affiliate.commissionPercent) : "",
      promoCode: affiliate.promoCode ?? "",
      referralSlug: affiliate.referralSlug ?? "",
      status: affiliate.status,
    });
    setEditorVisible(true);
  };

  const handleSave = () => {
    void (async () => {
      try {
        await saveAffiliateMutation.mutateAsync(form);
        setEditorVisible(false);
        Alert.alert("Affiliate saved", "The affiliate details were updated.");
      } catch (error) {
        Alert.alert("Unable to save affiliate", getErrorMessage(error));
      }
    })();
  };

  const handleCopy = (value: string) => {
    Clipboard.setString(value);
    Alert.alert("Copied", "Copied to clipboard.");
  };

  const handleShareInvite = (message: string) => {
    void Share.share({
      message,
    }).catch((error) => {
      Alert.alert("Unable to share invite", getErrorMessage(error));
    });
  };

  const updateForm = (next: AffiliateFormInput) => {
    setForm(next);
  };

  const handleNameChange = (value: string) => {
    const shouldUpdatePromo = shouldRegenerateGeneratedValue(form.promoCode, form.name, generateAffiliatePromoCode);
    const shouldUpdateSlug = shouldRegenerateGeneratedValue(form.referralSlug, form.name, generateAffiliateSlug);

    updateForm({
      ...form,
      name: value,
      promoCode: shouldUpdatePromo ? generateAffiliatePromoCode(value) : form.promoCode,
      referralSlug: shouldUpdateSlug ? generateAffiliateSlug(value) : form.referralSlug,
    });
  };

  if (adminQuery.isLoading) {
    return (
      <AppScreen title="Affiliate Dashboard" subtitle="Checking admin access.">
        <View style={styles.centerState}>
          <ActivityIndicator color={colors.accent} />
        </View>
      </AppScreen>
    );
  }

  if (!canOpenDashboard) {
    return (
      <AppScreen title="Affiliate Dashboard" subtitle="This area is only available to admins.">
        <View style={styles.centerState}>
          <ErrorState
            title="Admin access required"
            message="This dashboard is protected. Sign in with an admin account to continue."
          />
          <AppButton label="Back to Profile" onPress={() => router.replace("/profile")} variant="secondary" />
        </View>
      </AppScreen>
    );
  }

  return (
    <AppScreen title="Affiliate Dashboard" subtitle="A simple first pass for tracking partners, clicks, installs, and commissions.">
      <AffiliateEditorModal
        visible={editorVisible}
        form={form}
        onClose={() => setEditorVisible(false)}
        onChange={updateForm}
        onNameChange={handleNameChange}
        onSave={handleSave}
        isSaving={saveAffiliateMutation.isPending}
      />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topActions}>
          <AppButton label="Back to Profile" onPress={() => router.replace("/profile")} variant="secondary" />
          <AppButton label="Add affiliate" onPress={openCreate} />
        </View>

        {dashboardQuery.isLoading ? (
          <View style={styles.statsGrid}>
            {Array.from({ length: 5 }).map((_, index) => (
              <CalmSkeleton key={index} height={120} radius={20} />
            ))}
          </View>
        ) : dashboardQuery.error ? (
          <ErrorState
            title="Dashboard could not load"
            message="Check the affiliate admin RLS migration and make sure your admin account can read the affiliate tables."
          />
        ) : summary ? (
          <>
            <View style={styles.statsGrid}>
              <StatCard label="Today's clicks" value={String(todayClicks)} />
              <StatCard label="Today's installs" value={String(todayInstalls)} />
              <StatCard label="Today's Premium subscribers" value={String(todayPremiumSubscribers)} />
              <StatCard label="Today's revenue" value={formatCurrency(todayRevenue)} />
              <StatCard label="Monthly revenue" value={formatCurrency(monthlyRevenue)} />
              <StatCard label="Lifetime revenue" value={formatCurrency(lifetimeRevenue)} />
              <StatCard
                label="Pending payouts"
                value={formatCurrency(pendingPayoutsAmount)}
                helper={`${pendingPayoutsCount} awaiting payout`}
              />
              <StatCard
                label="Total affiliates"
                value={String(summary.totalAffiliates)}
                helper={`${summary.totalInstalls} installs • ${summary.totalClicks} clicks`}
              />
            </View>

            <ChipGroup label="Dashboard range" options={RANGE_OPTIONS} selected={selectedRange} onSelect={setSelectedRange} />

            <SectionCard
              title="Top affiliates"
              subtitle="A quick view of the strongest partners in the selected range."
            >
              {topAffiliates.length === 0 ? (
                <AppText style={styles.sectionBody}>No affiliate activity yet in this range.</AppText>
              ) : (
                topAffiliates.map(({ affiliate, clicks, installs, revenue }) => (
                  <View key={affiliate.id} style={styles.summaryRow}>
                    <View style={styles.summaryRowCopy}>
                      <AppText style={styles.summaryRowTitle}>{affiliate.name}</AppText>
                      <AppText style={styles.summaryRowMeta}>
                        {clicks} clicks • {installs} installs • {formatPercent(affiliate.conversionRate)}
                      </AppText>
                    </View>
                    <AppText style={styles.summaryRowValue}>{formatCurrency(revenue)}</AppText>
                  </View>
                ))
              )}
            </SectionCard>

            <SectionCard
              title="Top campaigns"
              subtitle="Grouped from recent click source, medium, and campaign data."
            >
              {topCampaigns.length === 0 ? (
                <AppText style={styles.sectionBody}>No campaign-tagged clicks yet in this range.</AppText>
              ) : (
                topCampaigns.map((campaign) => (
                  <View key={campaign.label} style={styles.summaryRow}>
                    <View style={styles.summaryRowCopy}>
                      <AppText style={styles.summaryRowTitle}>{campaign.label}</AppText>
                    </View>
                    <AppText style={styles.summaryRowValue}>{campaign.clicks} clicks</AppText>
                  </View>
                ))
              )}
            </SectionCard>

            <SectionCard
              title="Newest affiliates"
              subtitle="Recent creators added to the program."
            >
              {newestAffiliates.map((affiliate) => (
                <View key={affiliate.id} style={styles.summaryRow}>
                  <View style={styles.summaryRowCopy}>
                    <AppText style={styles.summaryRowTitle}>{affiliate.name}</AppText>
                    <AppText style={styles.summaryRowMeta}>
                      {affiliate.email ?? affiliate.handle ?? "No contact details"}
                    </AppText>
                  </View>
                  <AppText style={styles.summaryRowValue}>{formatDateLabel(affiliate.createdAt)}</AppText>
                </View>
              ))}
            </SectionCard>

            <SectionCard
              title="Recent click activity"
              subtitle="The latest affiliate traffic coming into LiveWithMS."
            >
              {recentClicks.length === 0 ? (
                <AppText style={styles.sectionBody}>No click activity yet in this range.</AppText>
              ) : (
                recentClicks.map((event: AffiliateDashboardClickEvent) => (
                  <View key={event.id} style={styles.activityRow}>
                    <View style={styles.summaryRowCopy}>
                      <AppText style={styles.summaryRowTitle}>{event.affiliateName}</AppText>
                      <AppText style={styles.summaryRowMeta}>
                        {(event.campaign || event.source || event.medium || "Direct / Unknown") +
                          " • " +
                          formatDateTimeLabel(event.createdAt)}
                      </AppText>
                    </View>
                    <AppText style={styles.activityBadge}>{event.slug ?? "ref"}</AppText>
                  </View>
                ))
              )}
            </SectionCard>

            <SectionCard
              title="Recent purchases"
              subtitle="Recent Premium purchase and renewal revenue attributed to affiliates."
            >
              {recentPurchases.length === 0 ? (
                <AppText style={styles.sectionBody}>No purchases yet in this range.</AppText>
              ) : (
                recentPurchases.map((event: AffiliateDashboardPurchaseEvent) => (
                  <View key={event.id} style={styles.activityRow}>
                    <View style={styles.summaryRowCopy}>
                      <AppText style={styles.summaryRowTitle}>{event.affiliateName}</AppText>
                      <AppText style={styles.summaryRowMeta}>
                        {formatDateTimeLabel(event.createdAt)} • {event.status}
                      </AppText>
                    </View>
                    <AppText style={styles.summaryRowValue}>{formatCurrency(event.amount)}</AppText>
                  </View>
                ))
              )}
            </SectionCard>

            <SectionCard
              title="Affiliates"
              subtitle="Search, sort, and review partner performance without leaving the dashboard."
            >
              <SearchField value={searchQuery} onChangeText={setSearchQuery} />
              <ChipGroup label="Sort by" options={SORT_OPTIONS} selected={sortKey} onSelect={setSortKey} />
              {visibleAffiliateRows.map((affiliate) => (
                <View key={affiliate.id} style={styles.affiliateRow}>
                  <View style={styles.rowHeader}>
                    <View style={styles.rowTitleBlock}>
                      <AppText style={styles.rowTitle}>{affiliate.name}</AppText>
                      <AppText style={styles.rowMeta}>
                        {affiliate.email ?? "No email"} • {affiliate.status}
                      </AppText>
                      {affiliate.handle ? (
                        <AppText style={styles.rowMeta}>{affiliate.handle}</AppText>
                      ) : null}
                    </View>
                    <Pressable onPress={() => handleCopy(affiliate.referralLink)} style={styles.copyChip}>
                      <AppText style={styles.copyChipText}>Copy link</AppText>
                    </Pressable>
                  </View>

                  <View style={styles.metricGrid}>
                    <View style={styles.metricItem}>
                      <AppText style={styles.metricLabel}>Commission</AppText>
                      <AppText style={styles.metricValue}>{formatPercent(affiliate.commissionPercent)}</AppText>
                    </View>
                    <View style={styles.metricItem}>
                      <AppText style={styles.metricLabel}>Promo code</AppText>
                      <AppText style={styles.metricValue}>{affiliate.promoCode ?? "—"}</AppText>
                    </View>
                    <View style={styles.metricItem}>
                      <AppText style={styles.metricLabel}>Conversion</AppText>
                      <AppText style={styles.metricValue}>
                        {affiliate.conversionRate === null ? "—" : `${affiliate.conversionRate}%`}
                      </AppText>
                    </View>
                    <View style={styles.metricItem}>
                      <AppText style={styles.metricLabel}>Clicks</AppText>
                      <AppText style={styles.metricValue}>
                        {filteredClicks.filter((event) => event.affiliateId === affiliate.id).length}
                      </AppText>
                    </View>
                    <View style={styles.metricItem}>
                      <AppText style={styles.metricLabel}>Installs</AppText>
                      <AppText style={styles.metricValue}>
                        {filteredInstalls.filter((event) => event.affiliateId === affiliate.id).length}
                      </AppText>
                    </View>
                    <View style={styles.metricItem}>
                      <AppText style={styles.metricLabel}>Range revenue</AppText>
                      <AppText style={styles.metricValue}>
                        {formatCurrency(
                          filteredPurchases
                            .filter((event) => event.affiliateId === affiliate.id)
                            .reduce((sum, event) => sum + event.amount, 0),
                        )}
                      </AppText>
                    </View>
                    <View style={styles.metricItem}>
                      <AppText style={styles.metricLabel}>Pending</AppText>
                      <AppText style={styles.metricValue}>{formatCurrency(affiliate.pendingCommission)}</AppText>
                    </View>
                    <View style={styles.metricItem}>
                      <AppText style={styles.metricLabel}>Paid</AppText>
                      <AppText style={styles.metricValue}>{formatCurrency(affiliate.paidCommission)}</AppText>
                    </View>
                    <View style={styles.metricItem}>
                      <AppText style={styles.metricLabel}>Lifetime</AppText>
                      <AppText style={styles.metricValue}>{formatCurrency(affiliate.lifetimeCommission)}</AppText>
                    </View>
                  </View>

                  <AppText style={styles.referralLinkText}>{affiliate.referralLink}</AppText>

                  <View style={styles.rowActions}>
                    <AppButton
                      label="Copy promo code"
                      onPress={() => handleCopy(affiliate.promoCode ?? "")}
                      variant="secondary"
                    />
                    <AppButton
                      label="Copy invite message"
                      onPress={() => handleCopy(affiliate.inviteMessage)}
                      variant="secondary"
                    />
                    <AppButton
                      label="Share invite"
                      onPress={() => handleShareInvite(affiliate.inviteMessage)}
                      variant="secondary"
                    />
                    <AppButton
                      label="Edit"
                      onPress={() => openEdit(affiliate)}
                      variant="secondary"
                    />
                    <AppButton
                      label="View detail"
                      onPress={() =>
                        router.push({
                          pathname: "/affiliate-admin/[affiliateId]",
                          params: { affiliateId: affiliate.id },
                        })
                      }
                    />
                  </View>
                </View>
              ))}
              {visibleAffiliateRows.length === 0 ? (
                <AppText style={styles.sectionBody}>No affiliates matched that search in this range.</AppText>
              ) : null}
            </SectionCard>
          </>
        ) : null}
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.screenX,
    paddingBottom: 120,
    gap: 18,
  },
  centerState: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.screenX,
    gap: 16,
  },
  topActions: {
    gap: 12,
  },
  statsGrid: {
    gap: 12,
  },
  searchCard: {
    gap: 8,
  },
  chipGroup: {
    gap: 8,
  },
  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  filterChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#f1d3bc",
    backgroundColor: "#fff7f0",
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  filterChipActive: {
    borderColor: "#fe781a",
    backgroundColor: "#fff1e4",
  },
  filterChipText: {
    fontSize: 13,
    lineHeight: 16,
    fontWeight: "700",
    color: "#b45309",
  },
  filterChipTextActive: {
    color: "#8a2f08",
  },
  statCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#f1dfd1",
    backgroundColor: "#ffffff",
    padding: 18,
    gap: 6,
    ...shadows.soft,
  },
  statLabel: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
    color: "#c25d10",
    textTransform: "uppercase",
  },
  statValue: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "700",
    color: colors.text,
  },
  statHelper: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textMuted,
  },
  tableCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#f1dfd1",
    backgroundColor: "#ffffff",
    padding: 18,
    gap: 14,
  },
  sectionTitle: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "700",
    color: colors.text,
  },
  sectionBody: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.textMuted,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#f2e6dc",
    backgroundColor: "#fffaf6",
    padding: 14,
  },
  summaryRowCopy: {
    flex: 1,
    gap: 4,
  },
  summaryRowTitle: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "700",
    color: colors.text,
  },
  summaryRowMeta: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textMuted,
  },
  summaryRowValue: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "700",
    color: "#8a2f08",
    textAlign: "right",
  },
  activityRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#f2e6dc",
    backgroundColor: "#ffffff",
    padding: 14,
  },
  activityBadge: {
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: "#fff2e3",
    color: "#b45309",
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  affiliateRow: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#f2e6dc",
    backgroundColor: "#fffaf6",
    padding: 16,
    gap: 14,
  },
  rowHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "flex-start",
  },
  rowTitleBlock: {
    flex: 1,
    gap: 4,
  },
  rowTitle: {
    fontSize: 17,
    lineHeight: 24,
    fontWeight: "700",
    color: colors.text,
  },
  rowMeta: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textMuted,
  },
  copyChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#f2c29f",
    backgroundColor: "#fff3e8",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  copyChipText: {
    fontSize: 13,
    lineHeight: 16,
    fontWeight: "700",
    color: "#b45309",
  },
  metricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  metricItem: {
    minWidth: "46%",
    gap: 4,
  },
  metricLabel: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
    color: "#c25d10",
    textTransform: "uppercase",
  },
  metricValue: {
    fontSize: 16,
    lineHeight: 22,
    color: colors.text,
  },
  referralLinkText: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.textMuted,
  },
  rowActions: {
    gap: 10,
  },
  modalContent: {
    paddingHorizontal: spacing.screenX,
    paddingBottom: 120,
    gap: 14,
  },
  formField: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
    color: "#c25d10",
    textTransform: "uppercase",
  },
  textInput: {
    minHeight: 52,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: "#f2dfd1",
    backgroundColor: "#fffaf6",
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
  },
  modalActions: {
    gap: 12,
    marginTop: 6,
  },
});
