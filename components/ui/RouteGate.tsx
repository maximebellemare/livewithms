import { PropsWithChildren, useEffect, useMemo, useRef } from "react";
import { usePathname, useRouter, useSegments } from "expo-router";
import { useAuth } from "../../features/auth/hooks";
import { useMyProfile } from "../../features/profile/hooks";
import { logger } from "../../lib/logger";
import LoadingState from "./LoadingState";
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
  const profileReady = !isAuthenticated || !shouldLoadProfile || !profileQuery.isLoading;
  const sessionStatus = !isReady ? "loading" : session?.user?.id ? "authenticated" : "none";
  const shouldShowUnauthenticatedAppFlow = isReady && !isAuthenticated && (mode === "app" || mode === "onboarding");
  const buildDebugLabel = (currentStep: string) =>
    [
      `authReady: ${String(isReady)}`,
      `profileReady: ${String(profileReady)}`,
      `appReady: ${String(isReady)}`,
      `session: ${sessionStatus}`,
      `currentStep: ${currentStep}`,
    ].join("\n");
  const authenticatedTargetPath = useMemo(() => {
    if (!isAuthenticated || profileQuery.isLoading) {
      return null;
    }

    return getAllowedPath(mode, onboardingCompleted);
  }, [isAuthenticated, mode, onboardingCompleted, profileQuery.isLoading]);

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
    router,
    session,
    user?.id,
  ]);

  if (!isReady) {
    if (__DEV__) {
      console.log("[startup] RouteGate loading state", {
        reason: "auth-not-ready",
        authReady: isReady,
        profileReady,
        appReady: isReady,
        sessionStatus,
      });
    }
    return <LoadingState message="Restoring session..." debugLabel={buildDebugLabel("loading session")} />;
  }

  if (!isAuthenticated) {
    if (mode === "app" || mode === "onboarding") {
      console.log("[startup] navigation fallback rendered auth", {
        pathname,
        mode,
      });
      return <SignInScreen />;
    }

    if (mode === "auth") {
      return <>{children}</>;
    }

    console.log("[startup] navigation fallback rendered auth", {
      pathname,
      mode,
      reason: activeGroup !== expectedGroup ? "public-group-mismatch" : "public-mode-fallback",
    });
    return <SignInScreen />;
  }

  if (profileQuery.isLoading) {
    if (__DEV__) {
      console.log("[startup] RouteGate loading state", {
        reason: "profile-loading",
        authReady: isReady,
        profileReady,
        appReady: isReady,
        sessionStatus,
      });
    }
    return <LoadingState message="Loading profile..." debugLabel={buildDebugLabel("loading profile")} />;
  }

  if (authenticatedTargetPath && pathname !== authenticatedTargetPath) {
    if (__DEV__) {
      console.log("[startup] RouteGate loading state", {
        reason: "redirecting-authenticated",
        authReady: isReady,
        profileReady,
        appReady: isReady,
        sessionStatus,
      });
    }
    return <LoadingState message="Redirecting..." debugLabel={buildDebugLabel("waiting for navigation")} />;
  }

  if (activeGroup !== expectedGroup) {
    if (__DEV__) {
      console.log("[startup] RouteGate loading state", {
        reason: "app-group-mismatch",
        authReady: isReady,
        profileReady,
        appReady: isReady,
        sessionStatus,
      });
    }
    return <LoadingState message="Loading..." debugLabel={buildDebugLabel("waiting for navigation")} />;
  }

  if (__DEV__) {
    console.log("[startup] RouteGate appReady state", {
      authReady: isReady,
      profileReady,
      appReady: isReady,
      sessionStatus,
    });
  }
  return <>{children}</>;
}
