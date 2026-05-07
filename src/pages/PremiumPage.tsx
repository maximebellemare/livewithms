import { useState, useEffect, useCallback, useMemo } from "react";
import { Crown, Sparkles, Brain, Stethoscope, Zap, BarChart3, BookOpen, Check, Star, CreditCard, Loader2, Heart, RefreshCw } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import PageHeader from "@/components/PageHeader";
import PullToRefresh from "@/components/PullToRefresh";
import { useQueryClient } from "@tanstack/react-query";
import { StaggerContainer, StaggerItem } from "@/components/StaggeredReveal";
import { usePremium } from "@/hooks/usePremium";
import { useTrial } from "@/hooks/useTrial";
import { toast } from "sonner";
import { useSearchParams } from "react-router-dom";

const features = [
  { icon: Sparkles, label: "AI Monthly Health Review", desc: "Personalized monthly summaries of your health patterns." },
  { icon: Stethoscope, label: "Doctor Mode", desc: "90-day clinical summary with printable PDF for appointments." },
  { icon: Zap, label: "Fatigue Deep Dive", desc: "Identify your top fatigue triggers and get pacing recommendations." },
  { icon: BarChart3, label: "Advanced Correlations", desc: "Multi-variable analysis connecting sleep, stress, and symptoms." },
  { icon: BookOpen, label: "Structured Programs", desc: "Guided programs for anxiety, nervous system, and flare management." },
  { icon: Brain, label: "Unlimited AI Coach", desc: "Unlimited daily messages with your personal AI support coach." },
];

const pickPackage = (offering: any, billing: "monthly" | "annual", packageType: Record<string, string>) => {
  const packages = offering?.availablePackages ?? [];
  const isMonthly = billing === "monthly";

  const preferred = isMonthly ? offering?.monthly : offering?.annual;
  if (preferred) return preferred;

  const typeMatch = packages.find((pkg: any) =>
    pkg?.packageType === (isMonthly ? packageType.MONTHLY : packageType.ANNUAL)
  );
  if (typeMatch) return typeMatch;

  const periodMatch = packages.find((pkg: any) => {
    const period = String(pkg?.product?.subscriptionPeriod ?? "").toUpperCase();
    return isMonthly ? period === "P1M" : period === "P1Y";
  });
  if (periodMatch) return periodMatch;

  const identifierMatch = packages.find((pkg: any) => {
    const haystack = `${pkg?.identifier ?? ""} ${pkg?.product?.identifier ?? ""}`.toLowerCase();
    return isMonthly
      ? haystack.includes("month")
      : haystack.includes("annual") || haystack.includes("year");
  });
  if (identifierMatch) return identifierMatch;

  return packages[0] ?? null;
};

