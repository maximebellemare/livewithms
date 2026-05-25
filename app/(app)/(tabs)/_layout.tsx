import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

export default function TabsLayout() {
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
