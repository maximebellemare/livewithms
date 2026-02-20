import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, ChevronLeft } from "lucide-react";

interface TooltipStep {
  target: string;
  title: string;
  description: string;
  position?: "top" | "bottom";
}

interface OnboardingTooltipsProps {
  steps: TooltipStep[];
  storageKey: string;
}

const OnboardingTooltips = ({ steps, storageKey }: OnboardingTooltipsProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number; width: number; placement: "top" | "bottom" }>({
    top: 0, left: 0, width: 300, placement: "bottom",
  });

  useEffect(() => {
    const dismissed = localStorage.getItem(storageKey);
    if (dismissed) return;

    let cancelled = false;
    const check = () => {
      if (cancelled) return;
      const el = document.querySelector(`[data-tour="${steps[0].target}"]`);
      if (el) setVisible(true);
      else setTimeout(check, 500);
    };
    const timer = setTimeout(check, 800);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [storageKey, steps]);

  const computePosition = useCallback(() => {
    if (!visible || currentStep >= steps.length) return;
    const step = steps[currentStep];
    const el = document.querySelector(`[data-tour="${step.target}"]`);
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const placement = step.position ?? (rect.top > 300 ? "top" : "bottom");
    const tooltipWidth = Math.min(320, window.innerWidth - 32);
    // Account for bottom nav (~80px) so the tooltip never hides behind it
    const bottomNavHeight = 80;
    const maxBottom = window.innerHeight - bottomNavHeight;

    let top = placement === "bottom" ? rect.bottom + 12 : rect.top - 12;
    // If placing below and tooltip would overflow bottom nav, flip to top
    const estimatedTooltipHeight = 140;
    if (placement === "bottom" && top + estimatedTooltipHeight > maxBottom) {
      top = rect.top - 12;
    }

    setPos({
      top,
      left: Math.max(16, Math.min(rect.left + rect.width / 2 - tooltipWidth / 2, window.innerWidth - tooltipWidth - 16)),
      width: tooltipWidth,
      placement: placement === "bottom" && top < rect.bottom ? "top" : placement,
    });
  }, [visible, currentStep, steps]);

  useEffect(() => {
    if (!visible) return;
    // Small delay so scroll settles before positioning
    const t = setTimeout(computePosition, 100);
    window.addEventListener("resize", computePosition);
    return () => { clearTimeout(t); window.removeEventListener("resize", computePosition); };
  }, [computePosition, visible]);

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem(storageKey, "1");
  };

  const next = () => {
    if (currentStep < steps.length - 1) setCurrentStep((s) => s + 1);
    else dismiss();
  };

  const prev = () => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  };

  if (!visible || currentStep >= steps.length) return null;

  const step = steps[currentStep];
  const isLast = currentStep === steps.length - 1;

  return createPortal(
    <AnimatePresence>
      {visible && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9998] bg-black/40"
            onClick={dismiss}
          />

          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: pos.placement === "bottom" ? -8 : 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            style={{
              position: "fixed",
              top: pos.placement === "bottom" ? pos.top : undefined,
              bottom: pos.placement === "top" ? `${window.innerHeight - pos.top}px` : undefined,
              left: pos.left,
              width: pos.width,
              zIndex: 9999,
            }}
            className="rounded-2xl bg-card border border-border shadow-xl p-4 space-y-3"
          >
            <div
              className={`absolute left-1/2 -translate-x-1/2 h-3 w-3 rotate-45 bg-card border-border ${
                pos.placement === "bottom"
                  ? "-top-1.5 border-l border-t"
                  : "-bottom-1.5 border-r border-b"
              }`}
            />

            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-foreground">{step.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{step.description}</p>
              </div>
              <button onClick={dismiss} className="rounded-full p-1 text-muted-foreground hover:bg-secondary shrink-0">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex gap-1.5">
                {steps.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all ${
                      i === currentStep ? "w-4 bg-primary" : "w-1.5 bg-muted-foreground/30"
                    }`}
                  />
                ))}
              </div>

              <div className="flex items-center gap-1.5">
                {currentStep > 0 && (
                  <button
                    onClick={prev}
                    className="flex items-center gap-0.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground hover:bg-secondary transition-colors"
                  >
                    <ChevronLeft className="h-3 w-3" /> Back
                  </button>
                )}
                <button
                  onClick={next}
                  className="flex items-center gap-0.5 rounded-lg bg-primary px-3 py-1.5 text-[11px] font-semibold text-primary-foreground transition-all hover:opacity-90 active:scale-[0.98]"
                >
                  {isLast ? "Got it!" : <>Next <ChevronRight className="h-3 w-3" /></>}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default OnboardingTooltips;