const PremiumPage = () => {
  const { isPremium, premiumUntil, hasRealSubscription, cancelAtPeriodEnd, isBillingStatusLoading, checkSubscription } = usePremium();
  const { isInTrial, trialExpired, daysRemaining } = useTrial();
  const [billing, setBilling] = useState<"monthly" | "annual">("annual");
  const [loading, setLoading] = useState(false);
  const [managingPortal, setManagingPortal] = useState(false);
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const isCapacitor = !!(window as any).Capacitor;

  const handleRefresh = useCallback(async () => {
    await checkSubscription();
    queryClient.invalidateQueries({ queryKey: ["profile"] });
  }, [queryClient, checkSubscription]);

  useEffect(() => { checkSubscription(); }, [checkSubscription]);

  useEffect(() => {
    const checkout = searchParams.get("checkout");
    if (checkout === "cancel") {
      toast.info("No problem — you can continue with the free version.", { duration: 5000 });
    }
  }, [searchParams]);

  const resolvedPremiumMessage = useMemo(() => {
    if (!hasRealSubscription || !premiumUntil) return null;
    if (cancelAtPeriodEnd) {
      return {
        heading: `Your Premium will end on ${new Date(premiumUntil).toLocaleDateString()}`,
        body: "You've cancelled your subscription. You'll keep full access until this date.",
        status: "cancelled" as const,
      };
    }
    return {
      heading: `Renews on ${new Date(premiumUntil).toLocaleDateString()}`,
      body: null,
      status: "active" as const,
    };
  }, [cancelAtPeriodEnd, hasRealSubscription, premiumUntil]);

  const handleCheckout = async () => {
  return;
};

  const handleManageSubscription = async () => {
    if (!hasRealSubscription) {
      toast.info("No active subscription to manage yet.");
      return;
    }
    setManagingPortal(true);
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error || !data?.url) {
        toast.info("We could not open subscription management right now.");
        return;
      }
      if (data?.url) window.location.href = data.url;
    } catch {
      toast.info("We could not open subscription management right now.");
    } finally {
      setManagingPortal(false);
    }
  };

  return (
    <>
      <SEOHead title="Premium — LiveWithMS" description="Upgrade to Premium for AI-powered insights, clinical tools, and personalized programs." />
      <PageHeader title="Premium" subtitle="Your MS Intelligence System" showBack />

      <PullToRefresh onRefresh={handleRefresh} className="mx-auto max-w-lg px-4 py-4 pb-24">
        <StaggerContainer className="space-y-5">
          <StaggerItem>
            <div className="rounded-2xl bg-gradient-to-br from-primary/15 via-accent to-card p-6 text-center border border-primary/10">
              <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/15">
                <Heart className="h-8 w-8 text-primary" />
              </div>
              <h2 className="font-display text-xl font-bold text-foreground">
                {trialExpired
                  ? "Continue your progress"
                  : isInTrial
                  ? `${daysRemaining} day${daysRemaining !== 1 ? "s" : ""} left in your experience`
                  : "Your personal MS companion"}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
                {trialExpired
                  ? "Keep your insights, patterns, and daily support with Premium."
                  : "Patterns, insights, and daily guidance that help you feel your best."}
              </p>
            </div>
          </StaggerItem>

          {!isBillingStatusLoading && (
            <StaggerItem>
              <button
                onClick={async () => {
                  setRefreshing(true);
                  await checkSubscription();
                  queryClient.invalidateQueries({ queryKey: ["profile"] });
                  setRefreshing(false);
                }}
                disabled={refreshing}
                className="flex items-center justify-center gap-2 w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
                {refreshing ? "Checking…" : "Refresh subscription status"}
              </button>
            </StaggerItem>
          )}

          {isPremium ? (
            <StaggerItem>
              <div className={`rounded-xl p-5 text-center space-y-3 ${resolvedPremiumMessage?.status === "cancelled" ? "bg-amber-500/10 border border-amber-500/20" : "bg-[hsl(var(--brand-green))]/10 border border-[hsl(var(--brand-green))]/20"}`}>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Star className={`h-5 w-5 ${resolvedPremiumMessage?.status === "cancelled" ? "text-amber-500" : "text-[hsl(var(--brand-green))]"}`} />
                  <span className="text-sm font-semibold text-foreground">
                    {resolvedPremiumMessage?.status === "cancelled" ? "Premium — Cancelled" : "You're a Premium member!"}
                  </span>
                </div>

                {isBillingStatusLoading ? (
                  <p className="text-xs text-muted-foreground/70 italic">Checking subscription details…</p>
                ) : resolvedPremiumMessage ? (
                  <div className="space-y-1">
                    <p className={`text-sm ${resolvedPremiumMessage.status === "cancelled" ? "font-medium text-foreground" : "text-muted-foreground"}`}>
                      {resolvedPremiumMessage.heading}
                    </p>
                    {resolvedPremiumMessage.body && (
                      <p className="text-xs text-muted-foreground">{resolvedPremiumMessage.body}</p>
                    )}
                  </div>
                ) : null}

                {hasRealSubscription ? (
                  <button
                    onClick={handleManageSubscription}
                    disabled={managingPortal}
                    className="inline-flex items-center gap-2 rounded-full bg-secondary px-5 py-2 text-sm font-medium text-foreground transition-all hover:bg-secondary/80 disabled:opacity-60"
                  >
                    <CreditCard className="h-4 w-4" />
                    {managingPortal ? "Opening…" : cancelAtPeriodEnd ? "Resubscribe" : "Manage Subscription"}
                  </button>
                ) : !isBillingStatusLoading ? (
                  <p className="text-xs text-muted-foreground/70 italic">No active subscription to manage yet.</p>
                ) : null}
              </div>
            </StaggerItem>
          ) : (
            <>
              <StaggerItem>
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => setBilling("monthly")}
                    className={`rounded-full px-5 py-2 text-sm font-medium transition-all ${billing === "monthly" ? "bg-primary text-primary-foreground shadow-soft" : "bg-secondary text-muted-foreground"}`}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setBilling("annual")}
                    className={`rounded-full px-5 py-2 text-sm font-medium transition-all ${billing === "annual" ? "bg-primary text-primary-foreground shadow-soft" : "bg-secondary text-muted-foreground"}`}
                  >
                    Annual
                    <span className="ml-1.5 text-[10px] opacity-80">Save 36%</span>
                  </button>
                </div>
              </StaggerItem>

              <StaggerItem>
                <div className="text-center">
                  {billing === "annual" ? (
                    <>
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="font-display text-4xl font-bold text-foreground">$151.99</span>
                        <span className="text-sm text-muted-foreground">/year</span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">$12.67/month — billed annually</p>
                    </>
                  ) : (
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="font-display text-4xl font-bold text-foreground">$19.99</span>
                      <span className="text-sm text-muted-foreground">/month</span>
                    </div>
                  )}
                </div>
              </StaggerItem>
            </>
          )}

          <StaggerItem>
            <div className="rounded-xl bg-card p-5 shadow-soft space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Everything in Premium</p>
              {features.map(({ icon: Icon, label, desc }) => (
                <div key={label} className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 mt-0.5">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{label}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </StaggerItem>

          <StaggerItem>
            <div className="rounded-xl bg-card p-5 shadow-soft">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Free vs Premium</p>
              {[
                { feature: "Daily symptom tracking", free: true, premium: true },
                { feature: "Community access", free: true, premium: true },
                { feature: "Basic insights", free: true, premium: true },
                { feature: "AI Coach messages", free: "5/day", premium: "Unlimited" },
                { feature: "PDF reports", free: "1/month", premium: "Unlimited" },
                { feature: "AI Monthly Review", free: false, premium: true },
                { feature: "Doctor Mode", free: false, premium: true },
                { feature: "Fatigue Blueprint", free: false, premium: true },
                { feature: "Advanced Correlations", free: false, premium: true },
                { feature: "Programs", free: false, premium: true },
              ].map(({ feature, free, premium }) => (
                <div key={feature} className="flex items-center py-2 border-b border-border/50 last:border-0">
                  <span className="flex-1 text-sm text-foreground">{feature}</span>
                  <span className="w-16 text-center text-xs">
                    {typeof free === "boolean" ? (
                      free ? <Check className="h-4 w-4 text-[hsl(var(--brand-green))] mx-auto" /> : <span className="text-muted-foreground">—</span>
                    ) : (
                      <span className="text-muted-foreground">{free}</span>
                    )}
                  </span>
                  <span className="w-16 text-center text-xs">
                    {typeof premium === "boolean" ? (
                      premium ? <Check className="h-4 w-4 text-primary mx-auto" /> : <span className="text-muted-foreground">—</span>
                    ) : (
                      <span className="font-medium text-primary">{premium}</span>
                    )}
                  </span>
                </div>
              ))}
              <div className="flex items-center pt-2">
                <span className="flex-1" />
                <span className="w-16 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Free</span>
                <span className="w-16 text-center text-[10px] font-semibold uppercase tracking-wider text-primary">Premium</span>
              </div>
            </div>
          </StaggerItem>

          {!isPremium && (
            <StaggerItem>
              <div className="space-y-3">
                <button
                  onClick={handleCheckout}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-base font-bold text-primary-foreground shadow-soft transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Crown className="h-5 w-5" />
                  )}
                  {loading ? "Processing…" : trialExpired ? "Continue with Premium" : "Try your personal MS companion"}
                </button>
                {isCapacitor && (
                  <p className="text-center text-[11px] text-muted-foreground">
                    Payment processed securely by Apple
                  </p>
                )}
                <p className="text-center text-[11px] text-muted-foreground">
                  Cancel anytime • No commitment
                </p>
                <p className="text-center text-[11px] text-muted-foreground">
                  <a href="https://livewithms.com/policies/privacy-policy" className="underline">Privacy Policy</a>
                  {" · "}
                  <a href="https://livewithms.com/policies/terms-of-service" className="underline">Terms of Use</a>
                </p>
              </div>
            </StaggerItem>
          )}
        </StaggerContainer>
      </PullToRefresh>
    </>
  );
};

export default PremiumPage;
