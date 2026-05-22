export type RouteGateMode = "public" | "auth" | "onboarding" | "app";

export function getAllowedPath(mode: RouteGateMode, onboardingCompleted: boolean | null) {
  if (mode === "public") {
    return onboardingCompleted === false ? "/welcome" : "/today";
  }

  if (mode === "auth") {
    return onboardingCompleted === false ? "/welcome" : "/today";
  }

  if (mode === "onboarding") {
    return onboardingCompleted === false ? null : "/today";
  }

  return onboardingCompleted === false ? "/welcome" : null;
}
