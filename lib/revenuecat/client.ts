import env from "../env";
import { normalizeError } from "../errors";
import { logger } from "../logger";
import type { PremiumPlan, PremiumOffering, PremiumOfferingPackage } from "../../features/premium/types";

type RevenueCatCustomerInfo = {
  entitlements: {
    active: Record<
      string,
      {
        identifier: string;
        isActive?: boolean;
        expirationDate?: string | null;
      }
    >;
  };
};

type RevenueCatPackage = {
  identifier: string;
  packageType?: string;
  product: {
    identifier: string;
    title: string;
    description: string;
    priceString: string;
    subscriptionPeriod?: string;
  };
};

type RevenueCatOffering = {
  identifier: string;
  availablePackages: RevenueCatPackage[];
  monthly?: RevenueCatPackage | null;
  annual?: RevenueCatPackage | null;
};

let configuredApiKey: string | null = null;
let loggedInUserId: string | null = null;

async function loadPurchasesModule() {
  return import("react-native-purchases");
}

function mapPackage(plan: PremiumPlan, pkg: RevenueCatPackage | null | undefined): PremiumOfferingPackage | null {
  if (!pkg) {
    return null;
  }

  return {
    plan,
    identifier: pkg.product.identifier,
    title: pkg.product.title,
    description: pkg.product.description,
    priceString: pkg.product.priceString,
    rawPackage: pkg,
  };
}

function findPackage(offering: RevenueCatOffering | null, plan: PremiumPlan) {
  if (!offering) {
    return null;
  }

  if (plan === "monthly" && offering.monthly) {
    return offering.monthly;
  }

  if (plan === "yearly" && offering.annual) {
    return offering.annual;
  }

  return (
    offering.availablePackages.find((pkg) => {
      const haystack = `${pkg.identifier} ${pkg.product.identifier}`.toLowerCase();
      return plan === "monthly"
        ? haystack.includes("month")
        : haystack.includes("annual") || haystack.includes("year");
    }) ?? null
  );
}

function mapOffering(offering: RevenueCatOffering | null): PremiumOffering | null {
  if (!offering) {
    return null;
  }

  return {
    monthly: mapPackage("monthly", findPackage(offering, "monthly")),
    yearly: mapPackage("yearly", findPackage(offering, "yearly")),
  };
}

export type RevenueCatPurchaseResult = {
  cancelled: boolean;
  customerInfo: RevenueCatCustomerInfo | null;
};

export const revenueCatClient = {
  async configureRevenueCat(userId: string) {
    if (!env.isRevenueCatConfigured) {
      throw new Error("RevenueCat is not configured.");
    }

    const { default: Purchases, LOG_LEVEL } = await loadPurchasesModule();

    if (configuredApiKey !== env.revenueCatIosApiKey) {
      await Purchases.setLogLevel(LOG_LEVEL.WARN);
      await Purchases.configure({ apiKey: env.revenueCatIosApiKey });
      configuredApiKey = env.revenueCatIosApiKey;
      loggedInUserId = null;
    }

    if (loggedInUserId !== userId) {
      await Purchases.logIn(userId);
      loggedInUserId = userId;
      logger.info("RevenueCat user logged in", { userId });
    }
  },

  async getCurrentOffering() {
    const { default: Purchases } = await loadPurchasesModule();
    const offerings = await Purchases.getOfferings();
    const offering =
      offerings.current ??
      Object.values(offerings.all ?? {}).find(
        (candidate) => (candidate?.availablePackages?.length ?? 0) > 0,
      ) ??
      null;

    return mapOffering(offering);
  },

  async getCustomerInfo() {
    const { default: Purchases } = await loadPurchasesModule();
    return (await Purchases.getCustomerInfo()) as RevenueCatCustomerInfo;
  },

  async purchasePlan(userId: string, plan: PremiumPlan): Promise<RevenueCatPurchaseResult> {
    await revenueCatClient.configureRevenueCat(userId);
    const { default: Purchases } = await loadPurchasesModule();
    const offerings = await Purchases.getOfferings();
    const offering =
      offerings.current ??
      Object.values(offerings.all ?? {}).find(
        (candidate) => (candidate?.availablePackages?.length ?? 0) > 0,
      ) ??
      null;
    const pkg = findPackage(offering, plan);

    if (!pkg) {
      throw new Error(`No ${plan} package is available in RevenueCat.`);
    }

    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      return {
        cancelled: false,
        customerInfo: customerInfo as RevenueCatCustomerInfo,
      };
    } catch (error) {
      const maybeCancelled = error as { userCancelled?: boolean };
      if (maybeCancelled?.userCancelled) {
        return {
          cancelled: true,
          customerInfo: null,
        };
      }

      throw error;
    }
  },

  async restorePurchases(userId: string): Promise<RevenueCatCustomerInfo> {
    await revenueCatClient.configureRevenueCat(userId);
    const { default: Purchases } = await loadPurchasesModule();
    return (await Purchases.restorePurchases()) as RevenueCatCustomerInfo;
  },

  async resetUser() {
    try {
      const { default: Purchases } = await loadPurchasesModule();
      if (configuredApiKey && typeof Purchases.logOut === "function") {
        await Purchases.logOut();
      }
    } catch (error) {
      const normalizedError = normalizeError(error);
      logger.warn("RevenueCat logOut failed", { message: normalizedError.message });
    } finally {
      loggedInUserId = null;
    }
  },
};

export type { RevenueCatCustomerInfo };
