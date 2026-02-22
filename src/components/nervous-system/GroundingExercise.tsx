import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, Ear, Hand, Wind, Cookie, ChevronRight, RotateCcw, Check, History, Trash2 } from "lucide-react";
import confetti from "canvas-confetti";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const senses = [
  { count: 5, sense: "things you can see", icon: Eye, color: "text-[hsl(var(--brand-blue))]", bg: "bg-[hsl(var(--brand-blue))]/10" },
  { count: 4, sense: "things you can touch", icon: Hand, color: "text-[hsl(var(--brand-green))]", bg: "bg-[hsl(var(--brand-green))]/10" },
  { count: 3, sense: "things you can hear", icon: Ear, color: "text-primary", bg: "bg-primary/10" },
  { count: 2, sense: "things you can smell", icon: Wind, color: "text-[hsl(var(--brand-warm-gray))]", bg: "bg-[hsl(var(--brand-warm-gray))]/10" },
  { count: 1, sense: "thing you can taste", icon: Cookie, color: "text-[hsl(var(--destructive))]", bg: "bg-[hsl(var(--destructive))]/10" },
];

const GroundingExercise = () => {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [started, setStarted] = useState(false);
  const [inputs, setInputs] = useState<string[][]>(senses.map((s) => Array(s.count).fill("")));
  const [showReflections, setShowReflections] = useState(false);
  const [breathProgress, setBreathProgress] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const [pastSessions, setPastSessions] = useState<any[]>([]);
  const [saved, setSaved] = useState(false);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [milestoneHit, setMilestoneHit] = useState<number | null>(null);
  const finished = step >= senses.length;

  const loadHistory = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("grounding_sessions")
      .select("*")
      .eq("user_id", user.id)
      .order("completed_at", { ascending: false })
      .limit(20);
    if (data) setPastSessions(data);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("grounding_sessions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .then(({ count }) => setTotalCount(count ?? 0));
  }, [user]);

  const saveSession = useCallback(async () => {
    if (!user || saved) return;
    const reflections = senses.map((sense, idx) => ({
      sense: sense.sense,
      items: inputs[idx].filter((v) => v.trim()),
    })).filter((r) => r.items.length > 0);
    if (reflections.length === 0) return;
    await supabase.from("grounding_sessions").insert({
      user_id: user.id,
      reflections,
    });
    setSaved(true);
    const newCount = (totalCount ?? 0) + 1;
    setTotalCount(newCount);
    if ([5, 10, 25].includes(newCount)) {
      setMilestoneHit(newCount);
      setTimeout(() => {
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 }, colors: ["#4CAF50", "#81C784", "#A5D6A7", "#E8751A", "#FFB347", "#a855f7", "#3b82f6"] });
      }, 300);
    }
  }, [user, inputs, saved, totalCount]);

  const deleteSession = useCallback(async (id: string) => {
    await supabase.from("grounding_sessions").delete().eq("id", id);
    setPastSessions((prev) => prev.filter((s) => s.id !== id));
    setTotalCount((c) => Math.max((c ?? 1) - 1, 0));
  }, []);

  const currentSense = senses[step];

  const vibrate = (pattern: number | number[]) => {
    try { navigator?.vibrate?.(pattern); } catch {}
  };

  const handleNext = () => {
    vibrate([5, 30, 5]);
    if (step < senses.length - 1) {
      setStep((s) => s + 1);
    } else {
      vibrate([10, 40, 10, 40, 10]);
      setStep(senses.length);
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#4CAF50", "#81C784", "#A5D6A7", "#E8751A", "#FFB347"],
      });
    }
  };

  const handleReset = () => {
    setStep(0);
    setStarted(false);
    setShowReflections(false);
    setBreathProgress(0);
    setSaved(false);
    setMilestoneHit(null);
    setInputs(senses.map((s) => Array(s.count).fill("")));
  };

  // Breathing pause before showing reflections
  useEffect(() => {
    if (!finished) return;
    setBreathProgress(0);
    const duration = 4000; // 4 seconds
    const interval = 50;
    let elapsed = 0;
    const timer = setInterval(() => {
      elapsed += interval;
      setBreathProgress(Math.min(elapsed / duration, 1));
      if (elapsed >= duration) {
        clearInterval(timer);
        setShowReflections(true);
        saveSession();
      }
    }, interval);
    return () => clearInterval(timer);
  }, [finished, saveSession]);

  const updateInput = (senseIdx: number, itemIdx: number, value: string) => {
    setInputs((prev) => {
      const copy = prev.map((arr) => [...arr]);
      copy[senseIdx][itemIdx] = value;
      return copy;
    });
  };

  if (showHistory) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setShowHistory(false)}
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <RotateCcw className="h-4 w-4" />
          Back
        </button>
        <h3 className="font-display text-lg font-bold text-foreground">Past Sessions</h3>
        {pastSessions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No past sessions yet. Complete an exercise to see your history.</p>
        ) : (
          pastSessions.map((session) => (
            <div key={session.id} className="rounded-xl bg-card p-4 shadow-soft space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">
                  {format(new Date(session.completed_at), "MMM d, yyyy · h:mm a")}
                </p>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      aria-label="Delete session"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="max-w-xs">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete session?</AlertDialogTitle>
                      <AlertDialogDescription>This grounding session will be permanently removed.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteSession(session.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
              {(session.reflections as any[]).map((r: any, idx: number) => {
                const sense = senses[idx] || senses[0];
                const Icon = sense.icon;
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Icon className={`h-3.5 w-3.5 ${sense.color}`} />
                      <span className="text-xs text-muted-foreground capitalize">{r.sense}</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {r.items.map((item: string, i: number) => (
                        <span key={i} className={`inline-block rounded-lg ${sense.bg} px-2 py-0.5 text-xs font-medium text-foreground`}>
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>
    );
  }

  if (!started) {
    return (
      <div className="space-y-5">
        <div className="rounded-xl bg-card p-5 shadow-soft text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <Eye className="h-7 w-7 text-primary" />
          </div>
          <h3 className="font-display text-lg font-bold text-foreground">5-4-3-2-1 Grounding</h3>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
            Engage each of your senses to gently bring yourself back to the present moment. There's no rush — take your time.
          </p>
          {user && totalCount !== null && totalCount > 0 && (
            <p className="text-xs font-medium text-muted-foreground">
              🌿 {totalCount} session{totalCount !== 1 ? "s" : ""} completed
            </p>
          )}
          <div className="flex flex-col gap-2">
            <button
              onClick={() => setStarted(true)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-soft transition-all hover:opacity-90 active:scale-[0.98]"
            >
              Begin Exercise
              <ChevronRight className="h-4 w-4" />
            </button>
            {user && (
              <button
                onClick={() => { loadHistory(); setShowHistory(true); }}
                className="inline-flex items-center justify-center gap-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2"
              >
                <History className="h-4 w-4" />
                Past Sessions
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (finished) {
    const hasAnyInput = inputs.some((group) => group.some((v) => v.trim()));

    return (
      <div className="space-y-5">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-xl bg-card p-6 shadow-soft text-center space-y-5"
        >
          {/* Breathing circle during pause */}
          {!showReflections ? (
            <div className="space-y-4">
              <div className="relative mx-auto flex h-24 w-24 items-center justify-center">
                {/* Pulsing ring */}
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-[hsl(var(--brand-green))]/30"
                  animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 4, ease: "easeInOut" }}
                />
                {/* Progress ring */}
                <svg className="absolute inset-0 -rotate-90" viewBox="0 0 96 96">
                  <circle cx="48" cy="48" r="42" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
                  <circle
                    cx="48" cy="48" r="42" fill="none"
                    stroke="hsl(var(--brand-green))"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 42}
                    strokeDashoffset={2 * Math.PI * 42 * (1 - breathProgress)}
                    className="transition-all duration-100"
                  />
                </svg>
                <motion.span
                  className="text-3xl"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 4, ease: "easeInOut" }}
                >
                  🌿
                </motion.span>
              </div>
              <p className="text-sm font-medium text-muted-foreground">Take a slow breath…</p>
            </div>
          ) : (
            <>
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[hsl(var(--brand-green))]/10">
                <Check className="h-7 w-7 text-[hsl(var(--brand-green))]" />
              </div>
              <h3 className="font-display text-lg font-bold text-foreground">You're grounded 🌿</h3>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
                Well done. Notice how you feel right now.
              </p>

              {milestoneHit && (
                <div className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 space-y-1">
                  <p className="text-base font-bold text-foreground">
                    {milestoneHit === 5 ? "🌱" : milestoneHit === 10 ? "🌿" : "🌳"} {milestoneHit} sessions!
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {milestoneHit === 5
                      ? "You're building a real grounding habit. Five sessions down — keep it up!"
                      : milestoneHit === 10
                      ? "Double digits! Your nervous system thanks you for showing up consistently."
                      : "25 sessions is incredible. You've made grounding a true part of your routine."}
                  </p>
                </div>
              )}

              <button
                onClick={handleReset}
                className="inline-flex items-center gap-2 rounded-xl bg-secondary px-5 py-2.5 text-sm font-medium text-foreground transition-all hover:bg-secondary/80"
              >
                <RotateCcw className="h-4 w-4" />
                Start Over
              </button>
            </>
          )}
        </motion.div>

        {showReflections && hasAnyInput && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-xl bg-card p-5 shadow-soft space-y-4"
          >
            <h4 className="text-sm font-semibold text-foreground">Your reflections</h4>
            {senses.map((sense, sIdx) => {
              const filled = inputs[sIdx].filter((v) => v.trim());
              if (filled.length === 0) return null;
              const Icon = sense.icon;
              return (
                <div key={sIdx} className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${sense.color}`} />
                    <span className="text-xs font-medium text-muted-foreground capitalize">{sense.sense}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {filled.map((v, i) => (
                      <span
                        key={i}
                        className={`inline-block rounded-lg ${sense.bg} px-2.5 py-1 text-xs font-medium text-foreground`}
                      >
                        {v}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}
      </div>
    );
  }

  const Icon = currentSense.icon;

  return (
    <div className="space-y-5">
      {/* Progress dots */}
      <div className="flex items-center justify-center gap-2">
        {senses.map((s, i) => (
          <div
            key={i}
            className={`h-2 rounded-full transition-all duration-300 ${
              i < step ? "w-2 bg-primary" : i === step ? "w-6 bg-primary" : "w-2 bg-muted"
            }`}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.25 }}
          className="rounded-xl bg-card p-5 shadow-soft space-y-4"
        >
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${currentSense.bg}`}>
              <Icon className={`h-5 w-5 ${currentSense.color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{currentSense.count}</p>
              <p className="text-sm text-muted-foreground">{currentSense.sense}</p>
            </div>
          </div>

          <div className="space-y-2">
            {inputs[step].map((val, i) => (
              <input
                key={i}
                type="text"
                value={val}
                onChange={(e) => updateInput(step, i, e.target.value)}
                placeholder={`${i + 1}. ...`}
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            className="relative z-50 w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground shadow-soft transition-all hover:opacity-90 active:scale-[0.98]"
          >
            {step < senses.length - 1 ? "Next Sense" : "Complete"}
            <ChevronRight className="h-4 w-4" />
          </button>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default GroundingExercise;
