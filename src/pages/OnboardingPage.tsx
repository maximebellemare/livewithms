import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, ChevronLeft, Shield, CheckCircle2, Globe, Calendar } from "lucide-react";
import { useUpdateProfile } from "@/hooks/useProfile";
import { toast } from "sonner";

const msTypes = ["RRMS", "PPMS", "SPMS", "CIS", "Unknown"];
const commonSymptoms = ["Fatigue", "Pain", "Brain Fog", "Numbness", "Vision Issues", "Spasticity", "Balance", "Bladder"];
const goals = ["Better Sleep", "More Energy", "Less Pain", "Improved Mood", "Better Mobility", "Sharper Thinking"];
const countries = [
  "United States", "United Kingdom", "Canada", "Australia", "Germany", "France",
  "Netherlands", "Spain", "Italy", "Sweden", "Norway", "Denmark", "Finland",
  "Belgium", "Switzerland", "Austria", "Ireland", "New Zealand", "Brazil",
  "Mexico", "India", "Japan", "South Korea", "South Africa", "Other",
];
const ageRanges = ["18–24", "25–34", "35–44", "45–54", "55–64", "65+"];

const consentItems = [
  { id: "medical_disclaimer", label: "I understand this app is NOT a substitute for professional medical advice, diagnosis, or treatment. I will always consult my neurologist or healthcare provider for medical decisions.", required: true },
  { id: "health_data", label: "I understand my health data is stored securely and encrypted", required: true },
  { id: "not_medical", label: "I acknowledge that symptom tracking and insights are for informational purposes only", required: true },
  { id: "data_control", label: "I can export or delete my data at any time from Privacy settings", required: true },
];

