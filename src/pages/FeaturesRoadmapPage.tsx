import { useNavigate } from "react-router-dom";
import { ChevronRight, CheckCircle2 } from "lucide-react";
import { comingSoonFeatures } from "./ComingSoonPage";
import PageHeader from "@/components/PageHeader";

const FeaturesRoadmapPage = () => {
  const navigate = useNavigate();

  const phase2 = Object.entries(comingSoonFeatures).filter(([, f]) => f.phase === 2);
  const phase3 = Object.entries(comingSoonFeatures).filter(([, f]) => f.phase === 3);

  const FeatureCard = ({ slug, title, icon, status, route }: { slug: string; title: string; icon: React.ReactNode; status: "done" | "soon"; route?: string }) => {
    const isDone = status === "done";
    return (
      <button
        onClick={() => isDone && route ? navigate(route) : navigate(`/coming-soon/${slug}`)}
        className="flex w-full items-center gap-4 rounded-xl bg-card px-4 py-3.5 shadow-soft transition-all active:scale-[0.98]"
      >
        <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${isDone ? "bg-green-500/10 text-green-500" : "bg-primary/10 text-primary"}`}>
          <span className="[&>svg]:h-5 [&>svg]:w-5">{icon}</span>
        </div>
        <span className="flex-1 text-left text-sm font-medium text-foreground">{title}</span>
        {isDone ? (
          <span className="flex items-center gap-1 rounded-full bg-green-500/15 px-2 py-0.5 text-[10px] font-semibold text-green-500">
            <CheckCircle2 className="h-3 w-3" /> Live
          </span>
        ) : (
          <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">Soon</span>
        )}
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader title="Roadmap" showBack />
      <div className="mx-auto max-w-lg px-4 space-y-8">
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Phase 2 — Complete ✅</h2>
          <div className="space-y-2">
            {phase2.map(([slug, f]) => (
              <FeatureCard key={slug} slug={slug} title={f.title} icon={f.icon} status={f.status} route={f.route} />
            ))}
          </div>
        </section>
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Phase 3 — Up Next</h2>
          <div className="space-y-2">
            {phase3.map(([slug, f]) => (
              <FeatureCard key={slug} slug={slug} title={f.title} icon={f.icon} status={f.status} route={f.route} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default FeaturesRoadmapPage;
