import type { ReactNode } from "react";
import { Alert, Clipboard, ScrollView, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import AppButton from "../../../components/ui/AppButton";
import AppScreen from "../../../components/ui/AppScreen";
import AppText from "../../../components/ui/AppText";
import CalmSkeleton from "../../../components/ui/CalmSkeleton";
import ErrorState from "../../../components/ui/ErrorState";
import { colors, shadows, spacing } from "../../../components/ui/design";
import { useAuth } from "../../../features/auth/hooks";
import { useCreatorDashboard } from "../../../features/creator/hooks";
import { getErrorMessage } from "../../../lib/errors";

function formatCurrency(value: number, currency = "USD") {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(value: string | null) {
  if (!value) {
    return "—";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function StatCard({ label, value, helper }: { label: string; value: string; helper?: string }) {
  return (
    <View style={styles.statCard}>
      <AppText style={styles.statLabel}>{label}</AppText>
      <AppText style={styles.statValue}>{value}</AppText>
      {helper ? <AppText style={styles.statHelper}>{helper}</AppText> : null}
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
    <View style={styles.card}>
      <AppText style={styles.sectionTitle}>{title}</AppText>
      {subtitle ? <AppText style={styles.sectionBody}>{subtitle}</AppText> : null}
      {children}
    </View>
  );
}

export default function CreatorDashboardScreen() {
  const { user } = useAuth();
  const creatorQuery = useCreatorDashboard(user?.id, user?.email);

  const handleCopy = (value: string, label: string) => {
    Clipboard.setString(value);
    Alert.alert("Copied", `${label} copied to clipboard.`);
  };

  if (creatorQuery.isLoading) {
    return (
      <AppScreen title="Creator Dashboard" subtitle="Loading your referral link, clicks, commissions, and payouts.">
        <View style={styles.content}>
          <CalmSkeleton height={180} radius={24} />
          <CalmSkeleton height={220} radius={24} />
          <CalmSkeleton height={220} radius={24} />
        </View>
      </AppScreen>
    );
  }

  if (creatorQuery.error) {
    return (
      <AppScreen title="Creator Dashboard" subtitle="Your creator stats could not load right now.">
        <View style={styles.content}>
          <ErrorState
            title="Dashboard unavailable"
            message={getErrorMessage(creatorQuery.error)}
          />
          <AppButton label="Back to Profile" onPress={() => router.replace("/profile")} variant="secondary" />
        </View>
      </AppScreen>
    );
  }

  if (!creatorQuery.data) {
    return (
      <AppScreen title="Creator Dashboard" subtitle="This space appears when your account is linked to a creator invite email.">
        <View style={styles.content}>
          <ErrorState
            title="Creator access not linked"
            message="Sign in with the creator email that was added to your LiveWithMS affiliate profile."
          />
          <AppButton label="Back to Profile" onPress={() => router.replace("/profile")} variant="secondary" />
        </View>
      </AppScreen>
    );
  }

  const dashboard = creatorQuery.data;

  return (
    <AppScreen
      title="Creator Dashboard"
      subtitle={`Welcome back${dashboard.name ? `, ${dashboard.name}` : ""}. Your referral tools and earnings live here.`}
    >
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topActions}>
          <AppButton label="Back to Profile" onPress={() => router.replace("/profile")} variant="secondary" />
        </View>

        <SectionCard
          title="Your creator link"
          subtitle="Share this link or your creator code so LiveWithMS can credit your referrals."
        >
          <AppText style={styles.referralLink}>{dashboard.referralLink}</AppText>
          <AppText style={styles.metaText}>Promo code: {dashboard.promoCode ?? "—"}</AppText>
          {dashboard.handle ? <AppText style={styles.metaText}>{dashboard.handle}</AppText> : null}
          <View style={styles.actionStack}>
            <AppButton label="Copy referral link" onPress={() => handleCopy(dashboard.referralLink, "Referral link")} />
            <AppButton label="Copy promo code" onPress={() => handleCopy(dashboard.promoCode ?? "", "Promo code")} variant="secondary" />
            <AppButton label="Copy creator invite" onPress={() => handleCopy(dashboard.inviteMessage, "Invite message")} variant="secondary" />
          </View>
        </SectionCard>

        <View style={styles.statsGrid}>
          <StatCard label="Total clicks" value={String(dashboard.totalClicks)} />
          <StatCard label="Total installs" value={String(dashboard.totalInstalls)} />
          <StatCard label="Premium subscribers" value={String(dashboard.premiumSubscribers)} />
          <StatCard label="Pending commission" value={formatCurrency(dashboard.pendingCommission)} />
          <StatCard label="Paid commission" value={formatCurrency(dashboard.paidCommission)} />
          <StatCard label="Lifetime commission" value={formatCurrency(dashboard.lifetimeCommission)} />
        </View>

        <SectionCard
          title="Recent clicks"
          subtitle="The most recent people who arrived through your creator link."
        >
          {dashboard.recentClicks.length === 0 ? (
            <AppText style={styles.emptyText}>No clicks yet.</AppText>
          ) : (
            dashboard.recentClicks.map((click) => (
              <View key={click.id} style={styles.listRow}>
                <View style={styles.listCopy}>
                  <AppText style={styles.listTitle}>{click.campaign || click.source || click.medium || "Direct / Unknown"}</AppText>
                  <AppText style={styles.metaText}>{formatDate(click.createdAt)}</AppText>
                  <AppText style={styles.mutedText}>{click.referrer || click.slug || "No source details"}</AppText>
                </View>
              </View>
            ))
          )}
        </SectionCard>

        <SectionCard
          title="Recent commissions"
          subtitle="Recent Premium purchase and renewal commissions attributed to your referrals."
        >
          {dashboard.recentCommissions.length === 0 ? (
            <AppText style={styles.emptyText}>No commissions yet.</AppText>
          ) : (
            dashboard.recentCommissions.map((commission) => (
              <View key={commission.id} style={styles.listRow}>
                <View style={styles.listCopy}>
                  <AppText style={styles.listTitle}>
                    {formatCurrency(commission.commission, commission.currency)} • {commission.status}
                  </AppText>
                  <AppText style={styles.metaText}>
                    Revenue {formatCurrency(commission.amount, commission.currency)} • {formatDate(commission.createdAt)}
                  </AppText>
                  {commission.revenuecatTransactionId ? (
                    <AppText style={styles.mutedText}>Transaction: {commission.revenuecatTransactionId}</AppText>
                  ) : null}
                </View>
              </View>
            ))
          )}
        </SectionCard>

        <SectionCard
          title="Payout history"
          subtitle="Paid commissions appear here once the LiveWithMS team records them."
        >
          {dashboard.payouts.length === 0 ? (
            <AppText style={styles.emptyText}>No payouts recorded yet.</AppText>
          ) : (
            dashboard.payouts.map((payout) => (
              <View key={payout.id} style={styles.listRow}>
                <View style={styles.listCopy}>
                  <AppText style={styles.listTitle}>{formatCurrency(payout.amount, payout.currency)}</AppText>
                  <AppText style={styles.metaText}>{payout.status} • {formatDate(payout.paidAt || payout.createdAt)}</AppText>
                  {payout.notes ? <AppText style={styles.mutedText}>{payout.notes}</AppText> : null}
                </View>
              </View>
            ))
          )}
        </SectionCard>
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
  topActions: {
    gap: 12,
  },
  card: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#f1dfd1",
    backgroundColor: "#ffffff",
    padding: 18,
    gap: 12,
    ...shadows.soft,
  },
  sectionTitle: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "700",
    color: colors.text,
  },
  sectionBody: {
    color: colors.textMuted,
    lineHeight: 22,
  },
  referralLink: {
    color: "#8a2f08",
    fontWeight: "700",
    lineHeight: 22,
  },
  metaText: {
    color: colors.textMuted,
    lineHeight: 20,
  },
  mutedText: {
    color: "#6b7280",
    lineHeight: 20,
  },
  actionStack: {
    gap: 10,
  },
  statsGrid: {
    gap: 12,
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
    fontWeight: "800",
    color: colors.text,
  },
  statHelper: {
    color: colors.textMuted,
    lineHeight: 20,
  },
  listRow: {
    borderTopWidth: 1,
    borderTopColor: "#f3e4d9",
    paddingTop: 12,
  },
  listCopy: {
    gap: 4,
  },
  listTitle: {
    color: colors.text,
    fontWeight: "700",
    lineHeight: 22,
  },
  emptyText: {
    color: colors.textMuted,
    lineHeight: 22,
  },
});
