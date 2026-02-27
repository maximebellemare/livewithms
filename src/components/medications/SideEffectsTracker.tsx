import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { AlertTriangle, Plus, X, ChevronDown, ChevronUp } from "lucide-react";

const COMMON_EFFECTS = [
  "Headache", "Nausea", "Fatigue", "Dizziness", "Insomnia",
  "Muscle pain", "Joint pain", "Stomach upset", "Skin rash",
  "Hair thinning", "Flushing", "Injection site reaction",
];

const SEVERITY_CONFIG = {
  mild: { label: "Mild", color: "bg-green-500/20 text-green-400 border-green-500/30" },
  moderate: { label: "Moderate", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  severe: { label: "Severe", color: "bg-red-500/20 text-red-400 border-red-500/30" },
};

interface SideEffectsTrackerProps {
  medicationId: string;
  medicationName: string;
}

const SideEffectsTracker = ({ medicationId, medicationName }: SideEffectsTrackerProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newEffect, setNewEffect] = useState("");
  const [newSeverity, setNewSeverity] = useState<"mild" | "moderate" | "severe">("mild");
  const [newNotes, setNewNotes] = useState("");

  const { data: effects = [] } = useQuery({
    queryKey: ["side_effects", medicationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("medication_side_effects")
        .select("*")
        .eq("medication_id", medicationId)
        .order("date", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      if (!newEffect.trim()) return;
      const { error } = await supabase.from("medication_side_effects").insert({
        user_id: user!.id,
        medication_id: medicationId,
        effect: newEffect.trim(),
        severity: newSeverity,
        notes: newNotes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["side_effects", medicationId] });
      setAdding(false);
      setNewEffect("");
      setNewNotes("");
      setNewSeverity("mild");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("medication_side_effects").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["side_effects", medicationId] });
    },
  });

  return (
    <div className="rounded-xl bg-card p-4 shadow-soft space-y-2">
      <button onClick={() => setExpanded(!expanded)} className="flex items-center justify-between w-full text-left">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-400" />
          <span className="text-sm font-medium text-foreground">Side Effects</span>
          {effects.length > 0 && (
            <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              {effects.length}
            </span>
          )}
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>

      {expanded && (
        <div className="space-y-2 pt-1 animate-fade-in">
          {effects.map((e) => {
            const sev = SEVERITY_CONFIG[e.severity as keyof typeof SEVERITY_CONFIG] || SEVERITY_CONFIG.mild;
            return (
              <div key={e.id} className="flex items-center gap-2 group">
                <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium ${sev.color}`}>
                  {sev.label}
                </span>
                <span className="flex-1 text-xs text-foreground">{e.effect}</span>
                <span className="text-[10px] text-muted-foreground">{format(new Date(e.date), "MMM d")}</span>
                <button onClick={() => deleteMutation.mutate(e.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              </div>
            );
          })}

          {adding ? (
            <div className="space-y-2 rounded-lg border border-border p-3">
              <div className="flex flex-wrap gap-1.5">
                {COMMON_EFFECTS.map((e) => (
                  <button
                    key={e}
                    onClick={() => setNewEffect(e)}
                    className={`rounded-full px-2.5 py-1 text-[10px] font-medium transition-all ${
                      newEffect === e ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
              <input
                value={newEffect}
                onChange={(e) => setNewEffect(e.target.value)}
                placeholder="Or type a custom effect..."
                className="w-full rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <div className="flex gap-2">
                {(Object.keys(SEVERITY_CONFIG) as Array<keyof typeof SEVERITY_CONFIG>).map((s) => (
                  <button
                    key={s}
                    onClick={() => setNewSeverity(s)}
                    className={`flex-1 rounded-lg py-1.5 text-[10px] font-medium border transition-all ${
                      newSeverity === s ? SEVERITY_CONFIG[s].color : "bg-secondary text-muted-foreground border-transparent"
                    }`}
                  >
                    {SEVERITY_CONFIG[s].label}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setAdding(false)} className="flex-1 rounded-lg bg-secondary py-1.5 text-xs text-muted-foreground">Cancel</button>
                <button onClick={() => addMutation.mutate()} disabled={!newEffect.trim()} className="flex-1 rounded-lg bg-primary py-1.5 text-xs text-primary-foreground disabled:opacity-50">Save</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setAdding(true)} className="flex items-center gap-1.5 text-xs text-primary hover:underline">
              <Plus className="h-3 w-3" /> Log side effect
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default SideEffectsTracker;
