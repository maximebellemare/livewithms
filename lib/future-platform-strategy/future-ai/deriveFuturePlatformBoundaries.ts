import type { FuturePlatformBoundary } from "../types";

export function deriveFuturePlatformBoundaries(): FuturePlatformBoundary[] {
  return [
    {
      key: "future-ai",
      allowed: ["bounded summaries", "gentle simplification", "calm support orchestration"],
      blocked: ["therapy simulation", "ai companion dynamics", "emotional manipulation", "psychological over-personalization"],
    },
    {
      key: "future-platforms",
      allowed: ["android parity", "web parity", "accessibility-first expansion", "calm cross-platform continuity"],
      blocked: ["platform-specific engagement theatrics", "notification inflation", "growth-only feature forks"],
    },
    {
      key: "partnerships-and-apis",
      allowed: ["consent-first integrations", "non-invasive exports", "transparent partner flows"],
      blocked: ["data extraction incentives", "upsell funnels", "emotionally exploitative partner surfaces"],
    },
  ];
}
