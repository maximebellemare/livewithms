import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";
import { StaggerContainer, StaggerItem } from "@/components/StaggeredReveal";
import { BarChart3, Heart, CalendarClock, HelpCircle, ArrowLeft, Sparkles, History } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import SEOHead from "@/components/SEOHead";
import CoachChat from "@/components/coach/CoachChat";
import CoachHistory from "@/components/coach/CoachHistory";
import ProgramsSection from "@/components/premium/ProgramsSection";
import { useCoach, type CoachMode } from "@/hooks/useCoach";

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
  const location = useLocation();
  const [activeMode, setActiveMode] = useState<CoachMode | null>(null);
  const [resumeSessionId, setResumeSessionId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [initialMessage, setInitialMessage] = useState<string | null>(null);

  // Auto-send support: navigate with state.autoSend to auto-open emotional mode and send a message
  useEffect(() => {
    const state = location.state as { autoSend?: string } | null;
    if (state?.autoSend) {
      setInitialMessage(state.autoSend);
      setResumeSessionId(null);
      setActiveMode("emotional");
      // Clear the state so it doesn't re-trigger on navigation
      window.history.replaceState({}, "");
    }
  }, [location.state]);

  const handleNewChat = (mode: CoachMode) => {
    setResumeSessionId(null);
    setActiveMode(mode);
  };

  const handleResumeSession = useCallback((sessionId: string, mode: CoachMode) => {
    setResumeSessionId(sessionId);
    setActiveMode(mode);
  }, []);

  const handleBack = () => {
    setActiveMode(null);
    setResumeSessionId(null);
  };

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
                onClick={handleBack}
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
            <CoachChat mode={activeMode} resumeSessionId={resumeSessionId} initialMessage={initialMessage} />
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
            <StaggerContainer className="px-0">
            <StaggerItem>
            <div className="mx-4 mb-4 rounded-xl border border-border bg-secondary/50 px-4 py-3">
              <p className="text-xs text-muted-foreground leading-relaxed">
                <Sparkles className="inline h-3 w-3 mr-1 text-primary" />
                This AI provides support and educational guidance only. It does not replace medical care.
              </p>
            </div>
            </StaggerItem>

            {/* Mode cards */}
            <div className="px-4 space-y-3">
              {modes.map((m) => (
                <StaggerItem key={m.id}>
                <button
                  onClick={() => handleNewChat(m.id)}
                  className="w-full flex items-start gap-4 rounded-2xl border border-border bg-card p-5 text-left shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-card)] hover:border-primary/30 transition-all active:scale-[0.98]"
                >
                  <div className={`mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary ${m.color}`}>
                    <m.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-foreground mb-1">{m.label}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{m.description}</p>
                  </div>
                </button>
                </StaggerItem>
              ))}
            </div>

            {/* History section */}
            <StaggerItem>
            <div className="mt-6">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="flex items-center gap-2 px-4 mb-2 w-full text-left"
              >
                <History className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-semibold text-foreground">Recent Conversations</span>
                <span className="text-xs text-muted-foreground ml-auto">{showHistory ? "Hide" : "Show"}</span>
              </button>
              <AnimatePresence>
                {showHistory && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <CoachHistory onSelectSession={handleResumeSession} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            </StaggerItem>

            {/* Programs */}
            <StaggerItem>
              <div className="mt-2 px-4">
                <ProgramsSection />
              </div>
            </StaggerItem>
            </StaggerContainer>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default CoachPage;
