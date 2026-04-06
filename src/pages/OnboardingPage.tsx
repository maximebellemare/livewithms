import { useState, useCallback } from "react";
import AppPreview from "@/components/onboarding/AppPreview";
import { useNavigate } from "react-router-dom";
import { ChevronRight, ChevronLeft, Shield, CheckCircle2, Globe, Calendar, User, Sparkles, TrendingUp, Heart, Brain, Target, MapPin, Crown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import MedicalDisclaimerDialog from "@/components/MedicalDisclaimerDialog";
import { useUpdateProfile } from "@/hooks/useProfile";
import PlanComparisonCard from "@/components/premium/PlanComparisonCard";
import { toast } from "sonner";

const msTypes = [
  { value: "RRMS", label: "RRMS", desc: "Relapsing-Remitting" },
  { value: "PPMS", label: "PPMS", desc: "Primary Progressive" },
  { value: "SPMS", label: "SPMS", desc: "Secondary Progressive" },
  { value: "CIS", label: "CIS", desc: "Clinically Isolated Syndrome" },
  { value: "Unknown", label: "Unknown", desc: "Not sure yet" },
];
const commonSymptoms = [
  { value: "Fatigue", emoji: "😴" },
  { value: "Pain", emoji: "🔥" },
  { value: "Brain Fog", emoji: "🌫️" },
  { value: "Numbness", emoji: "🧊" },
  { value: "Vision Issues", emoji: "👁️" },
  { value: "Spasticity", emoji: "💪" },
  { value: "Balance", emoji: "⚖️" },
  { value: "Bladder", emoji: "💧" },
];
const goals = [
  { value: "Better Sleep", emoji: "😴" },
  { value: "More Energy", emoji: "⚡" },
  { value: "Less Pain", emoji: "🩹" },
  { value: "Improved Mood", emoji: "😊" },
  { value: "Better Mobility", emoji: "🚶" },
  { value: "Sharper Thinking", emoji: "🧠" },
];
const countries = [
  "United States", "United Kingdom", "Canada", "Australia", "Germany", "France",
  "Netherlands", "Spain", "Italy", "Sweden", "Norway", "Denmark", "Finland",
  "Belgium", "Switzerland", "Austria", "Ireland", "New Zealand", "Brazil",
  "Mexico", "India", "Japan", "South Korea", "South Africa", "Other",
];
const ageRanges = ["18–24", "25–34", "35–44", "45–54", "55–64", "65+"];

const consentItems = [
  { id: "medical_disclaimer", label: "I understand this app is NOT a substitute for professional medical advice, diagnosis, or treatment.", required: true },
  { id: "health_data", label: "I understand my health data is stored securely and encrypted.", required: true },
  { id: "not_medical", label: "Symptom tracking and insights are for informational purposes only.", required: true },
  { id: "data_control", label: "I can export or delete my data at any time.", required: true },
];

const stepMeta = [
  { emoji: "🧡", title: "Welcome" },
  { emoji: "🔒", title: "Privacy" },
  { emoji: "👤", title: "Name" },
  { emoji: "🧬", title: "MS Type" },
  { emoji: "🩺", title: "Symptoms" },
  { emoji: "🎯", title: "Goals" },
  { emoji: "🌍", title: "About You" },
  { emoji: "👑", title: "Your Plan" },
  { emoji: "🌿", title: "Ready!" },
];

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 200 : -200,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 200 : -200,
    opacity: 0,
  }),
};

/** Motivational tip component shown below each step's header */
const StepTip = ({ icon: Icon, text }: { icon: React.ElementType; text: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.3 }}
    className="mt-4 mb-2 flex items-start gap-2.5 rounded-xl bg-primary/5 border border-primary/10 px-4 py-3"
  >
    <Icon className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
    <p className="text-xs text-muted-foreground leading-relaxed">{text}</p>
  </motion.div>
);

