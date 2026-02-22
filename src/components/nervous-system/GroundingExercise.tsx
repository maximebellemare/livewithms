import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, Ear, Hand, Wind, Cookie, ChevronRight, RotateCcw, Check } from "lucide-react";

const senses = [
  { count: 5, sense: "things you can see", icon: Eye, color: "text-[hsl(var(--brand-blue))]", bg: "bg-[hsl(var(--brand-blue))]/10" },
  { count: 4, sense: "things you can touch", icon: Hand, color: "text-[hsl(var(--brand-green))]", bg: "bg-[hsl(var(--brand-green))]/10" },
  { count: 3, sense: "things you can hear", icon: Ear, color: "text-primary", bg: "bg-primary/10" },
  { count: 2, sense: "things you can smell", icon: Wind, color: "text-[hsl(var(--brand-warm-gray))]", bg: "bg-[hsl(var(--brand-warm-gray))]/10" },
  { count: 1, sense: "thing you can taste", icon: Cookie, color: "text-[hsl(var(--destructive))]", bg: "bg-[hsl(var(--destructive))]/10" },
];

const GroundingExercise = () => {
  const [step, setStep] = useState(0);
  const [started, setStarted] = useState(false);
  const [inputs, setInputs] = useState<string[][]>(senses.map((s) => Array(s.count).fill("")));
  const finished = step >= senses.length;

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
    }
  };

  const handleReset = () => {
    setStep(0);
    setStarted(false);
    setInputs(senses.map((s) => Array(s.count).fill("")));
  };

  const updateInput = (senseIdx: number, itemIdx: number, value: string) => {
    setInputs((prev) => {
      const copy = prev.map((arr) => [...arr]);
      copy[senseIdx][itemIdx] = value;
      return copy;
    });
  };

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
          <button
            onClick={() => setStarted(true)}
            className="inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-soft transition-all hover:opacity-90 active:scale-[0.98]"
          >
            Begin Exercise
            <ChevronRight className="h-4 w-4" />
          </button>
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
          className="rounded-xl bg-card p-6 shadow-soft text-center space-y-4"
        >
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[hsl(var(--brand-green))]/10">
            <Check className="h-7 w-7 text-[hsl(var(--brand-green))]" />
          </div>
          <h3 className="font-display text-lg font-bold text-foreground">You're grounded 🌿</h3>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
            Well done. Take a slow breath and notice how you feel right now.
          </p>
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-2 rounded-xl bg-secondary px-5 py-2.5 text-sm font-medium text-foreground transition-all hover:bg-secondary/80"
          >
            <RotateCcw className="h-4 w-4" />
            Start Over
          </button>
        </motion.div>

        {hasAnyInput && (
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
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground shadow-soft transition-all hover:opacity-90 active:scale-[0.98]"
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
