import { useCallback, useEffect } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import FuturePaywallScreen from "../../components/premium/FuturePaywallScreen";
import { useAuth } from "../../features/auth/hooks";
import { isPremiumEnabled } from "../../features/premium/config";
import { usePremium } from "../../features/premium/hooks";

export default function PremiumScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ source?: string }>();
  const auth = useAuth();
  const premium = usePremium();
  const subscriptionsEnabled = isPremiumEnabled();
  const requiredAccess =
    params.source === "gate" ||
    params.source === "onboarding" ||
    (!premium.hasPremiumAccess && params.source !== "profile");

  const handleClose = useCallback(() => {
    if (requiredAccess || params.source === "onboarding") {
      router.replace("/today");
      return;
    }

    router.back();
  }, [params.source, requiredAccess, router]);

  const handleRequiredExit = useCallback(() => {
    void auth.signOut();
  }, [auth]);

  useEffect(() => {
    if (!subscriptionsEnabled) {
      handleClose();
    }
  }, [handleClose, subscriptionsEnabled]);

  if (!subscriptionsEnabled) {
    return null;
  }

  return <FuturePaywallScreen onClose={handleClose} requiredAccess={requiredAccess} onRequiredExit={handleRequiredExit} />;
}
