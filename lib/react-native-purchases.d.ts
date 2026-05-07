declare module "react-native-purchases" {
  export type CustomerInfo = {
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

  export type PurchasesPackage = {
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

  export type PurchasesOffering = {
    identifier: string;
    availablePackages: PurchasesPackage[];
    monthly?: PurchasesPackage | null;
    annual?: PurchasesPackage | null;
  };

  export type PurchasesOfferings = {
    current: PurchasesOffering | null;
    all: Record<string, PurchasesOffering>;
  };

  export const LOG_LEVEL: {
    DEBUG: string;
    WARN: string;
  };

  const Purchases: {
    setLogLevel(level: string): Promise<void>;
    configure(config: { apiKey: string }): void | Promise<void>;
    logIn(appUserID: string): Promise<{ customerInfo: CustomerInfo; created: boolean }>;
    logOut?(): Promise<CustomerInfo>;
    getOfferings(): Promise<PurchasesOfferings>;
    getCustomerInfo(): Promise<CustomerInfo>;
    purchasePackage(aPackage: PurchasesPackage): Promise<{ customerInfo: CustomerInfo }>;
    restorePurchases(): Promise<CustomerInfo>;
  };

  export default Purchases;
}
