import { useEffect } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import FuturePaywallScreen from "../../components/premium/FuturePaywallScreen";
import { isPremiumEnabled } from "../../features/premium/config";

export default function PremiumScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ source?: string }>();
  const subscriptionsEnabled = isPremiumEnabled();

  const handleClose = () => {
    if (params.source === "onboarding") {
      router.replace("/today");
      return;
    }

    router.back();
  };

  useEffect(() => {
    if (!subscriptionsEnabled) {
      handleClose();
    }
  }, [subscriptionsEnabled]);

  if (!subscriptionsEnabled) {
    return null;
  }

  return <FuturePaywallScreen onClose={handleClose} />;
}
