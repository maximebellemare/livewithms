import { useState } from "react";
import { Sparkles, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { DailyEntry } from "@/hooks/useEntries";
import ReactMarkdown from "react-markdown";

interface Props {
  entries: DailyEntry[];
}

const WeeklyReflectionSummary = ({ entries }: Props) => {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  const entriesWithContent = entries.filter(
    (e) => e.notes?.trim() || e.fatigue !== null || e.mood !== null
  );

  const generate = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("journal-summary", {
        body: {
          entries: entriesWithContent.slice(0, 7).map((e) => ({
            date: e.date,
            notes: e.notes,
            fatigue: e.fatigue,
            pain: e.pain,
            brain_fog: e.brain_fog,
            mood: e.mood,
            mobility: e.mobility,
            sleep_hours: e.sleep_hours,
            mood_tags: e.mood_tags ?? [],
          })),
        },
      });
      if (error) throw error;
      if (data?.error) {
        setSummary(null);
        return;
      }
      setSummary(data.summary);
      setGenerated(true);
    } catch {
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  if (entriesWithContent.length < 2) return null;

  return (
    <div className="rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/5 to-accent/30 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-xs font-semibold text-foreground">AI Weekly Reflection</span>
        </div>
        {generated && (
          <button
            onClick={generate}
            disabled={loading}
            className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <RefreshCw className={`h-2.5 w-2.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        )}
      </div>

      {!generated ? (
        <div className="space-y-2">
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Get an AI-powered summary of your week — patterns, mood themes, and what went well.
          </p>
          <button
            onClick={generate}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 px-3 py-1.5 text-xs font-semibold text-primary transition-all disabled:opacity-60"
          >
            {loading ? (
              <><RefreshCw className="h-3 w-3 animate-spin" /> Generating…</>
            ) : (
              <><Sparkles className="h-3 w-3" /> Summarise my week</>
            )}
          </button>
        </div>
      ) : loading ? (
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground py-2">
          <RefreshCw className="h-3 w-3 animate-spin" /> Reflecting on your week…
        </div>
      ) : summary ? (
        <div className="prose prose-sm max-w-none text-sm text-foreground leading-relaxed">
          <ReactMarkdown>{summary}</ReactMarkdown>
        </div>
      ) : (
        <p className="text-[11px] text-muted-foreground">Couldn't generate a summary right now. Try again later.</p>
      )}
    </div>
  );
};

export default WeeklyReflectionSummary;