const OnboardingPage = () => {
  const navigate = useNavigate();
  const updateProfile = useUpdateProfile();
  const [step, setStep] = useState(0);
  const [msType, setMsType] = useState("");
  const [yearDiagnosed, setYearDiagnosed] = useState("");
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [country, setCountry] = useState("");
  const [ageRange, setAgeRange] = useState("");
  const [consents, setConsents] = useState<Record<string, boolean>>({});

  const allConsentsAccepted = consentItems.filter((c) => c.required).every((c) => consents[c.id]);

  const toggleItem = (item: string, list: string[], setter: (v: string[]) => void) => {
    setter(list.includes(item) ? list.filter((i) => i !== item) : [...list, item]);
  };

  const toggleConsent = (id: string) => {
    setConsents((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const finish = async () => {
    try {
      await updateProfile.mutateAsync({
        ms_type: msType || null,
        year_diagnosed: yearDiagnosed || null,
        symptoms,
        goals: selectedGoals,
        country: country || null,
        age_range: ageRange || null,
        onboarding_completed: true,
      });
      navigate("/today");
    } catch (err: any) {
      toast.error("Failed to save profile: " + err.message);
    }
  };

  const steps = [
    // 0: Welcome
    <div key="welcome" className="flex flex-col items-center justify-center px-6 text-center animate-fade-in">
      <span className="text-5xl">🧡</span>
      <h1 className="mt-6 font-display text-3xl font-bold text-foreground">Welcome to LiveWithMS</h1>
      <p className="mt-3 text-base text-muted-foreground leading-relaxed">
        Your personal companion for living well with Multiple Sclerosis. Let's set things up — it only takes a minute.
      </p>
      <div className="mt-6 mx-auto max-w-sm rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3">
        <p className="text-xs font-semibold text-destructive mb-1">⚕️ Medical Disclaimer</p>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          This app does <strong>not</strong> provide medical advice, diagnosis, or treatment. Always consult your neurologist or qualified healthcare provider before making any medical decisions.
        </p>
      </div>
    </div>,

    // 1: Privacy & Consent
    <div key="consent" className="px-6 animate-fade-in">
      <div className="flex items-center gap-2 mb-1">
        <Shield className="h-5 w-5 text-primary" />
        <h2 className="font-display text-2xl font-semibold text-foreground">Your Privacy Matters</h2>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">
        We take your health data seriously. Please review and accept the following before continuing.
      </p>
      <div className="mt-6 space-y-3">
        {consentItems.map((item) => (
          <button
            key={item.id}
            onClick={() => toggleConsent(item.id)}
            className={`tap-highlight-none flex w-full items-start gap-3 rounded-xl px-4 py-3.5 text-left text-sm transition-all active:scale-[0.98] ${
              consents[item.id]
                ? "bg-primary/10 border border-primary/30 text-foreground"
                : "bg-card text-foreground shadow-soft border border-transparent"
            }`}
          >
            <div className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md transition-colors ${
              consents[item.id] ? "bg-primary text-primary-foreground" : "border-2 border-muted-foreground/30"
            }`}>
              {consents[item.id] && <CheckCircle2 className="h-3.5 w-3.5" />}
            </div>
            <span className="leading-snug">{item.label}</span>
          </button>
        ))}
      </div>
      <p className="mt-4 text-[10px] text-muted-foreground text-center leading-relaxed">
        You can manage your privacy preferences anytime in <strong>Profile → Privacy & Data</strong>.
      </p>
    </div>,

    // 2: MS Type
    <div key="type" className="px-6 animate-fade-in">
      <h2 className="font-display text-2xl font-semibold text-foreground">Your MS Type</h2>
      <p className="mt-1 text-sm text-muted-foreground">This helps us personalize your experience.</p>
      <div className="mt-6 space-y-2">
        {msTypes.map((type) => (
          <button key={type} onClick={() => setMsType(type)} className={`tap-highlight-none w-full rounded-xl px-4 py-3.5 text-left text-sm font-medium transition-all active:scale-[0.98] ${msType === type ? "bg-primary text-primary-foreground shadow-sm" : "bg-card text-foreground shadow-soft"}`}>
            {type}
          </button>
        ))}
      </div>
      <div className="mt-4">
        <label className="block text-sm font-medium text-foreground">Year diagnosed (optional)</label>
        <input type="number" min={1950} max={2026} placeholder="e.g. 2020" value={yearDiagnosed} onChange={(e) => setYearDiagnosed(e.target.value)} className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
      </div>
    </div>,

    // 3: Symptoms
    <div key="symptoms" className="px-6 animate-fade-in">
      <h2 className="font-display text-2xl font-semibold text-foreground">Key Symptoms</h2>
      <p className="mt-1 text-sm text-muted-foreground">Select the symptoms that affect you most.</p>
      <div className="mt-6 flex flex-wrap gap-2">
        {commonSymptoms.map((s) => (
          <button key={s} onClick={() => toggleItem(s, symptoms, setSymptoms)} className={`tap-highlight-none rounded-full px-4 py-2 text-sm font-medium transition-all active:scale-95 ${symptoms.includes(s) ? "bg-primary text-primary-foreground" : "bg-card text-foreground shadow-soft"}`}>
            {s}
          </button>
        ))}
      </div>
    </div>,

    // 4: Goals
    <div key="goals" className="px-6 animate-fade-in">
      <h2 className="font-display text-2xl font-semibold text-foreground">Your Goals</h2>
      <p className="mt-1 text-sm text-muted-foreground">What would you like to improve?</p>
      <div className="mt-6 flex flex-wrap gap-2">
        {goals.map((g) => (
          <button key={g} onClick={() => toggleItem(g, selectedGoals, setSelectedGoals)} className={`tap-highlight-none rounded-full px-4 py-2 text-sm font-medium transition-all active:scale-95 ${selectedGoals.includes(g) ? "bg-primary text-primary-foreground" : "bg-card text-foreground shadow-soft"}`}>
            {g}
          </button>
        ))}
      </div>
    </div>,

    // 5: Country
    <div key="country" className="px-6 animate-fade-in">
      <div className="flex items-center gap-2 mb-1">
        <Globe className="h-5 w-5 text-primary" />
        <h2 className="font-display text-2xl font-semibold text-foreground">Where are you based?</h2>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">This helps us connect you with local resources and community members.</p>
      <div className="mt-6 space-y-2 max-h-[340px] overflow-y-auto pr-1">
        {countries.map((c) => (
          <button key={c} onClick={() => setCountry(c)} className={`tap-highlight-none w-full rounded-xl px-4 py-3.5 text-left text-sm font-medium transition-all active:scale-[0.98] ${country === c ? "bg-primary text-primary-foreground shadow-sm" : "bg-card text-foreground shadow-soft"}`}>
            {c}
          </button>
        ))}
      </div>
    </div>,

    // 6: Age Range
    <div key="age-range" className="px-6 animate-fade-in">
      <div className="flex items-center gap-2 mb-1">
        <Calendar className="h-5 w-5 text-primary" />
        <h2 className="font-display text-2xl font-semibold text-foreground">Your Age Range</h2>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">Helps us personalize insights for your age group.</p>
      <div className="mt-6 space-y-2">
        {ageRanges.map((r) => (
          <button key={r} onClick={() => setAgeRange(r)} className={`tap-highlight-none w-full rounded-xl px-4 py-3.5 text-left text-sm font-medium transition-all active:scale-[0.98] ${ageRange === r ? "bg-primary text-primary-foreground shadow-sm" : "bg-card text-foreground shadow-soft"}`}>
            {r}
          </button>
        ))}
      </div>
    </div>,

    // 7: Ready
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
  const isConsentStep = step === 1;
  const skippableSteps = [2, 3, 4, 5, 6]; // MS Type, Symptoms, Goals, Country, Age Range
  const isSkippable = skippableSteps.includes(step);
  const nextDisabled = isConsentStep && !allConsentsAccepted;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="px-4 pt-4">
        <div className="mx-auto flex max-w-lg gap-1">
          {steps.map((_, i) => (
            <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= step ? "bg-primary" : "bg-muted"}`} />
          ))}
        </div>
      </div>
      <div className="flex flex-1 items-center">
        <div className="mx-auto w-full max-w-lg py-8">{steps[step]}</div>
      </div>
      <div className="mx-auto flex w-full max-w-lg gap-3 px-6 pb-8">
        {!isFirst && (
          <button onClick={() => setStep((s) => s - 1)} className="flex items-center gap-1 rounded-full bg-secondary px-5 py-3 text-sm font-medium text-secondary-foreground transition-all active:scale-[0.98]">
            <ChevronLeft className="h-4 w-4" /> Back
          </button>
        )}
        {isSkippable && (
          <button onClick={() => setStep((s) => s + 1)} className="flex items-center justify-center rounded-full px-5 py-3 text-sm font-medium text-muted-foreground transition-all hover:text-foreground active:scale-[0.98]">
            Skip
          </button>
        )}
        <button
          onClick={isLast ? finish : () => setStep((s) => s + 1)}
          disabled={(isLast && updateProfile.isPending) || nextDisabled}
          className="flex flex-1 items-center justify-center gap-1 rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-soft transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
        >
          {isLast ? (updateProfile.isPending ? "Saving..." : "Let's Go! 🧡") : isFirst ? "Get Started" : isConsentStep ? "I Agree & Continue" : "Next"}
          {!isLast && <ChevronRight className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
};

export default OnboardingPage;
