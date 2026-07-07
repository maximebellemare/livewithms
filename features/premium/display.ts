import type { PremiumOffering, PremiumOfferingPackage } from "./types";

export const PREMIUM_PRICE_FALLBACK = "Pricing did not come through just yet";

export function getLocalizedStorePrice(pkg: PremiumOfferingPackage | null | undefined) {
  const priceString = pkg?.priceString?.trim();
  return priceString ? priceString : PREMIUM_PRICE_FALLBACK;
}

export function packageHasConfirmedFreeTrial(pkg: PremiumOfferingPackage | null | undefined) {
  return Boolean(pkg?.introductoryOffer?.isFreeTrial);
}

export function getSubscriptionCtaLabel(offering: PremiumOffering | null | undefined) {
  if (packageHasConfirmedFreeTrial(offering?.yearly) || packageHasConfirmedFreeTrial(offering?.monthly)) {
    return "Start free trial";
  }

  return "Start subscription";
}
