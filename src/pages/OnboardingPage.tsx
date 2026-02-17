import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, ChevronLeft } from "lucide-react";

const msTypes = ["RRMS", "PPMS", "SPMS", "CIS", "Unknown"];
const commonSymptoms = ["Fatigue", "Pain", "Brain Fog", "Numbness", "Vision Issues", "Spasticity", "Balance", "Bladder"];
const goals = ["Better Sleep", "More Energy", "Less Pain", "Improved Mood", "Better Mobility", "Sharper Thinking"];

const OnboardingPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [msType, setMsType] = useState("");
  const [yearDiagnosed, setYearDiagnosed] = useState("");
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);

  const toggleItem = (item: string, list: string[], setter: (v: string[]) => void) => {
    setter(list.includes(item) ? list.filter((i) => i !== item) : [...list, item]);
  };

  const finish = () => {
    localStorage.setItem(
      "ms-profile",
      JSON.stringify({ msType, yearDiagnosed, symptoms, goals: selectedGoals })
    );
    localStorage.setItem("ms-onboarded", "true");
    navigate("/today");
  };

  const steps = [
    // Welcome
    <div key="welcome" className="flex flex-col items-center justify-center px-6 text-center animate-fade-in">
      <span className="text-5xl">🧡</span>
      <h1 className="mt-6 font-display text-3xl font-bold text-foreground">Welcome to LiveWithMS</h1>
      <p className="mt-3 text-base text-muted-foreground leading-relaxed">
        Your personal companion for living well with Multiple Sclerosis. Let's set things up — it only takes a minute.
      </p>
      <p className="mt-6 text-xs text-muted-foreground">
        ⚕️ This app does not provide medical advice. Always consult your healthcare provider.
      </p>
    </div>,
    // MS Type
    <div key="type" className="px-6 animate-fade-in">
      <h2 className="font-display text-2xl font-semibold text-foreground">Your MS Type</h2>
      <p className="mt-1 text-sm text-muted-foreground">This helps us personalize your experience.</p>
      <div className="mt-6 space-y-2">
        {msTypes.map((type) => (
          <button
            key={type}
            onClick={() => setMsType(type)}
            className={`tap-highlight-none w-full rounded-xl px-4 py-3.5 text-left text-sm font-medium transition-all active:scale-[0.98] ${
              msType === type
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-card text-foreground shadow-soft"
            }`}
          >
            {type}
          </button>
        ))}
      </div>
      <div className="mt-4">
        <label className="block text-sm font-medium text-foreground">Year diagnosed (optional)</label>
        <input
          type="number"
          min={1950}
          max={2026}
          placeholder="e.g. 2020"
          value={yearDiagnosed}
          onChange={(e) => setYearDiagnosed(e.target.value)}
          className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
    </div>,
    // Symptoms
    <div key="symptoms" className="px-6 animate-fade-in">
      <h2 className="font-display text-2xl font-semibold text-foreground">Key Symptoms</h2>
      <p className="mt-1 text-sm text-muted-foreground">Select the symptoms that affect you most.</p>
      <div className="mt-6 flex flex-wrap gap-2">
        {commonSymptoms.map((s) => (
          <button
            key={s}
            onClick={() => toggleItem(s, symptoms, setSymptoms)}
            className={`tap-highlight-none rounded-full px-4 py-2 text-sm font-medium transition-all active:scale-95 ${
              symptoms.includes(s)
                ? "bg-primary text-primary-foreground"
                : "bg-card text-foreground shadow-soft"
            }`}
          >
            {s}
          </button>
        ))}
      </div>
    </div>,
    // Goals
    <div key="goals" className="px-6 animate-fade-in">
      <h2 className="font-display text-2xl font-semibold text-foreground">Your Goals</h2>
      <p className="mt-1 text-sm text-muted-foreground">What would you like to improve?</p>
      <div className="mt-6 flex flex-wrap gap-2">
        {goals.map((g) => (
          <button
            key={g}
            onClick={() => toggleItem(g, selectedGoals, setSelectedGoals)}
            className={`tap-highlight-none rounded-full px-4 py-2 text-sm font-medium transition-all active:scale-95 ${
              selectedGoals.includes(g)
                ? "bg-primary text-primary-foreground"
                : "bg-card text-foreground shadow-soft"
            }`}
          >
            {g}
          </button>
        ))}
      </div>
    </div>,
    // Ready
    <div key="ready" className="flex flex-col items-center justify-center px-6 text-center animate-fade-in">
      <span className="text-5xl">🌿</span>
      <h2 className="mt-6 font-display text-2xl font-semibold text-foreground">You're all set!</h2>
      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
        Your companion is ready. Start tracking, stay informed, and remember — you're not alone on this journey.
      </p>
    </div>,
  ];

  const isLast = step === steps.length - 1;
  const isFirst = step === 0;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Progress */}
      <div className="px-4 pt-4">
        <div className="mx-auto flex max-w-lg gap-1">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-all ${
                i <= step ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 items-center">
        <div className="mx-auto w-full max-w-lg py-8">{steps[step]}</div>
      </div>

      {/* Navigation */}
      <div className="mx-auto flex w-full max-w-lg gap-3 px-6 pb-8">
        {!isFirst && (
          <button
            onClick={() => setStep((s) => s - 1)}
            className="flex items-center gap-1 rounded-full bg-secondary px-5 py-3 text-sm font-medium text-secondary-foreground transition-all active:scale-[0.98]"
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </button>
        )}
        <button
          onClick={isLast ? finish : () => setStep((s) => s + 1)}
          className="flex flex-1 items-center justify-center gap-1 rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-soft transition-all hover:opacity-90 active:scale-[0.98]"
        >
          {isLast ? "Let's Go! 🧡" : isFirst ? "Get Started" : "Next"}
          {!isLast && <ChevronRight className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
};

export default OnboardingPage;
