import { Stack } from "expo-router";
import RouteGate from "../../components/ui/RouteGate";

export default function PublicLayout() {
  return (
    <RouteGate mode="public">
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen
          name="privacy"
          options={{
            title: "Privacy",
            headerBackTitle: "Back",
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen
          name="terms"
          options={{
            title: "Terms",
            headerBackTitle: "Back",
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen
          name="medical-disclaimer"
          options={{
            title: "Medical Disclaimer",
            headerBackTitle: "Back",
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen
          name="account-deletion"
          options={{
            title: "Account Deletion",
            headerBackTitle: "Back",
            headerShadowVisible: false,
          }}
        />
      </Stack>
    </RouteGate>
  );
}
