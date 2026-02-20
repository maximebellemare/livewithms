import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles } from "lucide-react";

// Bump this key whenever you want to show the banner to all users again
const WHATS_NEW_KEY = "whats_new_v5";

interface Feature {
  emoji: string;
  title: string;
  description: string;
}

const FEATURES: Feature[] = [
  {
    emoji: "📈",
    title: "Insights Tour",
    description: "A new 4-step guide on the Insights page walks you through symptom trends, the 30-day heatmap, and the relapse risk indicator.",
  },
  {
    emoji: "🧠",
    title: "Relapse Risk Explained",
    description: "The tour now covers the Relapse Risk Indicator — how it scores Low → High risk, the 4-week sparkline, and which factors are contributing.",
  },
  {
    emoji: "🔄",
    title: "Reset Any Tour",
    description: "Head to Profile → Reset App Tour to replay the guided walkthrough for any page whenever you need a refresher.",
  },
];

const WhatsNewBanner = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem(WHATS_NEW_KEY);
    if (!seen) {
      // Small delay so the page settles first
      const t = setTimeout(() => setVisible(true), 1200);
      return () => clearTimeout(t);
    }
  }, []);

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem(WHATS_NEW_KEY, "1");
  };

  return createPortal(
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[9998] bg-black/50 backdrop-blur-sm"
            onClick={dismiss}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            className="fixed bottom-0 left-0 right-0 z-[9999] mx-auto max-w-lg"
          >
            <div className="rounded-t-3xl bg-card border border-border border-b-0 shadow-2xl p-6 space-y-5">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-foreground">What's New</h2>
                    <p className="text-xs text-muted-foreground">Recent updates to LiveWithMS</p>
                  </div>
                </div>
                <button
                  onClick={dismiss}
                  className="rounded-full p-1.5 text-muted-foreground hover:bg-secondary transition-colors"
                  aria-label="Dismiss"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Feature list */}
              <ul className="space-y-3">
                {FEATURES.map((f) => (
                  <li key={f.title} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-secondary text-lg">
                      {f.emoji}
                    </span>
                    <div className="space-y-0.5">
                      <p className="text-sm font-semibold text-foreground">{f.title}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">{f.description}</p>
                    </div>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <button
                onClick={dismiss}
                className="w-full rounded-2xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 active:scale-[0.98]"
              >
                Got it, thanks! 🧡
              </button>

              {/* Safe-area spacer for mobile */}
              <div className="h-safe-bottom" />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default WhatsNewBanner;
