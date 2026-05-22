const FAILURE_WINDOW_MS = 10 * 60 * 1000;
const MAX_RETRY_ATTEMPTS = 3;
const COOLDOWN_MS = 12 * 60 * 1000;

export type RevenueCatRefreshState = {
  attempt: number;
  cooldownUntil: number | null;
  lastFailureTrackedAt: number | null;
};

export function getInitialRevenueCatRefreshState(): RevenueCatRefreshState {
  return {
    attempt: 0,
    cooldownUntil: null,
    lastFailureTrackedAt: null,
  };
}

export function resolveRevenueCatFailureState(
  state: RevenueCatRefreshState,
  now: number,
  maxAttempts = MAX_RETRY_ATTEMPTS,
) {
  const nextAttempt = state.attempt + 1;
  const hitCap = nextAttempt >= maxAttempts;

  return {
    attempt: hitCap ? 0 : nextAttempt,
    cooldownUntil: hitCap ? now + COOLDOWN_MS : null,
    lastFailureTrackedAt: state.lastFailureTrackedAt,
    shouldRetry: !hitCap,
    hitCap,
  };
}

export function resetRevenueCatFailureState(): RevenueCatRefreshState {
  return getInitialRevenueCatRefreshState();
}

export function shouldSkipRevenueCatRefresh(
  state: RevenueCatRefreshState,
  now: number,
) {
  return Boolean(state.cooldownUntil && state.cooldownUntil > now);
}

export function shouldTrackRevenueCatFailure(
  state: RevenueCatRefreshState,
  now: number,
) {
  return !state.lastFailureTrackedAt || now - state.lastFailureTrackedAt >= FAILURE_WINDOW_MS;
}

export function markRevenueCatFailureTracked(
  state: RevenueCatRefreshState,
  now: number,
): RevenueCatRefreshState {
  return {
    ...state,
    lastFailureTrackedAt: now,
  };
}