/** Decorative floating dots for visual interest */
const StepDecoration = ({ emoji, delay = 0 }: { emoji: string; delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0, y: 20 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    transition={{ type: "spring", stiffness: 200, damping: 15, delay }}
    className="absolute pointer-events-none select-none"
  >
    <span className="text-4xl opacity-10">{emoji}</span>
  </motion.div>
);

const OnboardingPage = () => {
  const navigate = useNavigate();
  const updateProfile = useUpdateProfile();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [displayName, setDisplayName] = useState("");
  const [msType, setMsType] = useState("");
  const [yearDiagnosed, setYearDiagnosed] = useState("");
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [country, setCountry] = useState("");
  const [ageRange, setAgeRange] = useState("");
  const [consents, setConsents] = useState<Record<string, boolean>>({});

  const allConsentsAccepted = consentItems.filter((c) => c.required).every((c) => consents[c.id]);

  const toggleItem = useCallback((item: string, list: string[], setter: (v: string[]) => void) => {
    setter(list.includes(item) ? list.filter((i) => i !== item) : [...list, item]);
  }, []);

  const toggleConsent = (id: string) => {
    setConsents((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const acceptAll = () => {
    const all: Record<string, boolean> = {};
    consentItems.forEach((c) => { all[c.id] = true; });
    setConsents(all);
  };

  const goNext = () => { setDirection(1); setStep((s) => s + 1); };
  const goBack = () => { setDirection(-1); setStep((s) => s - 1); };

  const finish = async () => {
    try {
      await updateProfile.mutateAsync({
        display_name: displayName.trim() || null,
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

  const totalSteps = stepMeta.length;
  const isLast = step === totalSteps - 1;
  const isFirst = step === 0;
  const isConsentStep = step === 1;
  const isNameStep = step === 2;
  const skippableSteps = [2, 3, 4, 5, 6, 7]; // Name, MS Type, Symptoms, Goals, About You, Plan
  const isSkippable = skippableSteps.includes(step);
  const nextDisabled = isConsentStep && !allConsentsAccepted;

  const steps = [
    // 0: Welcome
    <div key="welcome" className="relative flex flex-col items-center justify-center px-6 text-center">
      <StepDecoration emoji="💜" delay={0.5} />
      <motion.span
        className="text-6xl"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.2 }}
      >
        🧡
      </motion.span>
      <h1 className="mt-6 font-display text-3xl font-bold text-foreground">Welcome to LiveWithMS</h1>
      <p className="mt-3 text-base text-muted-foreground leading-relaxed max-w-xs mx-auto">
        Your personal companion for living well with Multiple Sclerosis. Let's set things up — it only takes a minute.
      </p>
      <AppPreview />
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="mt-5 flex items-center gap-3 text-sm text-muted-foreground"
      >
        <span className="flex items-center gap-1.5"><span className="text-base">🔒</span> Private</span>
        <span className="text-muted-foreground/30">•</span>
        <span className="flex items-center gap-1.5"><span className="text-base">⚡</span> 1 min setup</span>
        <span className="text-muted-foreground/30">•</span>
        <span className="flex items-center gap-1.5"><span className="text-base">💜</span> Free</span>
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1 }}
        className="mt-4 mx-auto max-w-sm rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3"
      >
        <p className="text-xs font-semibold text-destructive mb-1">⚕️ Medical Disclaimer</p>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          This app does <strong>not</strong> provide medical advice. Always consult your neurologist before making medical decisions.
        </p>
      </motion.div>
    </div>,

    // 1: Privacy & Consent
    <div key="consent" className="px-6">
      <div className="flex items-center gap-2 mb-1">
        <Shield className="h-5 w-5 text-primary" />
        <h2 className="font-display text-2xl font-semibold text-foreground">Your Privacy Matters</h2>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">
        We take your health data seriously. Please review and accept.
      </p>
      <StepTip icon={Shield} text="Your data is encrypted and never shared with third parties. You're always in control." />
      <div className="mt-3 space-y-2.5">
        {consentItems.map((item, i) => (
          <motion.button
            key={item.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            onClick={() => toggleConsent(item.id)}
            className={`tap-highlight-none flex w-full items-start gap-3 rounded-xl px-4 py-3 text-left text-sm transition-all active:scale-[0.98] ${
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
          </motion.button>
        ))}
      </div>
      {!allConsentsAccepted && (
        <button
          onClick={acceptAll}
          className="mt-3 w-full text-center text-xs font-medium text-primary hover:text-primary/80 transition-colors"
        >
          Accept all ✓
        </button>
      )}
      <p className="mt-3 text-[10px] text-muted-foreground text-center leading-relaxed">
        Manage preferences anytime in <strong>Profile → Privacy & Data</strong>.
      </p>
    </div>,

    // 2: Display Name
    <div key="name" className="px-6">
      <div className="flex items-center gap-2 mb-1">
        <User className="h-5 w-5 text-primary" />
        <h2 className="font-display text-2xl font-semibold text-foreground">Choose Your Name</h2>
      </div>
      <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
        Pick a display name for the community. You can stay anonymous — this won't show your real name.
      </p>
      <StepTip icon={Heart} text="Your name helps others connect with you in the community. You can always change it later." />
      <div className="mt-4">
        <input
          type="text"
          maxLength={30}
          placeholder="e.g. MSWarrior, SunnyDays, Anonymous"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="w-full rounded-xl border border-input bg-card px-4 py-3.5 text-sm font-medium placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
        />
        <p className="mt-2 text-xs text-muted-foreground">{displayName.length}/30 characters</p>
      </div>
    </div>,

    // 3: MS Type
    <div key="type" className="px-6">
      <h2 className="font-display text-2xl font-semibold text-foreground">🧬 Your MS Type</h2>
      <p className="mt-1 text-sm text-muted-foreground">Helps us personalize your experience.</p>
      <StepTip icon={Brain} text="Knowing your MS type lets us tailor insights, articles, and risk indicators specifically for you." />
      <div className="mt-3 space-y-2">
        {msTypes.map((type, i) => (
          <motion.button
            key={type.value}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
            onClick={() => setMsType(type.value)}
            className={`tap-highlight-none w-full rounded-xl px-4 py-3.5 text-left transition-all active:scale-[0.98] ${
              msType === type.value
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-card text-foreground shadow-soft"
            }`}
          >
            <span className="text-sm font-semibold">{type.label}</span>
            <span className={`ml-2 text-xs ${msType === type.value ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
              {type.desc}
            </span>
          </motion.button>
        ))}
      </div>
      <div className="mt-4">
        <label className="block text-sm font-medium text-foreground">Year diagnosed <span className="text-muted-foreground font-normal">(optional)</span></label>
        <input
          type="number"
          min={1950}
          max={new Date().getFullYear()}
          placeholder="e.g. 2020"
          value={yearDiagnosed}
          onChange={(e) => setYearDiagnosed(e.target.value)}
          className="mt-1.5 w-full rounded-xl border border-input bg-card px-4 py-3 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
        />
      </div>
    </div>,

    // 4: Symptoms
    <div key="symptoms" className="px-6">
      <h2 className="font-display text-2xl font-semibold text-foreground">🩺 Key Symptoms</h2>
      <p className="mt-1 text-sm text-muted-foreground">Select the symptoms that affect you most.</p>
      <StepTip icon={TrendingUp} text="Selecting your symptoms unlocks personalized tracking, trends, and smart correlations in your dashboard." />
      <div className="mt-3 grid grid-cols-2 gap-2">
        {commonSymptoms.map((s, i) => (
          <motion.button
            key={s.value}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => toggleItem(s.value, symptoms, setSymptoms)}
            className={`tap-highlight-none flex items-center gap-2 rounded-xl px-3.5 py-3 text-sm font-medium transition-all active:scale-95 ${
              symptoms.includes(s.value)
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-card text-foreground shadow-soft"
            }`}
          >
            <span className="text-base">{s.emoji}</span>
            <span>{s.value}</span>
          </motion.button>
        ))}
      </div>
      {symptoms.length > 0 && (
        <p className="mt-3 text-xs text-primary font-medium text-center">
          {symptoms.length} selected — great start!
        </p>
      )}
    </div>,

    // 5: Goals
    <div key="goals" className="px-6">
      <h2 className="font-display text-2xl font-semibold text-foreground">🎯 Your Goals</h2>
      <p className="mt-1 text-sm text-muted-foreground">What would you like to improve?</p>
      <StepTip icon={Target} text="Your goals shape your daily prompts, insights, and the articles we recommend — making the app truly yours." />
      <div className="mt-3 grid grid-cols-2 gap-2">
        {goals.map((g, i) => (
          <motion.button
            key={g.value}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => toggleItem(g.value, selectedGoals, setSelectedGoals)}
            className={`tap-highlight-none flex items-center gap-2 rounded-xl px-3.5 py-3 text-sm font-medium transition-all active:scale-95 ${
              selectedGoals.includes(g.value)
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-card text-foreground shadow-soft"
            }`}
          >
            <span className="text-base">{g.emoji}</span>
            <span>{g.value}</span>
          </motion.button>
        ))}
      </div>
      {selectedGoals.length > 0 && (
        <p className="mt-3 text-xs text-primary font-medium text-center">
          {selectedGoals.length} selected — you're on track! 💪
        </p>
      )}
    </div>,

    // 6: About You (combined Country + Age)
    <div key="about-you" className="px-6">
      <div className="flex items-center gap-2 mb-1">
        <Globe className="h-5 w-5 text-primary" />
        <h2 className="font-display text-2xl font-semibold text-foreground">A Bit About You</h2>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">Completely optional — helps us connect you with local resources.</p>
      <StepTip icon={MapPin} text="Your location connects you with nearby community members and region-specific resources. Age helps personalize health insights." />

      {/* Age Range */}
      <div className="mt-3">
        <label className="flex items-center gap-1.5 text-sm font-medium text-foreground mb-2">
          <Calendar className="h-3.5 w-3.5 text-primary" />
          Age Range
        </label>
        <div className="flex flex-wrap gap-2">
          {ageRanges.map((r) => (
            <button
              key={r}
              onClick={() => setAgeRange(ageRange === r ? "" : r)}
              className={`tap-highlight-none rounded-full px-4 py-2 text-sm font-medium transition-all active:scale-95 ${
                ageRange === r
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-card text-foreground shadow-soft"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Country */}
      <div className="mt-5">
        <label className="flex items-center gap-1.5 text-sm font-medium text-foreground mb-2">
          <Globe className="h-3.5 w-3.5 text-primary" />
          Country
        </label>
        <div className="space-y-1.5 max-h-[180px] overflow-y-auto pr-1 scrollbar-none">
          {countries.map((c) => (
            <button
              key={c}
              onClick={() => setCountry(country === c ? "" : c)}
              className={`tap-highlight-none w-full rounded-xl px-4 py-2.5 text-left text-sm font-medium transition-all active:scale-[0.98] ${
                country === c
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-card text-foreground shadow-soft"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>
    </div>,

    // 7: Plan Comparison
    <div key="plan" className="px-6">
      <div className="flex items-center gap-2 mb-1">
        <Crown className="h-5 w-5 text-primary" />
        <h2 className="font-display text-2xl font-semibold text-foreground">Choose Your Plan</h2>
      </div>
      <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
        Start free and upgrade anytime. Here's what you get.
      </p>
      <StepTip icon={Sparkles} text="You can always upgrade later from your profile. No pressure — free gives you a great start!" />
      <div className="mt-3">
        <PlanComparisonCard compact />
      </div>
    </div>,

    // 8: Ready
    <div key="ready" className="relative flex flex-col items-center justify-center px-6 text-center">
      <motion.span
        className="text-6xl"
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.2 }}
      >
        🌿
      </motion.span>
      <h2 className="mt-6 font-display text-2xl font-semibold text-foreground">You're all set!</h2>
      <p className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
        Your companion is ready. Start tracking, stay informed, and remember — you're not alone on this journey.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {[
          msType && `🧬 ${msType}`,
          symptoms.length > 0 && `🩺 ${symptoms.length} symptoms`,
          selectedGoals.length > 0 && `🎯 ${selectedGoals.length} goals`,
          displayName && `👤 ${displayName}`,
          country && `🌍 ${country}`,
          ageRange && `📅 ${ageRange}`,
        ].filter(Boolean).map((tag, i) => (
          <motion.span
            key={i}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 + i * 0.1 }}
            className="rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-medium text-primary"
          >
            {tag}
          </motion.span>
        ))}
      </div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-6 text-xs text-muted-foreground leading-relaxed max-w-xs"
      >
        You can update any of these details later in your <strong>Profile</strong> settings.
      </motion.p>
    </div>,
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Progress bar */}
      <div className="px-4 pt-4 pb-2">
        <div className="mx-auto flex max-w-lg gap-1">
          {stepMeta.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                i < step ? "bg-primary" : i === step ? "bg-primary/70" : "bg-muted"
              }`}
            />
          ))}
        </div>
        {/* Step label */}
        <div className="mt-2 flex justify-center">
          <span className="text-xs text-muted-foreground font-medium">
            {stepMeta[step]?.emoji} {stepMeta[step]?.title} · {step + 1}/{totalSteps}
          </span>
        </div>
      </div>

      {/* Animated content */}
      <div className="flex flex-1 items-center overflow-hidden">
        <div className="mx-auto w-full max-w-lg py-4">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              {steps[step]}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation buttons */}
      <div className="mx-auto flex w-full max-w-lg gap-3 px-6 pb-6">
        {!isFirst && (
          <button
            onClick={goBack}
            className="flex items-center gap-1 rounded-full bg-secondary px-5 py-3 text-sm font-medium text-secondary-foreground transition-all active:scale-[0.98]"
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </button>
        )}
        {isSkippable && (
          <button
            onClick={goNext}
            className="flex items-center justify-center rounded-full px-5 py-3 text-sm font-medium text-muted-foreground transition-all hover:text-foreground active:scale-[0.98]"
          >
            Skip
          </button>
        )}
        <button
          onClick={isLast ? finish : goNext}
          disabled={(isLast && updateProfile.isPending) || nextDisabled}
          className="flex flex-1 items-center justify-center gap-1 rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-soft transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
        >
          {isLast
            ? updateProfile.isPending ? "Saving..." : "Let's Go! 🧡"
            : isFirst
              ? "Get Started"
              : isConsentStep
                ? "I Agree & Continue"
                : "Next"}
          {!isLast && <ChevronRight className="h-4 w-4" />}
        </button>
      </div>
      <p className="pb-4 text-center text-[10px] text-muted-foreground">
        <MedicalDisclaimerDialog triggerClassName="hover:text-primary/70 transition-colors cursor-pointer" />
      </p>
    </div>
  );
};

export default OnboardingPage;
