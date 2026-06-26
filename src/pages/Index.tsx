import { useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getStoredReferral, appendReferralToUrl } from "@/lib/affiliate";

const Index = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const activeReferral = useMemo(
    () => searchParams.get("ref")?.trim().toLowerCase() || getStoredReferral(),
    [searchParams],
  );
  const authPath = activeReferral ? `/auth?ref=${encodeURIComponent(activeReferral)}` : "/auth";
  const googlePlayUrl = useMemo(
    () =>
      appendReferralToUrl(
        import.meta.env.VITE_GOOGLE_PLAY_URL || "https://play.google.com/store/apps/details?id=com.livewithms.app",
        activeReferral,
      ),
    [activeReferral],
  );
  const appStoreUrl = useMemo(
    () => appendReferralToUrl(import.meta.env.VITE_APP_STORE_URL || "", activeReferral),
    [activeReferral],
  );

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <div className="animate-fade-in">
        <span className="text-6xl">🧡</span>
        <h1 className="mt-6 font-display text-4xl font-bold tracking-tight text-foreground">
          LiveWithMS
        </h1>
        <p className="mt-3 text-lg text-muted-foreground leading-relaxed">
          Your personal companion for living well with Multiple Sclerosis
        </p>
        <button
          onClick={() => navigate(authPath)}
          className="mt-8 rounded-full bg-primary px-8 py-3.5 text-base font-semibold text-primary-foreground shadow-card transition-all hover:opacity-90 active:scale-[0.98]"
        >
          Get Started
        </button>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          {appStoreUrl ? (
            <a
              href={appStoreUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
            >
              App Store
            </a>
          ) : null}
          <a
            href={googlePlayUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
          >
            Google Play
          </a>
        </div>
        {activeReferral ? (
          <p className="mt-3 text-xs text-muted-foreground">
            Referred by <span className="font-medium text-foreground">{activeReferral}</span>
          </p>
        ) : null}
        <p className="mt-4 text-xs text-muted-foreground">
          Free · Private · Not medical advice
        </p>
        <div className="mt-6 flex items-center justify-center gap-3 text-[11px] text-muted-foreground">
          <a href="https://livewithms.com/policies/privacy-policy" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">Privacy Policy</a>
          <span>·</span>
          <a href="https://livewithms.com/policies/terms-of-service" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">Terms</a>
          <span>·</span>
          <a href="mailto:support@livewithms.com" className="hover:text-primary transition-colors">Contact support</a>
        </div>
      </div>
    </div>
  );
};

export default Index;
