import { useState } from "react";
import { Wind, Leaf, Heart } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import PageHeader from "@/components/PageHeader";
import { StaggerContainer, StaggerItem } from "@/components/StaggeredReveal";
import BreathingExercise from "@/components/nervous-system/BreathingExercise";
import GroundingExercise from "@/components/nervous-system/GroundingExercise";
import VagalToneExercises from "@/components/nervous-system/VagalToneExercises";

const tabs = [
  { id: "breathing", label: "Breathing", icon: Wind },
  { id: "grounding", label: "Grounding", icon: Leaf },
  { id: "vagal", label: "Vagal Tone", icon: Heart },
] as const;

type TabId = (typeof tabs)[number]["id"];

const NervousSystemPage = () => {
  const [activeTab, setActiveTab] = useState<TabId>("breathing");

  return (
    <>
      <SEOHead
        title="Nervous System — LiveWithMS"
        description="Guided breathing, grounding, and vagal tone exercises to calm your nervous system."
      />
      <PageHeader
        title="Regulation Center"
        subtitle="Calm your nervous system"
        showBack
      />

      <div className="mx-auto max-w-lg px-4 py-4 pb-40">
        <StaggerContainer className="space-y-5">
          {/* Hero card */}
          <StaggerItem>
            <div className="rounded-2xl bg-gradient-to-br from-[hsl(var(--brand-green))]/12 via-accent/50 to-card p-5 text-center border border-[hsl(var(--brand-green))]/10">
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
                Simple, science-backed tools to help you feel safer in your body — anytime you need them.
              </p>
            </div>
          </StaggerItem>

          {/* Tab selector */}
          <StaggerItem>
            <div className="flex gap-2">
              {tabs.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-medium transition-all ${
                    activeTab === id
                      ? "bg-primary text-primary-foreground shadow-soft"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>
          </StaggerItem>

          {/* Active exercise */}
          <StaggerItem>
            {activeTab === "breathing" && <BreathingExercise />}
            {activeTab === "grounding" && <GroundingExercise />}
            {activeTab === "vagal" && <VagalToneExercises />}
          </StaggerItem>
        </StaggerContainer>
      </div>
    </>
  );
};

export default NervousSystemPage;
