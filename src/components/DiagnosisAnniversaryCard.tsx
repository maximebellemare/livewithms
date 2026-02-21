import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { X, Heart } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";

const DiagnosisAnniversaryCard = () => {
  const { data: profile } = useProfile();
  const [dismissed, setDismissed] = useState(false);
  const [fired, setFired] = useState(false);

  const diagnosisDate = profile?.diagnosis_date;

  // Check if today is the anniversary
  const isAnniversary = (() => {
    if (!diagnosisDate) return false;
    const [y, m, d] = diagnosisDate.split("-").map(Number);
    const now = new Date();
    return now.getMonth() + 1 === m && now.getDate() === d && now.getFullYear() > y;
  })();

  const years = (() => {
    if (!diagnosisDate) return 0;
    const dxYear = Number(diagnosisDate.split("-")[0]);
    return new Date().getFullYear() - dxYear;
  })();

  // Dismiss key per year
  const dismissKey = `anniversary_dismissed_${new Date().getFullYear()}`;

  useEffect(() => {
    if (localStorage.getItem(dismissKey)) setDismissed(true);
  }, [dismissKey]);

  // Fire confetti once
  useEffect(() => {
    if (!isAnniversary || dismissed || fired) return;
    setFired(true);
    const timer = setTimeout(() => {
      confetti({ particleCount: 100, spread: 80, origin: { y: 0.45 }, colors: ["#E8751A", "#f59e0b", "#10b981", "#ec4899", "#6366f1"] });
      setTimeout(() => confetti({ particleCount: 60, spread: 60, origin: { y: 0.4 }, angle: 60 }), 250);
      setTimeout(() => confetti({ particleCount: 60, spread: 60, origin: { y: 0.4 }, angle: 120 }), 400);
    }, 500);
    return () => clearTimeout(timer);
  }, [isAnniversary, dismissed, fired]);

  const handleDismiss = () => {
    localStorage.setItem(dismissKey, "1");
    setDismissed(true);
  };

  if (!isAnniversary || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -12, scale: 0.96 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-accent/30 to-secondary/40 p-5 shadow-soft"
      >
        {/* Dismiss */}
        <button
          onClick={handleDismiss}
          className="absolute right-3 top-3 rounded-full p-1 text-muted-foreground hover:bg-secondary transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-primary/15">
            <span className="text-3xl">🎗️</span>
          </div>

          <div className="min-w-0 space-y-1.5">
            <h3 className="font-display text-base font-bold text-foreground">
              {years}-Year Diagnosis Anniversary
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Today marks <span className="font-semibold text-foreground">{years} year{years !== 1 ? "s" : ""}</span> since
              your diagnosis. Every day you show up is a testament to your strength. 💪
            </p>
            <div className="flex items-center gap-1.5 pt-1">
              <Heart className="h-3.5 w-3.5 text-primary" fill="currentColor" />
              <span className="text-xs font-medium text-primary">You're stronger than you know</span>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default DiagnosisAnniversaryCard;
