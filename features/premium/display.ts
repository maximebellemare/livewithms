import type { PremiumOfferingPackage } from "./types";

export const PREMIUM_PRICE_FALLBACK = "Pricing did not come through just yet";

export function getLocalizedStorePrice(pkg: PremiumOfferingPackage | null | undefined) {
  const priceString = pkg?.priceString?.trim();
  return priceString ? priceString : PREMIUM_PRICE_FALLBACK;
}
