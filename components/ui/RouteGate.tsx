import { PropsWithChildren, useEffect, useMemo, useRef, useState } from "react";
import * as SplashScreen from "expo-splash-screen";
import { usePathname, useRouter, useSegments } from "expo-router";
import { useAuth } from "../../features/auth/hooks";
import { usePremium } from "../../features/premium/hooks";
import { useMyProfile } from "../../features/profile/hooks";
import { logger } from "../../lib/logger";
import { shouldUseRevenueCatNativeStore } from "../../lib/revenueCatEnvironment";
import AppUpdateGate from "./AppUpdateGate";
import { getAllowedPath, type RouteGateMode } from "./route-gate-logic";
import SignInScreen from "../../app/(auth)/sign-in";

type RouteGateProps = PropsWithChildren<{
  mode: RouteGateMode;
}>;

const AUTH_ROUTE = "/sign-in";

export default function RouteGate({ children, mode }: RouteGateProps) {
  const router = useRouter();
  const pathname = usePathname();
  const segments = useSegments();
  const { isReady, isAuthenticated, session, user } = useAuth();
  const premium = usePremium();
  const redirectInFlightRef = useRef<string | null>(null);
  const premiumRouteDecisionRef = useRef<string | null>(null);
  const [profileLoadTimedOut, setProfileLoadTimedOut] = useState(false);
  const shouldLoadProfile = isReady && isAuthenticated && !!user?.id;
  const profileQuery = useMyProfile(user?.id, shouldLoadProfile);

  const activeGroup = segments[0] ?? null;
  const expectedGroup =
    mode === "public"
      ? "(public)"
      : mode === "auth"
        ? "(auth)"
        : mode === "onboarding"
          ? "(onboarding)"
        : "(app)";

  const onboardingCompleted = profileQuery.data?.onboarding_completed ?? false;
  const shouldEnforcePremiumAccess =
    isAuthenticated &&
    onboardingCompleted &&
    premium.subscriptionsEnabled &&
    shouldUseRevenueCatNativeStore();
  const profileReady =
    !isAuthenticated || !shouldLoadProfile || !profileQuery.isLoading || profileQuery.isError || profileLoadTimedOut;
  const premiumReady = !shouldEnforcePremiumAccess || !premium.isLoading;
  const requiresPremiumAccess = shouldEnforcePremiumAccess && !premium.revenueCatEntitlementActive;
  const sessionStatus = !isReady ? "loading" : session?.user?.id ? "authenticated" : "none";
  const shouldShowUnauthenticatedAppFlow = isReady && !isAuthenticated && (mode === "app" || mode === "onboarding");
  const authenticatedTargetPath = useMemo(() => {
    if (!isAuthenticated || !profileReady || !premiumReady) {
      return null;
    }

    return getAllowedPath(mode, onboardingCompleted, { requiresPremiumAccess });
  }, [isAuthenticated, mode, onboardingCompleted, premiumReady, profileReady, requiresPremiumAccess]);

  useEffect(() => {
    if (!shouldLoadProfile || !profileQuery.isLoading) {
      setProfileLoadTimedOut(false);
      return;
    }

    const timeoutId = setTimeout(() => {
      console.error("[startup] Profile load timed out", {
        userId: user?.id ?? null,
        pathname,
        mode,
      });
      setProfileLoadTimedOut(true);
    }, 10000);

    return () => clearTimeout(timeoutId);
  }, [mode, pathname, profileQuery.isLoading, shouldLoadProfile, user?.id]);

  useEffect(() => {
    if (!shouldShowUnauthenticatedAppFlow) {
      return;
    }

    console.log("[startup] route decision: no session -> auth", {
      pathname,
      mode,
      route: AUTH_ROUTE,
    });
  }, [mode, pathname, shouldShowUnauthenticatedAppFlow]);

  useEffect(() => {
    if (isReady && isAuthenticated) {
      console.log("[startup] route decision: session -> app", {
        pathname,
        mode,
      });
    }
  }, [isAuthenticated, isReady, mode, pathname]);

  useEffect(() => {
    if (!__DEV__) {
      return;
    }

    console.log("[startup] RouteGate render", {
      pathname,
      activeGroup,
      expectedGroup,
      mode,
      isReady,
      isAuthenticated,
      profileLoading: profileQuery.isLoading,
      hasProfile: Boolean(profileQuery.data),
      onboardingCompleted,
      premiumLoading: premium.isLoading,
      hasPremiumAccess: premium.hasPremiumAccess,
      revenueCatEntitlementActive: premium.revenueCatEntitlementActive,
      requiresPremiumAccess,
      sessionStatus,
    });
  }, [
    activeGroup,
    expectedGroup,
    isAuthenticated,
    isReady,
    mode,
    onboardingCompleted,
    pathname,
    premium.hasPremiumAccess,
    premium.isLoading,
    premium.revenueCatEntitlementActive,
    profileQuery.data,
    profileQuery.isLoading,
    requiresPremiumAccess,
    sessionStatus,
  ]);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    let targetPath: string | null = null;

    if (!isAuthenticated) {
      targetPath = mode === "app" || mode === "onboarding" ? AUTH_ROUTE : null;
    } else {
      if (profileQuery.isLoading) {
        return;
      }

      targetPath = authenticatedTargetPath;
    }

    const targetPathname = targetPath?.split("?")[0] ?? null;

    if (!targetPath || pathname === targetPathname) {
      redirectInFlightRef.current = null;
      return;
    }

    if (redirectInFlightRef.current === targetPath) {
      return;
    }

    redirectInFlightRef.current = targetPath;
    logger.info("Redirecting user", { from: pathname, to: targetPath, mode, isAuthenticated, hasSession: !!session });
    router.replace(targetPath);
  }, [
    authenticatedTargetPath,
    isAuthenticated,
    isReady,
    mode,
    pathname,
    premiumReady,
    profileQuery.isLoading,
    profileLoadTimedOut,
    router,
    session,
    user?.id,
  ]);

  const routeState =
    !isReady
      ? "booting"
      : !isAuthenticated
        ? mode === "auth"
          ? "auth-children"
          : mode === "public"
            ? "public-children"
            : "sign-in"
        : (profileQuery.isLoading && !profileLoadTimedOut) || !premiumReady
          ? "booting"
          : authenticatedTargetPath && pathname !== authenticatedTargetPath.split("?")[0]
            ? "redirecting"
            : activeGroup !== expectedGroup
              ? "redirecting"
              : "children";

  useEffect(() => {
    if (routeState === "booting" || routeState === "redirecting") {
      return;
    }

    void SplashScreen.hideAsync().catch(() => {
      // Ignore repeated hide attempts during fast route transitions.
    });
  }, [routeState]);

  if (routeState === "booting" || routeState === "redirecting") {
    return null;
  }

  if (routeState === "sign-in") {
    console.log("[startup] navigation fallback rendered auth", {
      pathname,
      mode,
    });
    return (
      <AppUpdateGate app="livewithms" enabled={isReady}>
        <SignInScreen />
      </AppUpdateGate>
    );
  }

  if (routeState === "auth-children" || routeState === "public-children") {
    return (
      <AppUpdateGate app="livewithms" enabled={isReady}>
        {children}
      </AppUpdateGate>
    );
  }

  if (__DEV__) {
    console.log("[startup] RouteGate appReady state", {
      authReady: isReady,
      profileReady,
      appReady: isReady,
      sessionStatus,
      premiumReady,
      hasPremiumAccess: premium.hasPremiumAccess,
      requiresPremiumAccess,
    });
  }

  const premiumRouteDecisionSignature = JSON.stringify({
    userId: user?.id ?? null,
    pathname,
    onboardingCompleted,
    hasPremiumAccess: premium.hasPremiumAccess,
    requiresPremiumAccess,
  });

  if (premiumRouteDecisionRef.current !== premiumRouteDecisionSignature) {
    premiumRouteDecisionRef.current = premiumRouteDecisionSignature;
    console.info("[premium-gate] route", {
      userId: user?.id ?? null,
      pathname,
      onboardingCompleted,
      hasPremiumAccess: premium.hasPremiumAccess,
      requiresPremiumAccess,
      finalDecision: requiresPremiumAccess ? "show_paywall" : "allow_app",
    });
  }
  return (
    <AppUpdateGate app="livewithms" enabled={isReady}>
      {children}
    </AppUpdateGate>
  );
}
