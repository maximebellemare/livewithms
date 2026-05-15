import type { ConnectionFatigueState, SocialDensity } from "../types";

export function deriveSocialDensity(fatigueState: ConnectionFatigueState): SocialDensity {
  return fatigueState === "open" ? "light" : "minimal";
}

