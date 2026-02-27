import { useMemo } from "react";
import { ShieldAlert, Info } from "lucide-react";
import { DbMedication } from "@/hooks/useMedications";

// Common MS medication interaction data (simplified)
const INTERACTIONS: Record<string, { drugs: string[]; warning: string; severity: "info" | "caution" | "warning" }[]> = {
  ocrevus: [
    { drugs: ["rituximab", "kesimpta"], warning: "Both are anti-CD20 therapies — do not combine. Risk of severe immunosuppression.", severity: "warning" },
    { drugs: ["prednisone", "methylprednisolone", "solumedrol"], warning: "May increase infection risk when combined with corticosteroids.", severity: "caution" },
  ],
  tecfidera: [
    { drugs: ["gilenya", "fingolimod"], warning: "Sequential use may cause prolonged lymphopenia.", severity: "caution" },
  ],
  gilenya: [
    { drugs: ["tecfidera", "dimethyl fumarate"], warning: "Sequential use may prolong lymphopenia.", severity: "caution" },
    { drugs: ["beta blocker", "atenolol", "metoprolol"], warning: "Gilenya can slow heart rate — monitor closely with beta blockers.", severity: "warning" },
  ],
  aubagio: [
    { drugs: ["warfarin"], warning: "Aubagio may increase warfarin levels — monitor INR.", severity: "caution" },
    { drugs: ["methotrexate"], warning: "Both are hepatotoxic — increased risk of liver damage.", severity: "warning" },
  ],
  kesimpta: [
    { drugs: ["ocrevus", "rituximab"], warning: "Both are anti-CD20 therapies — do not combine.", severity: "warning" },
  ],
  copaxone: [
    { drugs: ["interferon", "avonex", "rebif"], warning: "Combining immunomodulators is generally not recommended.", severity: "caution" },
  ],
  tysabri: [
    { drugs: ["ocrevus", "kesimpta", "rituximab", "gilenya"], warning: "Sequential use with other immunosuppressants increases PML risk.", severity: "warning" },
  ],
  mavenclad: [
    { drugs: ["ocrevus", "kesimpta", "gilenya"], warning: "Combining with other lymphocyte-depleting therapies is contraindicated.", severity: "warning" },
  ],
  baclofen: [
    { drugs: ["tizanidine", "zanaflex"], warning: "Both are muscle relaxants — increased sedation risk.", severity: "caution" },
    { drugs: ["gabapentin", "pregabalin"], warning: "May increase drowsiness and CNS depression.", severity: "info" },
  ],
  gabapentin: [
    { drugs: ["pregabalin", "lyrica"], warning: "Similar mechanism — combining increases side effect risk without added benefit.", severity: "caution" },
  ],
};

interface DrugInteractionWarningsProps {
  medications: DbMedication[];
}

const DrugInteractionWarnings = ({ medications }: DrugInteractionWarningsProps) => {
  const warnings = useMemo(() => {
    const activeMeds = medications.filter((m) => m.active);
    const medNames = activeMeds.map((m) => m.name.toLowerCase().trim());
    const found: { med1: string; med2: string; warning: string; severity: string }[] = [];
    const seen = new Set<string>();

    for (const med of activeMeds) {
      const key = med.name.toLowerCase().trim();
      const interactions = INTERACTIONS[key];
      if (!interactions) continue;

      for (const interaction of interactions) {
        for (const target of interaction.drugs) {
          const matchingMed = activeMeds.find((m) =>
            m.name.toLowerCase().includes(target) || target.includes(m.name.toLowerCase())
          );
          if (matchingMed && matchingMed.id !== med.id) {
            const pairKey = [med.id, matchingMed.id].sort().join("-");
            if (!seen.has(pairKey)) {
              seen.add(pairKey);
              found.push({
                med1: med.name,
                med2: matchingMed.name,
                warning: interaction.warning,
                severity: interaction.severity,
              });
            }
          }
        }
      }
    }

    return found;
  }, [medications]);

  if (warnings.length === 0) return null;

  return (
    <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 space-y-2 animate-fade-in">
      <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
        <ShieldAlert className="h-3.5 w-3.5 text-red-400" />
        Potential Interactions
      </p>
      <p className="text-[10px] text-muted-foreground">
        ⚠️ Always consult your neurologist before making any medication changes.
      </p>
      {warnings.map((w, idx) => (
        <div key={idx} className={`flex items-start gap-2 rounded-lg px-3 py-2 ${
          w.severity === "warning" ? "bg-red-500/10" : w.severity === "caution" ? "bg-amber-500/10" : "bg-blue-500/10"
        }`}>
          {w.severity === "warning" ? (
            <ShieldAlert className="h-3.5 w-3.5 shrink-0 mt-0.5 text-red-400" />
          ) : (
            <Info className="h-3.5 w-3.5 shrink-0 mt-0.5 text-amber-400" />
          )}
          <div className="min-w-0">
            <p className="text-xs font-medium text-foreground">
              {w.med1} + {w.med2}
            </p>
            <p className="text-[10px] text-muted-foreground leading-relaxed">{w.warning}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DrugInteractionWarnings;
