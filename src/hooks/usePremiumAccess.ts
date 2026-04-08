import { usePremium } from "./usePremium";
import { useTrial } from "./useTrial";

/**
 * Unified hook: returns true if user should have premium feature access.
 * This means they either have an active paid subscription OR are in their trial.
 */
export const usePremiumAccess = () => {
  const { isPremium, isLoading: premiumLoading } = usePremium();
  const { isInTrial, trialExpired, daysRemaining, isLoading: trialLoading } = useTrial();

  const hasPremiumAccess = isPremium || isInTrial;
  const isLoading = premiumLoading || trialLoading;

  return {
    /** User can access premium features right now */
    hasPremiumAccess,
    /** User is in trial (not paid) */
    isInTrial,
    /** Trial has expired */
    trialExpired,
    /** Days left in trial */
    daysRemaining,
    /** Has paid subscription */
    isPaidPremium: isPremium,
    isLoading,
  };
};
