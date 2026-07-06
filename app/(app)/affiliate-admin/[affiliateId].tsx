import { useMemo } from "react";
import { Alert, Clipboard, Pressable, ScrollView, Share, StyleSheet, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import AppButton from "../../../components/ui/AppButton";
import AppScreen from "../../../components/ui/AppScreen";
import AppText from "../../../components/ui/AppText";
import CalmSkeleton from "../../../components/ui/CalmSkeleton";
import ErrorState from "../../../components/ui/ErrorState";
import { colors, shadows, spacing } from "../../../components/ui/design";
import { useIsAdmin } from "../../../features/admin/hooks";
import { useAuth } from "../../../features/auth/hooks";
import { useAffiliateDetail, useMarkCommissionPaid } from "../../../features/affiliate-admin/hooks";
import { getErrorMessage } from "../../../lib/errors";

function formatCurrency(value: number, currency = "USD") {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDateLabel(value: string | null) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatPercent(value: number | null) {
  return value === null ? "—" : `${value}%`;
}

export default function AffiliateDetailScreen() {
  const params = useLocalSearchParams<{ affiliateId?: string | string[] }>();
  const affiliateId = Array.isArray(params.affiliateId) ? params.affiliateId[0] : params.affiliateId;
  const { user } = useAuth();
  const adminQuery = useIsAdmin(user?.id);
  const detailQuery = useAffiliateDetail(affiliateId, adminQuery.data === true);
  const markPaidMutation = useMarkCommissionPaid();

  const maxClickCount = useMemo(
    () => Math.max(1, ...(detailQuery.data?.clickSeries.map((point) => point.count) ?? [1])),
    [detailQuery.data?.clickSeries],
  );

  const handleCopy = (value: string) => {
    Clipboard.setString(value);
    Alert.alert("Copied", "Copied to clipboard.");
  };

  const handleShareInvite = (message: string) => {
    void Share.share({ message }).catch((error) => {
      Alert.alert("Unable to share invite", getErrorMessage(error));
    });
  };

  const handleMarkPaid = (input: { commissionId: string; affiliateId: string; amount: number; currency: string }) => {
    void (async () => {
      try {
        await markPaidMutation.mutateAsync(input);
        Alert.alert("Commission updated", "The commission was marked as paid.");
      } catch (error) {
        Alert.alert("Unable to mark commission as paid", getErrorMessage(error));
      }
    })();
  };

  if (adminQuery.isLoading) {
    return (
      <AppScreen title="Affiliate detail" subtitle="Checking admin access.">
        <View style={styles.content}>
          <CalmSkeleton height={140} radius={24} />
        </View>
      </AppScreen>
    );
  }

  if (adminQuery.data !== true) {
    return (
      <AppScreen title="Affiliate detail" subtitle="This area is only available to admins.">
        <View style={styles.content}>
          <ErrorState
            title="Admin access required"
            message="This detail view is protected. Sign in with an admin account to continue."
          />
          <AppButton label="Back to Profile" onPress={() => router.replace("/profile")} variant="secondary" />
        </View>
      </AppScreen>
    );
  }

  if (detailQuery.isLoading) {
    return (
      <AppScreen title="Affiliate detail" subtitle="Loading clicks, installs, commissions, and payouts.">
        <View style={styles.content}>
          <CalmSkeleton height={170} radius={24} />
          <CalmSkeleton height={220} radius={24} />
          <CalmSkeleton height={220} radius={24} />
        </View>
      </AppScreen>
    );
  }

  if (detailQuery.error || !detailQuery.data) {
    return (
      <AppScreen title="Affiliate detail" subtitle="Affiliate detail could not load.">
        <View style={styles.content}>
          <ErrorState
            title="Detail unavailable"
            message="Check the affiliate admin RLS migration and make sure this affiliate exists."
          />
          <AppButton label="Back to dashboard" onPress={() => router.replace("/affiliate-admin")} variant="secondary" />
        </View>
      </AppScreen>
    );
  }

  const { affiliate, clickSeries, installs, latestInstallAt, commissions, payouts } = detailQuery.data;

  return (
    <AppScreen title={affiliate.name} subtitle="Clicks, installs, commissions, payouts, and the live referral link in one place.">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topActions}>
          <AppButton label="Back to dashboard" onPress={() => router.replace("/affiliate-admin")} variant="secondary" />
        </View>

        <View style={styles.card}>
          <AppText style={styles.sectionTitle}>Affiliate details</AppText>
          <AppText style={styles.metaText}>{affiliate.email ?? "No email"} • {affiliate.status}</AppText>
          {affiliate.handle ? <AppText style={styles.metaText}>{affiliate.handle}</AppText> : null}
          <AppText style={styles.metaText}>Commission: {formatPercent(affiliate.commissionPercent)}</AppText>
          <AppText style={styles.metaText}>Promo code: {affiliate.promoCode ?? "—"}</AppText>
          <AppText style={styles.referralLinkText}>{affiliate.referralLink}</AppText>
          <AppButton label="Copy referral link" onPress={() => handleCopy(affiliate.referralLink)} variant="secondary" />
          <AppButton label="Copy promo code" onPress={() => handleCopy(affiliate.promoCode ?? "")} variant="secondary" />
          <AppButton label="Copy creator invite" onPress={() => handleCopy(affiliate.inviteMessage)} variant="secondary" />
          <AppButton label="Share creator invite" onPress={() => handleShareInvite(affiliate.inviteMessage)} variant="secondary" />
        </View>

        <View style={styles.card}>
          <AppText style={styles.sectionTitle}>Clicks over time</AppText>
          {clickSeries.length === 0 ? (
            <AppText style={styles.emptyText}>No tracked clicks yet.</AppText>
          ) : (
            <View style={styles.chartList}>
              {clickSeries.map((point) => (
                <View key={point.date} style={styles.chartRow}>
                  <AppText style={styles.chartLabel}>{formatDateLabel(point.date)}</AppText>
                  <View style={styles.chartBarTrack}>
                    <View
                      style={[
                        styles.chartBarFill,
                        { width: `${Math.max(10, (point.count / maxClickCount) * 100)}%` },
                      ]}
                    />
                  </View>
                  <AppText style={styles.chartValue}>{point.count}</AppText>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.card}>
          <AppText style={styles.sectionTitle}>Installs</AppText>
          <AppText style={styles.bigValue}>{installs}</AppText>
          <AppText style={styles.metaText}>Latest install: {formatDateLabel(latestInstallAt)}</AppText>
        </View>

        <View style={styles.card}>
          <AppText style={styles.sectionTitle}>Commission history</AppText>
          {commissions.length === 0 ? (
            <AppText style={styles.emptyText}>No commissions yet.</AppText>
          ) : (
            commissions.map((commission) => (
              <View key={commission.id} style={styles.listRow}>
                <View style={styles.listCopy}>
                  <AppText style={styles.listTitle}>
                    {formatCurrency(commission.commission, commission.currency)}
                  </AppText>
                  <AppText style={styles.metaText}>
                    Revenue {formatCurrency(commission.amount, commission.currency)} • {commission.status}
                  </AppText>
                  <AppText style={styles.metaText}>
                    Created {formatDateLabel(commission.createdAt)}
                  </AppText>
                  {commission.revenuecatTransactionId ? (
                    <AppText style={styles.mutedTiny}>Transaction: {commission.revenuecatTransactionId}</AppText>
                  ) : null}
                </View>
                {commission.status.toLowerCase() !== "paid" ? (
                  <Pressable
                    onPress={() =>
                      handleMarkPaid({
                        commissionId: commission.id,
                        affiliateId: affiliate.id,
                        amount: commission.commission,
                        currency: commission.currency,
                      })
                    }
                    style={styles.inlineAction}
                    disabled={markPaidMutation.isPending}
                  >
                    <AppText style={styles.inlineActionText}>
                      {markPaidMutation.isPending ? "Updating..." : "Mark paid"}
                    </AppText>
                  </Pressable>
                ) : null}
              </View>
            ))
          )}
        </View>

        <View style={styles.card}>
          <AppText style={styles.sectionTitle}>Payout history</AppText>
          {payouts.length === 0 ? (
            <AppText style={styles.emptyText}>No payout rows yet.</AppText>
          ) : (
            payouts.map((payout) => (
              <View key={payout.id} style={styles.listRow}>
                <View style={styles.listCopy}>
                  <AppText style={styles.listTitle}>{formatCurrency(payout.amount, payout.currency)}</AppText>
                  <AppText style={styles.metaText}>{payout.status} • {formatDateLabel(payout.paidAt)}</AppText>
                  {payout.notes ? <AppText style={styles.mutedTiny}>{payout.notes}</AppText> : null}
                </View>
              </View>
            ))
          )}
        </View>
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
    lineHeight: 28,
    fontWeight: "700",
    color: colors.text,
  },
  metaText: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.textMuted,
  },
  referralLinkText: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.text,
  },
  chartList: {
    gap: 12,
  },
  chartRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  chartLabel: {
    width: 86,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textMuted,
  },
  chartBarTrack: {
    flex: 1,
    height: 12,
    borderRadius: 999,
    backgroundColor: "#f8e6d6",
    overflow: "hidden",
  },
  chartBarFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#e8751a",
  },
  chartValue: {
    width: 30,
    textAlign: "right",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
    color: colors.text,
  },
  bigValue: {
    fontSize: 30,
    lineHeight: 38,
    fontWeight: "700",
    color: colors.text,
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.textMuted,
  },
  listRow: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#f2e6dc",
    backgroundColor: "#fffaf6",
    padding: 14,
    gap: 10,
  },
  listCopy: {
    gap: 4,
  },
  listTitle: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "700",
    color: colors.text,
  },
  mutedTiny: {
    fontSize: 12,
    lineHeight: 17,
    color: colors.textMuted,
  },
  inlineAction: {
    alignSelf: "flex-start",
    borderRadius: 999,
    backgroundColor: "#fff0e5",
    borderWidth: 1,
    borderColor: "#f2c29f",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  inlineActionText: {
    fontSize: 13,
    lineHeight: 16,
    fontWeight: "700",
    color: "#b45309",
  },
});
