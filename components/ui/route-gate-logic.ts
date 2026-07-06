export type RouteGateMode = "public" | "auth" | "onboarding" | "app";

export function getAllowedPath(
  mode: RouteGateMode,
  onboardingCompleted: boolean | null,
  options?: {
    requiresPremiumAccess?: boolean;
  },
) {
  const premiumRoute = mode === "onboarding" ? "/premium?source=onboarding" : "/premium?source=gate";
  const mainAppRoute = options?.requiresPremiumAccess ? premiumRoute : "/today";

  if (mode === "public") {
    return onboardingCompleted === false ? "/welcome" : mainAppRoute;
  }

  if (mode === "auth") {
    return onboardingCompleted === false ? "/welcome" : mainAppRoute;
  }

  if (mode === "onboarding") {
    return onboardingCompleted === false ? null : mainAppRoute;
  }

  return onboardingCompleted === false ? "/welcome" : options?.requiresPremiumAccess ? premiumRoute : null;
}
