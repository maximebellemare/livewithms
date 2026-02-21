import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart3, Heart, CalendarClock, HelpCircle, ArrowLeft, Sparkles } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import SEOHead from "@/components/SEOHead";
import CoachChat from "@/components/coach/CoachChat";
import type { CoachMode } from "@/hooks/useCoach";

const modes: { id: CoachMode; icon: typeof Heart; label: string; description: string; color: string }[] = [
  {
    id: "data",
    icon: BarChart3,
    label: "Understand My Data",
    description: "Get plain-language explanations of your symptom trends, correlations, and health patterns.",
    color: "text-[hsl(var(--brand-blue))]",
  },
  {
    id: "emotional",
    icon: Heart,
    label: "Talk About How I'm Feeling",
    description: "Gentle, compassionate support using CBT & ACT techniques. No judgement, just understanding.",
    color: "text-[hsl(var(--destructive))]",
  },
  {
    id: "planning",
    icon: CalendarClock,
    label: "Help Me Plan My Day",
    description: "Energy-aware day planning using the Spoon Theory. Pace yourself and protect your energy.",
    color: "text-[hsl(var(--brand-green))]",
  },
  {
    id: "guidance",
    icon: HelpCircle,
    label: "How Do I Use the App?",
    description: "Get step-by-step guidance on navigating features, tracking, reports, and more.",
    color: "text-[hsl(var(--brand-orange))]",
  },
];

const CoachPage = () => {
  const [activeMode, setActiveMode] = useState<CoachMode | null>(null);

  return (
    <>
      <SEOHead title="AI Support Coach — LiveWithMS" description="Your personal AI coach for MS support, data insights, and wellness guidance." />

      <AnimatePresence mode="wait">
        {activeMode ? (
          <motion.div
            key="chat"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col h-[calc(100dvh-8rem)]"
          >
            <div className="flex items-center gap-3 px-4 pt-4 pb-2">
              <button
                onClick={() => setActiveMode(null)}
                className="flex items-center justify-center h-9 w-9 rounded-xl bg-secondary text-foreground hover:bg-accent transition-colors"
                aria-label="Back to coach menu"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div className="flex-1">
                <h2 className="text-base font-semibold font-heading">
                  {modes.find((m) => m.id === activeMode)?.label}
                </h2>
              </div>
            </div>
            <CoachChat mode={activeMode} />
          </motion.div>
        ) : (
          <motion.div
            key="menu"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
          >
            <PageHeader title="AI Coach" subtitle="Your personal MS support companion" />

            {/* Disclaimer */}
            <div className="mx-4 mb-4 rounded-xl border border-border bg-secondary/50 px-4 py-3">
              <p className="text-xs text-muted-foreground leading-relaxed">
                <Sparkles className="inline h-3 w-3 mr-1 text-primary" />
                This AI provides support and educational guidance only. It does not replace medical care.
              </p>
            </div>

            {/* Mode cards */}
            <div className="px-4 space-y-3 pb-6">
              {modes.map((m, i) => (
                <motion.button
                  key={m.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08, duration: 0.3 }}
                  onClick={() => setActiveMode(m.id)}
                  className="w-full flex items-start gap-4 rounded-2xl border border-border bg-card p-5 text-left shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-card)] hover:border-primary/30 transition-all active:scale-[0.98]"
                >
                  <div className={`mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary ${m.color}`}>
                    <m.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-foreground mb-1">{m.label}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{m.description}</p>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default CoachPage;
