import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useCallback, useEffect, useRef } from "react";
import { AppState } from "react-native";
import { useAuth } from "../../../features/auth/hooks";
import {
  loadCommunityNotifiedActivityIds,
  saveCommunityNotifiedActivityIds,
  useCommunityActivity,
} from "../../../features/community/activity";
import { useReminderSettings } from "../../../features/reminders/hooks";
import { scheduleCommunityActivityNotification } from "../../../features/reminders/notifications";

export default function TabsLayout() {
  const { user } = useAuth();
  const communityActivity = useCommunityActivity(user?.id);
  const reminders = useReminderSettings();
  const hasHandledInitialCommunityActivityRef = useRef(false);
  const communityActivitySummary = communityActivity.summary;
  const refreshCommunityActivity = communityActivity.refresh;

  useEffect(() => {
    hasHandledInitialCommunityActivityRef.current = false;
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

    const activityItems = communityActivitySummary.recentActivity.filter((item) => enabledTypes.has(item.type));
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
    void maybeNotifyCommunityActivity();
  }, [maybeNotifyCommunityActivity]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        void refreshCommunityActivity();
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

  return (
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
          href: "/insights",
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
  );
}
