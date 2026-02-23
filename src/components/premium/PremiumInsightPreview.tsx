import { Crown, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usePremium } from "@/hooks/usePremium";
import { ReactNode } from "react";

interface Props {
  title: string;
  description: string;
  children: ReactNode;
}

/** Wraps premium insight content with a blurred overlay + unlock CTA for free users */
const PremiumInsightPreview = ({ title, description, children }: Props) => {
  const { isPremium, isLoading } = usePremium();
  const navigate = useNavigate();

  if (isLoading) return null;
  if (isPremium) return <>{children}</>;

  return (
    <div className="relative rounded-xl overflow-hidden">
      {/* Blurred content preview */}
      <div className="pointer-events-none select-none" aria-hidden>
        <div className="blur-[6px] opacity-60 saturate-50">
          {children}
        </div>
      </div>

      {/* Unlock overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-t from-card/95 via-card/70 to-transparent rounded-xl">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 mb-3">
          <Lock className="h-5 w-5 text-primary" />
        </div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="mt-1 text-xs text-muted-foreground text-center max-w-[220px] leading-relaxed">
          {description}
        </p>
        <button
          onClick={() => navigate("/premium")}
          className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-soft transition-all hover:opacity-90 active:scale-[0.98]"
        >
          <Crown className="h-3.5 w-3.5" />
          Unlock with Premium
        </button>
      </div>
    </div>
  );
};

export default PremiumInsightPreview;
