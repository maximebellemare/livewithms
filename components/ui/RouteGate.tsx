import { PropsWithChildren, useEffect, useMemo, useRef, useState } from "react";
import * as SplashScreen from "expo-splash-screen";
import { usePathname, useRouter, useSegments } from "expo-router";
import { useAuth } from "../../features/auth/hooks";
import { useMyProfile } from "../../features/profile/hooks";
import { logger } from "../../lib/logger";
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
  const redirectInFlightRef = useRef<string | null>(null);
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
  const profileReady =
    !isAuthenticated || !shouldLoadProfile || !profileQuery.isLoading || profileQuery.isError || profileLoadTimedOut;
  const sessionStatus = !isReady ? "loading" : session?.user?.id ? "authenticated" : "none";
  const shouldShowUnauthenticatedAppFlow = isReady && !isAuthenticated && (mode === "app" || mode === "onboarding");
  const authenticatedTargetPath = useMemo(() => {
    if (!isAuthenticated || !profileReady) {
      return null;
    }

    return getAllowedPath(mode, onboardingCompleted);
  }, [isAuthenticated, mode, onboardingCompleted, profileReady]);

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
    profileQuery.data,
    profileQuery.isLoading,
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

    if (!targetPath || pathname === targetPath) {
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
        : profileQuery.isLoading && !profileLoadTimedOut
          ? "booting"
          : authenticatedTargetPath && pathname !== authenticatedTargetPath
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
    });
  }
  return (
    <AppUpdateGate app="livewithms" enabled={isReady}>
      {children}
    </AppUpdateGate>
  );
}
