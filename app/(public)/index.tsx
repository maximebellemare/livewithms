import { useRouter } from "expo-router";
import AppButton from "../../components/ui/AppButton";
import AppScreen from "../../components/ui/AppScreen";

export default function PublicIndexScreen() {
  const router = useRouter();

  return (
    <AppScreen
      title="LiveWithMS"
      subtitle="Daily support for symptom tracking, reflection, and wellness routines."
    >
      <AppButton label="Sign in" onPress={() => router.push("/sign-in")} />
      <AppButton label="Privacy" onPress={() => router.push("/privacy")} />
      <AppButton label="Terms" onPress={() => router.push("/terms")} />
      <AppButton
        label="Medical disclaimer"
        onPress={() => router.push("/medical-disclaimer")}
      />
    </AppScreen>
  );
}
