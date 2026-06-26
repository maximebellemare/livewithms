import { useMemo, useState } from "react";
import { ActivityIndicator, Alert, Clipboard, Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { router } from "expo-router";
import AppButton from "../../../components/ui/AppButton";
import AppScreen from "../../../components/ui/AppScreen";
import AppText from "../../../components/ui/AppText";
import CalmSkeleton from "../../../components/ui/CalmSkeleton";
import ErrorState from "../../../components/ui/ErrorState";
import { colors, radii, shadows, spacing } from "../../../components/ui/design";
import { useIsAdmin } from "../../../features/admin/hooks";
import { useAuth } from "../../../features/auth/hooks";
import { useAffiliateDashboard, useSaveAffiliate } from "../../../features/affiliate-admin/hooks";
import type { AffiliateDashboardRow, AffiliateFormInput } from "../../../features/affiliate-admin/types";
import { getErrorMessage } from "../../../lib/errors";

const EMPTY_FORM: AffiliateFormInput = {
  name: "",
  email: "",
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

function AffiliateEditorModal({
  visible,
  form,
  onClose,
  onChange,
  onSave,
  isSaving,
}: {
  visible: boolean;
  form: AffiliateFormInput;
  onClose: () => void;
  onChange: (next: AffiliateFormInput) => void;
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
            onChangeText={(value) => onChange({ ...form, name: value })}
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

  const canOpenDashboard = adminQuery.data === true;
  const summary = dashboardQuery.data?.summary;
  const affiliateRows = useMemo(() => dashboardQuery.data?.affiliates ?? [], [dashboardQuery.data?.affiliates]);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setEditorVisible(true);
  };

  const openEdit = (affiliate: AffiliateDashboardRow) => {
    setForm({
      id: affiliate.id,
      name: affiliate.name,
      email: affiliate.email ?? "",
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
    Alert.alert("Copied", "Referral link copied.");
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
        onChange={setForm}
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
              <StatCard label="Total affiliates" value={String(summary.totalAffiliates)} />
              <StatCard label="Total clicks" value={String(summary.totalClicks)} />
              <StatCard label="Total installs" value={String(summary.totalInstalls)} />
              <StatCard
                label="Pending commissions"
                value={formatCurrency(summary.totalPendingCommission)}
                helper={`${summary.pendingCommissionCount} pending`}
              />
              <StatCard
                label="Paid commissions"
                value={formatCurrency(summary.totalPaidCommission)}
                helper={`${summary.paidCommissionCount} paid`}
              />
            </View>

            <View style={styles.tableCard}>
              <AppText style={styles.sectionTitle}>Affiliates</AppText>
              <AppText style={styles.sectionBody}>
                Each row rolls up clicks, installs, and commission totals into one calm view.
              </AppText>
              {affiliateRows.map((affiliate) => (
                <View key={affiliate.id} style={styles.affiliateRow}>
                  <View style={styles.rowHeader}>
                    <View style={styles.rowTitleBlock}>
                      <AppText style={styles.rowTitle}>{affiliate.name}</AppText>
                      <AppText style={styles.rowMeta}>
                        {affiliate.email ?? "No email"} • {affiliate.status}
                      </AppText>
                    </View>
                    <Pressable onPress={() => handleCopy(affiliate.referralLink)} style={styles.copyChip}>
                      <AppText style={styles.copyChipText}>Copy link</AppText>
                    </Pressable>
                  </View>

                  <View style={styles.metricGrid}>
                    <View style={styles.metricItem}>
                      <AppText style={styles.metricLabel}>Promo code</AppText>
                      <AppText style={styles.metricValue}>{affiliate.promoCode ?? "—"}</AppText>
                    </View>
                    <View style={styles.metricItem}>
                      <AppText style={styles.metricLabel}>Clicks</AppText>
                      <AppText style={styles.metricValue}>{affiliate.clicks}</AppText>
                    </View>
                    <View style={styles.metricItem}>
                      <AppText style={styles.metricLabel}>Installs</AppText>
                      <AppText style={styles.metricValue}>{affiliate.installs}</AppText>
                    </View>
                    <View style={styles.metricItem}>
                      <AppText style={styles.metricLabel}>Pending</AppText>
                      <AppText style={styles.metricValue}>{formatCurrency(affiliate.pendingCommission)}</AppText>
                    </View>
                    <View style={styles.metricItem}>
                      <AppText style={styles.metricLabel}>Paid</AppText>
                      <AppText style={styles.metricValue}>{formatCurrency(affiliate.paidCommission)}</AppText>
                    </View>
                  </View>

                  <AppText style={styles.referralLinkText}>{affiliate.referralLink}</AppText>

                  <View style={styles.rowActions}>
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
            </View>
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
