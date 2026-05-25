import { PropsWithChildren, useEffect, useMemo, useRef } from "react";
import { usePathname, useRouter, useSegments } from "expo-router";
import { useAuth } from "../../features/auth/hooks";
import { useMyProfile } from "../../features/profile/hooks";
import { logger } from "../../lib/logger";
import LoadingState from "./LoadingState";
import { getAllowedPath, type RouteGateMode } from "./route-gate-logic";

type RouteGateProps = PropsWithChildren<{
  mode: RouteGateMode;
}>;

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
  const authenticatedTargetPath = useMemo(() => {
    if (!isAuthenticated || profileQuery.isLoading) {
      return null;
    }

    return getAllowedPath(mode, onboardingCompleted);
  }, [isAuthenticated, mode, onboardingCompleted, profileQuery.isLoading]);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    let targetPath: string | null = null;

    if (!isAuthenticated) {
      targetPath = mode === "app" || mode === "onboarding" ? "/sign-in" : null;
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
    return <LoadingState message="Restoring session..." />;
  }

  if (!isAuthenticated) {
    if (mode === "app" || mode === "onboarding") {
      return <LoadingState message="Redirecting..." />;
    }

    return activeGroup === expectedGroup ? <>{children}</> : <LoadingState message="Loading..." />;
  }

  if (profileQuery.isLoading) {
    return <LoadingState message="Loading profile..." />;
  }

  if (authenticatedTargetPath && pathname !== authenticatedTargetPath) {
    return <LoadingState message="Redirecting..." />;
  }

  if (activeGroup !== expectedGroup) {
    return <LoadingState message="Loading..." />;
  }

  return <>{children}</>;
}
