import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, Thermometer, Dumbbell, Users, MessageCircle, Battery, Watch, Brain, Stethoscope, CreditCard, CheckCircle2 } from "lucide-react";

interface FeatureInfo {
  title: string;
  description: string;
  icon: React.ReactNode;
  phase: 2 | 3;
  status: "done" | "soon";
  route?: string;
}

const features: Record<string, FeatureInfo> = {
  "heat-alerts": {
    title: "Heat Alerts",
    description: "Get real-time environmental heat alerts based on your location. Stay ahead of temperature-sensitive symptoms with personalized notifications.",
    icon: <Thermometer className="h-8 w-8" />,
    phase: 2,
    status: "done",
    route: "/today",
  },
  "energy-budgeting": {
    title: "Energy Budgeting",
    description: "Plan your day around your energy levels. Allocate spoons wisely and pace yourself for what matters most.",
    icon: <Battery className="h-8 w-8" />,
    phase: 2,
    status: "done",
    route: "/energy",
  },
  "lifestyle-tracking": {
    title: "Lifestyle Tracking",
    description: "Track exercise, supplements, and diet goals alongside your symptoms to discover what helps you feel your best.",
    icon: <Dumbbell className="h-8 w-8" />,
    phase: 2,
    status: "done",
    route: "/lifestyle",
  },
  "smart-matching": {
    title: "Smart Matching",
    description: "Connect with others who share your MS type, age range, and experiences. Find your support circle.",
    icon: <Users className="h-8 w-8" />,
    phase: 2,
    status: "done",
    route: "/matching",
  },
  "private-chat": {
    title: "Private Chat",
    description: "Have private, secure conversations with other members of the LiveWithMS community.",
    icon: <MessageCircle className="h-8 w-8" />,
    phase: 2,
    status: "done",
    route: "/messages",
  },
  "wearables": {
    title: "Wearable Integrations",
    description: "Sync data from your Apple Watch, Fitbit, or other wearables to automatically enrich your health logs.",
    icon: <Watch className="h-8 w-8" />,
    phase: 3,
    status: "soon",
  },
  "cognitive-games": {
    title: "Cognitive Games",
    description: "Fun mini-games designed to exercise attention, memory, and reaction time — and track your cognitive trends over time.",
    icon: <Brain className="h-8 w-8" />,
    phase: 3,
    status: "soon",
  },
  "therapist-directory": {
    title: "Therapist Directory",
    description: "Find and book appointments with MS-experienced therapists, counselors, and rehabilitation specialists near you.",
    icon: <Stethoscope className="h-8 w-8" />,
    phase: 3,
    status: "soon",
  },
  "subscriptions": {
    title: "Premium Plans",
    description: "Unlock advanced analytics, unlimited report exports, priority support, and exclusive content with LiveWithMS Premium.",
    icon: <CreditCard className="h-8 w-8" />,
    phase: 3,
    status: "soon",
  },
};

const ComingSoonPage = () => {
  const { feature } = useParams<{ feature: string }>();
  const navigate = useNavigate();
  const info = feature ? features[feature] : null;

  if (!info) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
        <p className="text-muted-foreground">Feature not found.</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-primary underline">Go back</button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="flex items-center gap-3 px-4 pt-6 pb-2">
        <button onClick={() => navigate(-1)} className="rounded-full p-1 text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Phase {info.phase}</span>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <div className={`flex h-20 w-20 items-center justify-center rounded-2xl ${info.status === "done" ? "bg-green-500/10 text-green-500" : "bg-primary/10 text-primary"}`}>
          {info.icon}
        </div>
        <h1 className="mt-6 font-display text-2xl font-bold text-foreground">{info.title}</h1>
        <span className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-semibold ${
          info.status === "done"
            ? "bg-green-500/15 text-green-500"
            : "bg-primary/15 text-primary"
        }`}>
          {info.status === "done" ? "✅ Live" : "Coming Soon"}
        </span>
        <p className="mt-5 max-w-sm text-sm leading-relaxed text-muted-foreground">{info.description}</p>
        {info.status === "done" && info.route ? (
          <button
            onClick={() => navigate(info.route!)}
            className="mt-8 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft hover:opacity-90 active:scale-[0.98]"
          >
            Go to {info.title} →
          </button>
        ) : (
          <p className="mt-8 text-xs text-muted-foreground/60">
            We're working hard to bring this to you. Stay tuned! 🧡
          </p>
        )}
      </div>
    </div>
  );
};

export const comingSoonFeatures = features;
export default ComingSoonPage;
