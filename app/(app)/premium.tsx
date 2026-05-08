import { useEffect } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import FuturePaywallScreen from "../../components/premium/FuturePaywallScreen";
import { ENABLE_SUBSCRIPTIONS } from "../../features/premium/config";

export default function PremiumScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ source?: string }>();

  const handleClose = () => {
    if (params.source === "onboarding") {
      router.replace("/today");
      return;
    }

    router.back();
  };

  useEffect(() => {
    if (!ENABLE_SUBSCRIPTIONS) {
      handleClose();
    }
  }, []);

  if (!ENABLE_SUBSCRIPTIONS) {
    return null;
  }

  return <FuturePaywallScreen onClose={handleClose} />;
}
