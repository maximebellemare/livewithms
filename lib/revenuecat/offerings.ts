type RevenueCatProduct = {
  identifier: string;
  title: string;
  description: string;
  priceString: string;
  price?: number;
  currencyCode?: string;
  subscriptionPeriod?: string;
};

type RevenueCatPackage = {
  identifier: string;
  packageType?: string;
  product: RevenueCatProduct;
};

type RevenueCatOffering = {
  identifier: string;
  availablePackages: RevenueCatPackage[];
  monthly?: RevenueCatPackage | null;
  annual?: RevenueCatPackage | null;
};

type RevenueCatOfferings = {
  current: RevenueCatOffering | null;
  all: Record<string, RevenueCatOffering>;
};

export const EXPECTED_REVENUECAT_OFFERING_IDENTIFIER = "default" as const;
export const EXPECTED_REVENUECAT_PACKAGE_IDENTIFIERS = ["$rc_monthly", "$rc_annual"] as const;
export const EXPECTED_REVENUECAT_PRODUCT_IDENTIFIERS = ["livewithms_monthly", "livewithms_yearly"] as const;

function hasPackages(offering: RevenueCatOffering | null | undefined) {
  return (offering?.availablePackages?.length ?? 0) > 0;
}

export function selectPreferredOffering(offerings: RevenueCatOfferings) {
  const current = offerings.current;
  const defaultOffering = offerings.all?.[EXPECTED_REVENUECAT_OFFERING_IDENTIFIER] ?? null;
  const firstAvailable =
    Object.values(offerings.all ?? {}).find((candidate) => hasPackages(candidate)) ?? null;

  const selected =
    hasPackages(current)
      ? current
      : hasPackages(defaultOffering)
        ? defaultOffering
        : hasPackages(firstAvailable)
          ? firstAvailable
          : null;

  return {
    selected,
    source: hasPackages(current)
      ? "current"
      : hasPackages(defaultOffering)
        ? "default"
        : hasPackages(firstAvailable)
          ? "fallback"
          : "empty",
  } as const;
}

export function deriveOfferingsDiagnostics(offerings: RevenueCatOfferings, offering: RevenueCatOffering | null) {
  const identifiers = Object.keys(offerings.all ?? {});
  const packageIdentifiers = (offering?.availablePackages ?? []).map((pkg) => pkg.identifier);
  const productIdentifiers = (offering?.availablePackages ?? []).map((pkg) => pkg.product.identifier);

  return {
    requestedOfferingIdentifier: EXPECTED_REVENUECAT_OFFERING_IDENTIFIER,
    hasCurrentOffering: Boolean(offerings.current),
    offeringIdentifiers: identifiers,
    packageIdentifiers,
    productIdentifiers,
    hasExpectedPackages: EXPECTED_REVENUECAT_PACKAGE_IDENTIFIERS.every((identifier) =>
      packageIdentifiers.includes(identifier),
    ),
    hasExpectedProducts: EXPECTED_REVENUECAT_PRODUCT_IDENTIFIERS.every((identifier) =>
      productIdentifiers.includes(identifier),
    ),
  };
}

export function hasEmptyOfferingSelection(offerings: RevenueCatOfferings) {
  return selectPreferredOffering(offerings).selected === null;
}
