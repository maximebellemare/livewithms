import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen
        name="today/index"
        options={{ title: "Today", tabBarLabel: "Today", href: "/today" }}
      />
      <Tabs.Screen
        name="track/index"
        options={{ title: "Track", tabBarLabel: "Track", href: "/track" }}
      />
      <Tabs.Screen
        name="coach/index"
        options={{ title: "Coach", tabBarLabel: "Coach", href: "/coach" }}
      />
      <Tabs.Screen
        name="programs/index"
        options={{ title: "Programs", tabBarLabel: "Programs", href: "/programs" }}
      />
      <Tabs.Screen
        name="profile/index"
        options={{ title: "Profile", tabBarLabel: "Profile", href: "/profile" }}
      />
    </Tabs>
  );
}
