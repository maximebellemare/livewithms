import type { AppUpdateDecision, RemoteAppVersion } from "./types";

function normalizeVersion(version: string) {
  return version
    .trim()
    .split(/[+-]/, 1)[0]
    .split(".")
    .map((part) => {
      const numeric = Number.parseInt(part.replace(/[^\d].*$/, ""), 10);
      return Number.isFinite(numeric) ? numeric : 0;
    });
}

export function compareSemanticVersions(left: string, right: string) {
  const leftParts = normalizeVersion(left);
  const rightParts = normalizeVersion(right);
  const maxLength = Math.max(leftParts.length, rightParts.length);

  for (let index = 0; index < maxLength; index += 1) {
    const leftValue = leftParts[index] ?? 0;
    const rightValue = rightParts[index] ?? 0;

    if (leftValue > rightValue) {
      return 1;
    }
    if (leftValue < rightValue) {
      return -1;
    }
  }

  return 0;
}

export function evaluateAppUpdateDecision(
  currentVersion: string | null,
  config: RemoteAppVersion | null,
): AppUpdateDecision {
  if (!config) {
    return {
      kind: "current",
      currentVersion,
      config: null,
    };
  }

  if (config.forceUpdate) {
    return {
      kind: "required",
      currentVersion,
      targetVersion: config.minimumVersion ?? config.recommendedVersion,
      config,
    };
  }

  if (!currentVersion) {
    return {
      kind: "current",
      currentVersion,
      config,
    };
  }

  if (config.minimumVersion && compareSemanticVersions(currentVersion, config.minimumVersion) < 0) {
    return {
      kind: "required",
      currentVersion,
      targetVersion: config.minimumVersion,
      config,
    };
  }

  if (config.recommendedVersion && compareSemanticVersions(currentVersion, config.recommendedVersion) < 0) {
    return {
      kind: "recommended",
      currentVersion,
      targetVersion: config.recommendedVersion,
      config,
    };
  }

  return {
    kind: "current",
    currentVersion,
    config,
  };
}
