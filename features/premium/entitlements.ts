import type { PremiumStatus } from "./types";

export function hasPremiumAccess(status: PremiumStatus) {
  return status === "active";
}
