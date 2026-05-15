export function deriveGracePeriodBehavior(input: {
  lastSuccessfulRefreshAt: number | null;
  refreshFailed: boolean;
}) {
  if (!input.refreshFailed || !input.lastSuccessfulRefreshAt) {
    return {
      active: false,
      showMessage: false,
    };
  }

  const withinGrace = Date.now() - input.lastSuccessfulRefreshAt < 12 * 60 * 60 * 1000;
  return {
    active: withinGrace,
    showMessage: withinGrace,
  };
}
