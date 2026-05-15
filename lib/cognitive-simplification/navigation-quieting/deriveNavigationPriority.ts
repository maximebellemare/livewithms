import type { CognitiveBurden, DisclosureDepth, NavigationPriority } from "../types";

const DEFAULT_ROUTES: NavigationPriority["preferredRoutes"] = [
  "/today",
  "/coach",
  "/insights",
  "/programs",
  "/care",
  "/health-summary",
  "/track",
];

export function deriveNavigationPriority(input: {
  burden: CognitiveBurden;
  disclosureDepth: DisclosureDepth;
}): NavigationPriority {
  if (input.disclosureDepth === "minimal" || input.burden === "high") {
    return {
      maxVisibleRoutes: 2,
      preferredRoutes: DEFAULT_ROUTES,
    };
  }

  if (input.disclosureDepth === "expanded") {
    return {
      maxVisibleRoutes: 4,
      preferredRoutes: DEFAULT_ROUTES,
    };
  }

  return {
    maxVisibleRoutes: 3,
    preferredRoutes: DEFAULT_ROUTES,
  };
}
