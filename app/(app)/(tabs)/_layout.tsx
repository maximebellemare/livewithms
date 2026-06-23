import { Ionicons } from "@expo/vector-icons";
import { Tabs, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppState, InteractionManager, Modal, Pressable, StyleSheet, View } from "react-native";
import AppText from "../../../components/ui/AppText";
import { colors, radii, shadows, spacing } from "../../../components/ui/design";
import { APP_TOUR_SLIDES } from "../../../features/app-tour/content";
import {
  addAppTourReplayListener,
  loadHasSeenAppTour,
  markAppTourSeen,
} from "../../../features/app-tour/storage";
import { useAuth } from "../../../features/auth/hooks";
import {
  loadCommunityNotifiedActivityIds,
  saveCommunityNotifiedActivityIds,
  useCommunityActivity,
} from "../../../features/community/activity";
import { upsertUserPushToken } from "../../../features/community/api";
import { useMyProfile } from "../../../features/profile/hooks";
import { useReminderSettings } from "../../../features/reminders/hooks";
import {
  addAppNotificationResponseListener,
  getExpoPushToken,
  scheduleCommunityActivityNotification,
} from "../../../features/reminders/notifications";

export default function TabsLayout() {
  const router = useRouter();
  const { user } = useAuth();
  const [navigationSettled, setNavigationSettled] = useState(false);
  const communityActivity = useCommunityActivity(navigationSettled ? user?.id : undefined);
  const reminders = useReminderSettings();
  const hasHandledInitialCommunityActivityRef = useRef(false);
  const hasCheckedAppTourRef = useRef(false);
  const communityActivitySummary = communityActivity.summary;
  const refreshCommunityActivity = communityActivity.refresh;
  const [showAppTour, setShowAppTour] = useState(false);
  const [appTourIndex, setAppTourIndex] = useState(0);
  const profileQuery = useMyProfile(navigationSettled ? user?.id : undefined, navigationSettled && Boolean(user?.id));
  const currentTourSlide = useMemo(() => APP_TOUR_SLIDES[appTourIndex] ?? APP_TOUR_SLIDES[0], [appTourIndex]);

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      setNavigationSettled(true);
    });

    return () => {
      task.cancel?.();
    };
  }, []);

  useEffect(() => {
    hasHandledInitialCommunityActivityRef.current = false;
    hasCheckedAppTourRef.current = false;
  }, [user?.id]);

  const maybeNotifyCommunityActivity = useCallback(async () => {
    if (!user?.id) {
      return;
    }
    if (reminders.permissionStatus !== "granted") {
      return;
    }

    const enabledTypes = new Set<string>();
    if (reminders.communityReplyNotificationsEnabled) {
      enabledTypes.add("reply");
    }
    if (reminders.communityReactionNotificationsEnabled) {
      enabledTypes.add("reaction");
    }
    if (reminders.communityRecentActivityNotificationsEnabled) {
      enabledTypes.add("post");
    }
    if (enabledTypes.size === 0) {
      return;
    }

    const activityItems = communityActivitySummary.recentActivity.filter(
      (item) => enabledTypes.has(item.type) && item.type === "post" && item.id.startsWith("summary-post:"),
    );
    if (activityItems.length === 0) {
      return;
    }

    const notifiedIds = await loadCommunityNotifiedActivityIds(user.id);
    const notifiedIdSet = new Set(notifiedIds);
    const freshItems = activityItems.filter((item) => !notifiedIdSet.has(item.id)).slice(0, 3);

    if (!hasHandledInitialCommunityActivityRef.current) {
      hasHandledInitialCommunityActivityRef.current = true;
      if (freshItems.length > 0) {
        await saveCommunityNotifiedActivityIds(user.id, [
          ...freshItems.map((item) => item.id),
          ...notifiedIds,
        ]);
      }
      return;
    }

    if (freshItems.length === 0) {
      return;
    }

    for (const item of freshItems) {
      await scheduleCommunityActivityNotification({
        item,
        quiet: reminders.quietReminders,
      });
    }

    await saveCommunityNotifiedActivityIds(user.id, [
      ...freshItems.map((item) => item.id),
      ...notifiedIds,
    ]);
  }, [
    communityActivitySummary.recentActivity,
    reminders.communityReactionNotificationsEnabled,
    reminders.communityRecentActivityNotificationsEnabled,
    reminders.communityReplyNotificationsEnabled,
    reminders.permissionStatus,
    reminders.quietReminders,
    user?.id,
  ]);

  useEffect(() => {
    if (!navigationSettled) {
      return;
    }

    void maybeNotifyCommunityActivity();
  }, [maybeNotifyCommunityActivity, navigationSettled]);

  useEffect(() => {
    if (!navigationSettled || !user?.id || reminders.permissionStatus !== "granted") {
      return;
    }

    const task = InteractionManager.runAfterInteractions(() => {
      void (async () => {
        const pushToken = await getExpoPushToken();
        if (!pushToken?.token) {
          return;
        }

        try {
          await upsertUserPushToken({
            userId: user.id,
            expoPushToken: pushToken.token,
            platform: pushToken.platform,
          });
        } catch {
          // Keep push token registration silent so the app still opens normally.
        }
      })();
    });

    return () => {
      task.cancel?.();
    };
  }, [navigationSettled, reminders.permissionStatus, user?.id]);

  useEffect(() => {
    const removeListener = addAppNotificationResponseListener((response) => {
      const data = response.notification?.request?.content?.data ?? {};
      const type = typeof data.type === "string" ? data.type : null;
      if (type !== "community-activity") {
        return;
      }

      const threadId =
        typeof data.threadId === "string"
          ? data.threadId
          : typeof data.postId === "string"
            ? data.postId
            : null;

      if (!threadId) {
        return;
      }

      router.push(`/community?postId=${encodeURIComponent(threadId)}` as never);
    });

    return removeListener;
  }, [router]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        InteractionManager.runAfterInteractions(() => {
          void refreshCommunityActivity();
        });
      }
    });

    return () => {
      subscription.remove();
    };
  }, [refreshCommunityActivity]);

  useEffect(() => {
    if (!user?.id) {
      return;
    }

    const intervalId = setInterval(() => {
      void refreshCommunityActivity();
    }, 120000);

    return () => {
      clearInterval(intervalId);
    };
  }, [refreshCommunityActivity, user?.id]);

  const closeAppTour = useCallback(async () => {
    if (user?.id) {
      await markAppTourSeen(user.id);
    }
    setShowAppTour(false);
    setAppTourIndex(0);
  }, [user?.id]);

  useEffect(() => {
    if (!navigationSettled || !user?.id || hasCheckedAppTourRef.current || profileQuery.isLoading) {
      return;
    }
    if (!profileQuery.data?.onboarding_completed) {
      return;
    }

    hasCheckedAppTourRef.current = true;
    void (async () => {
      const hasSeen = await loadHasSeenAppTour(user.id);
      if (!hasSeen) {
        setAppTourIndex(0);
        setShowAppTour(true);
      }
    })();
  }, [navigationSettled, profileQuery.data?.onboarding_completed, profileQuery.isLoading, user?.id]);

  useEffect(() => {
    const removeListener = addAppTourReplayListener(() => {
      setAppTourIndex(0);
      setShowAppTour(true);
    });

    return removeListener;
  }, []);

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: "#e8751a",
          tabBarInactiveTintColor: "#6b7280",
          tabBarActiveBackgroundColor: "#fff4ec",
          tabBarHideOnKeyboard: true,
          tabBarItemStyle: {
            marginHorizontal: 2,
            borderRadius: 18,
            paddingVertical: 4,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: "600",
            paddingBottom: 2,
          },
          tabBarStyle: {
            height: 72,
            paddingHorizontal: 10,
            paddingTop: 8,
            paddingBottom: 8,
            backgroundColor: "#fffdfb",
            borderTopColor: "#f1e1d4",
            borderTopWidth: 1,
          },
        }}
      >
        <Tabs.Screen
          name="today/index"
          options={{
            title: "Today",
            tabBarLabel: "Today",
            href: "/today",
            tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? "home" : "home-outline"} color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="track/index"
          options={{
            title: "Track",
            tabBarLabel: "Track",
            href: "/track",
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons name={focused ? "stats-chart" : "stats-chart-outline"} color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="insights/index"
          options={{
            title: "Insights",
            tabBarLabel: "Insights",
            href: null,
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons name={focused ? "bulb" : "bulb-outline"} color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="coach/index"
          options={{
            title: "Coach",
            tabBarLabel: "Coach",
            href: "/coach",
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons name={focused ? "chatbubble-ellipses" : "chatbubble-ellipses-outline"} color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="care/index"
          options={{
            title: "Care",
            tabBarLabel: "Care",
            href: "/care",
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons name={focused ? "medical" : "medical-outline"} color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="programs/index"
          options={{
            title: "Programs",
            tabBarLabel: "Programs",
            href: "/programs",
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons name={focused ? "sparkles" : "sparkles-outline"} color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="community/index"
          options={{
            title: "Community",
            tabBarLabel: "Community",
            href: "/community",
            tabBarBadge: communityActivitySummary.unreadCount > 0 ? communityActivitySummary.unreadCount : undefined,
            tabBarBadgeStyle: {
              backgroundColor: "#e8751a",
              color: "#fff8f1",
              fontSize: 11,
              fontWeight: "700",
            },
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons name={focused ? "people" : "people-outline"} color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="health/index"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="profile/index"
          options={{
            title: "Profile",
            tabBarLabel: "Profile",
            href: "/profile",
            tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? "person" : "person-outline"} color={color} size={size} />,
          }}
        />
      </Tabs>
      <Modal
        visible={showAppTour}
        transparent
        animationType="fade"
        onRequestClose={() => {
          void closeAppTour();
        }}
      >
        <View style={styles.backdrop}>
          <View style={styles.card}>
            <View style={styles.topRow}>
              <AppText style={styles.kicker}>App tour</AppText>
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  void closeAppTour();
                }}
                hitSlop={8}
              >
                <AppText style={styles.skipText}>Skip</AppText>
              </Pressable>
            </View>
            <View style={styles.iconWrap}>
              <Ionicons name={currentTourSlide.icon} size={28} color={colors.accent} />
            </View>
            <AppText style={styles.title}>{currentTourSlide.title}</AppText>
            <AppText style={styles.body}>{currentTourSlide.body}</AppText>
            <View style={styles.progressRow}>
              {APP_TOUR_SLIDES.map((slide, index) => (
                <View
                  key={slide.id}
                  style={[styles.progressDot, index === appTourIndex && styles.progressDotActive]}
                />
              ))}
            </View>
            <View style={styles.footerRow}>
              <AppText style={styles.stepText}>
                {appTourIndex + 1} of {APP_TOUR_SLIDES.length}
              </AppText>
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  if (appTourIndex >= APP_TOUR_SLIDES.length - 1) {
                    void closeAppTour();
                    return;
                  }
                  setAppTourIndex((current) => Math.min(current + 1, APP_TOUR_SLIDES.length - 1));
                }}
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed && styles.buttonPressed,
                ]}
              >
                <AppText style={styles.primaryButtonText}>
                  {appTourIndex >= APP_TOUR_SLIDES.length - 1 ? "Done" : "Next"}
                </AppText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(17, 24, 39, 0.28)",
    justifyContent: "center",
    paddingHorizontal: spacing.screenX,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.cardLarge,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.cardPadding,
    gap: 14,
    ...shadows.soft,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  kicker: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
    textTransform: "uppercase",
    color: colors.accent,
  },
  skipText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
    color: colors.textMuted,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  title: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "700",
    color: colors.text,
  },
  body: {
    fontSize: 15,
    lineHeight: 23,
    color: colors.textBody,
  },
  progressRow: {
    flexDirection: "row",
    gap: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.borderSoft,
  },
  progressDotActive: {
    width: 22,
    backgroundColor: colors.accent,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  stepText: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textMuted,
  },
  primaryButton: {
    minHeight: 46,
    borderRadius: radii.pill,
    backgroundColor: colors.accent,
    paddingHorizontal: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  primaryButtonText: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "700",
    color: colors.surface,
  },
  buttonPressed: {
    opacity: 0.88,
  },
});
