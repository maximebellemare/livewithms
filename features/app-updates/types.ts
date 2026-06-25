export type AppUpdatePlatform = "ios" | "android";

export type RemoteAppVersion = {
  app: string;
  platform: AppUpdatePlatform;
  minimumVersion: string | null;
  recommendedVersion: string | null;
  forceUpdate: boolean;
  message: string | null;
  storeUrl: string | null;
};

export type AppUpdateDecision =
  | {
      kind: "current";
      currentVersion: string | null;
      config: RemoteAppVersion | null;
    }
  | {
      kind: "recommended";
      currentVersion: string;
      targetVersion: string;
      config: RemoteAppVersion;
    }
  | {
      kind: "required";
      currentVersion: string | null;
      targetVersion: string | null;
      config: RemoteAppVersion;
    };
