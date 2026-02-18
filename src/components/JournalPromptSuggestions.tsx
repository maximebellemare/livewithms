import { useState } from "react";
import { Sparkles, RefreshCw, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DailyEntry } from "@/hooks/useEntries";

interface JournalPromptSuggestionsProps {
  entry: DailyEntry | null;
  recentEntries?: DailyEntry[];
  onSelectPrompt: (prompt: string) => void;
}

const JournalPromptSuggestions = ({ entry, recentEntries = [], onSelectPrompt }: JournalPromptSuggestionsProps) => {
  const [prompts, setPrompts] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const { toast } = useToast();

  const generate = async () => {
    setLoading(true);
    try {
      // Build a compact weekly history (exclude today — sent separately)
      const weeklyHistory = recentEntries
        .filter((e) => e.date !== entry?.date)
        .slice(0, 6)
        .map((e) => ({
          date: e.date,
          fatigue: e.fatigue,
          pain: e.pain,
          brain_fog: e.brain_fog,
          mood: e.mood,
          mobility: e.mobility,
          sleep_hours: e.sleep_hours,
          mood_tags: e.mood_tags ?? [],
        }));

      const { data, error } = await supabase.functions.invoke("journal-prompt", {
        body: {
          fatigue: entry?.fatigue ?? null,
          pain: entry?.pain ?? null,
          brain_fog: entry?.brain_fog ?? null,
          mood: entry?.mood ?? null,
          mobility: entry?.mobility ?? null,
          sleep_hours: entry?.sleep_hours ?? null,
          mood_tags: entry?.mood_tags ?? [],
          weekly_history: weeklyHistory,
        },
      });

      if (error) throw error;
      if (data?.error) {
        toast({ title: "Couldn't generate prompts", description: data.error, variant: "destructive" });
        return;
      }
      setPrompts(data.prompts ?? []);
      setGenerated(true);
    } catch {
      toast({ title: "Error", description: "Failed to generate prompts. Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const hasSymptomData = entry && (
    entry.fatigue !== null || entry.pain !== null || entry.mood !== null ||
    entry.brain_fog !== null || entry.mobility !== null || entry.sleep_hours !== null
  );

  return (
    <div className="rounded-xl border border-primary/15 bg-primary/5 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-semibold text-foreground">Writing prompts</span>
        </div>
        {generated && (
          <button
            onClick={generate}
            disabled={loading}
            className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <RefreshCw className={`h-2.5 w-2.5 ${loading ? "animate-spin" : ""}`} />
            New prompts
          </button>
        )}
      </div>

      {!generated ? (
        <div className="flex flex-col items-start gap-2">
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            {hasSymptomData
              ? "Get personalised prompts based on your symptoms today."
              : "Get gentle prompts to help you start writing."}
          </p>
          <button
            onClick={generate}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 px-3 py-1.5 text-xs font-semibold text-primary transition-all disabled:opacity-60"
          >
            {loading ? (
              <><RefreshCw className="h-3 w-3 animate-spin" /> Generating…</>
            ) : (
              <><Sparkles className="h-3 w-3" /> Suggest prompts</>
            )}
          </button>
        </div>
      ) : loading ? (
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground py-1">
          <RefreshCw className="h-3 w-3 animate-spin" /> Generating new prompts…
        </div>
      ) : (
        <ul className="space-y-1.5">
          {prompts.map((prompt, i) => (
            <li key={i}>
              <button
                onClick={() => onSelectPrompt(prompt)}
                className="w-full text-left flex items-start gap-2 rounded-lg px-2.5 py-2 text-[11px] text-foreground hover:bg-primary/10 transition-colors group"
              >
                <ChevronRight className="h-3 w-3 mt-0.5 flex-shrink-0 text-primary group-hover:translate-x-0.5 transition-transform" />
                <span className="leading-relaxed">{prompt}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default JournalPromptSuggestions;
