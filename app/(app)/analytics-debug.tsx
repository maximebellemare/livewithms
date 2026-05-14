import { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import AppButton from "../../components/ui/AppButton";
import AppScreen from "../../components/ui/AppScreen";
import AppText from "../../components/ui/AppText";
import { useAuth } from "../../features/auth/hooks";
import { useCheckInOverview } from "../../features/checkins/hooks";
import { useGrowthState } from "../../features/growth/hooks";
import { useMyProfile } from "../../features/profile/hooks";
import { useReminderSettings } from "../../features/reminders/hooks";
import { clearAnalyticsSnapshot, loadAnalyticsSnapshot, type AnalyticsEvent } from "../../lib/events";
import { getErrorMessage } from "../../lib/errors";

type AnalyticsSnapshotState = {
  recentEvents: AnalyticsEvent[];
  eventCounts: Record<string, number>;
};

export default function AnalyticsDebugScreen() {
  const { user } = useAuth();
  const overviewQuery = useCheckInOverview(user?.id);
  const profileQuery = useMyProfile(user?.id);
  const reminders = useReminderSettings();
  const growth = useGrowthState({
    totalCheckIns: overviewQuery.data?.length ?? 0,
    reminderEnabled: reminders.enabled,
  });
  const [snapshot, setSnapshot] = useState<AnalyticsSnapshotState>({
    recentEvents: [],
    eventCounts: {},
  });
  const [isRefreshing, setIsRefreshing] = useState(true);

  useEffect(() => {
    if (!__DEV__) {
      router.replace("/profile");
      return;
    }

    void refreshSnapshot();
  }, []);

  const refreshSnapshot = async () => {
    setIsRefreshing(true);

    try {
      const nextSnapshot = await loadAnalyticsSnapshot();
      setSnapshot({
        recentEvents: nextSnapshot.recentEvents,
        eventCounts: nextSnapshot.eventCounts as Record<string, number>,
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleClear = async () => {
    try {
      await clearAnalyticsSnapshot();
      await refreshSnapshot();
    } catch (error) {
      Alert.alert("Unable to clear analytics", getErrorMessage(error));
    }
  };

  if (!__DEV__) {
    return null;
  }

  return (
    <AppScreen
      title="Analytics Debug"
      subtitle="Development-only visibility into recent product events and local retention signals."
    >
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <AppText style={styles.sectionTitle}>Current state</AppText>
          <AppText style={styles.rowText}>Onboarding completed: {profileQuery.data?.onboarding_completed ? "Yes" : "No"}</AppText>
          <AppText style={styles.rowText}>Reminders enabled: {reminders.enabled ? "Yes" : "No"}</AppText>
          <AppText style={styles.rowText}>Reminder time: {reminders.selectedTimeLabel}</AppText>
          <AppText style={styles.rowText}>Days active: {growth.metrics.daysActive}</AppText>
          <AppText style={styles.rowText}>Last active: {growth.metrics.lastActiveAt ?? "—"}</AppText>
          <AppText style={styles.rowText}>Check-in rhythm: {growth.metrics.checkInFrequency || 0}/day</AppText>
          <AppText style={styles.rowText}>First-week engagement: {growth.metrics.firstWeekEngaged ? "Yes" : "No"}</AppText>
        </View>

        <View style={styles.card}>
          <AppText style={styles.sectionTitle}>Event counts</AppText>
          {Object.keys(snapshot.eventCounts).length ? (
            Object.entries(snapshot.eventCounts).map(([name, count]) => (
              <AppText key={name} style={styles.rowText}>{name}: {count}</AppText>
            ))
          ) : (
            <AppText style={styles.emptyText}>No events tracked yet.</AppText>
          )}
        </View>

        <View style={styles.card}>
          <AppText style={styles.sectionTitle}>Recent events</AppText>
          {snapshot.recentEvents.length ? (
            snapshot.recentEvents.slice().reverse().map((event) => (
              <View key={event.id} style={styles.eventCard}>
                <AppText style={styles.eventName}>{event.name}</AppText>
                <AppText style={styles.eventTime}>{event.occurredAt}</AppText>
                <AppText style={styles.eventMeta}>{JSON.stringify(event.metadata)}</AppText>
              </View>
            ))
          ) : (
            <AppText style={styles.emptyText}>No recent events yet.</AppText>
          )}
        </View>

        <View style={styles.actions}>
          <AppButton label={isRefreshing ? "Refreshing..." : "Refresh"} onPress={() => void refreshSnapshot()} disabled={isRefreshing} />
          <AppButton label="Clear local analytics" variant="secondary" onPress={() => void handleClear()} />
        </View>
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 120,
    gap: 16,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#f1e1d4",
    padding: 18,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
  },
  rowText: {
    color: "#4b5563",
    lineHeight: 21,
  },
  emptyText: {
    color: "#6b7280",
    lineHeight: 21,
  },
  eventCard: {
    borderRadius: 16,
    backgroundColor: "#fffaf6",
    borderWidth: 1,
    borderColor: "#f3dfd1",
    padding: 12,
    gap: 4,
  },
  eventName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1f2937",
  },
  eventTime: {
    color: "#8b6a4f",
    fontSize: 12,
  },
  eventMeta: {
    color: "#6b7280",
    fontSize: 12,
    lineHeight: 18,
  },
  actions: {
    gap: 10,
  },
});
