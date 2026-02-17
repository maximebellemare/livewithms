import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const onboarded = localStorage.getItem("ms-onboarded");
    if (onboarded) {
      navigate("/today", { replace: true });
    }
  }, [navigate]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <div className="animate-fade-in">
        <span className="text-6xl">🧡</span>
        <h1 className="mt-6 font-display text-4xl font-bold tracking-tight text-foreground">
          LiveWithMS
        </h1>
        <p className="mt-3 text-lg text-muted-foreground leading-relaxed">
          Your personal companion for living well with Multiple Sclerosis
        </p>
        <button
          onClick={() => navigate("/onboarding")}
          className="mt-8 rounded-full bg-primary px-8 py-3.5 text-base font-semibold text-primary-foreground shadow-card transition-all hover:opacity-90 active:scale-[0.98]"
        >
          Get Started
        </button>
        <p className="mt-4 text-xs text-muted-foreground">
          Free · Private · Not medical advice
        </p>
      </div>
    </div>
  );
};

export default Index;
