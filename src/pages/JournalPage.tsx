import { useState, useMemo } from "react";
import { format, parseISO, isToday, isYesterday } from "date-fns";
import PageHeader from "@/components/PageHeader";
import { useEntries, useSaveEntry, DailyEntry } from "@/hooks/useEntries";
import { PenLine, ChevronDown, ChevronUp, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

/* ── Date label helper ─────────────────────────────────────── */
function dateLabel(dateStr: string): string {
  const d = parseISO(dateStr);
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  return format(d, "EEEE, MMMM d");
}

/* ── Entry editor card ─────────────────────────────────────── */
interface EditorCardProps {
  date: string;
  entry: DailyEntry | null;
}

const EditorCard = ({ date, entry }: EditorCardProps) => {
  const [text, setText] = useState(entry?.notes ?? "");
  const [saved, setSaved] = useState(false);
  const saveEntry = useSaveEntry();

  const isDirty = text !== (entry?.notes ?? "");

  const handleSave = async () => {
    if (text.length > 2000) {
      toast.error("Note is too long (max 2000 characters).");
      return;
    }
    await saveEntry.mutateAsync({
      date,
      notes: text.trim() || null,
      fatigue: entry?.fatigue ?? null,
      pain: entry?.pain ?? null,
      brain_fog: entry?.brain_fog ?? null,
      mood: entry?.mood ?? null,
      mobility: entry?.mobility ?? null,
      sleep_hours: entry?.sleep_hours ?? null,
      mood_tags: entry?.mood_tags ?? [],
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    toast.success("Journal entry saved 🧡");
  };

  return (
    <div className="rounded-2xl bg-card border border-border shadow-soft p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">{dateLabel(date)}</p>
        <p className="text-xs text-muted-foreground">{format(parseISO(date), "MMM d, yyyy")}</p>
      </div>
      <textarea
        value={text}
        onChange={(e) => { setText(e.target.value); setSaved(false); }}
        placeholder="How are you feeling today? Write freely…"
        maxLength={2000}
        rows={4}
        className="w-full resize-none rounded-xl bg-secondary/60 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
      />
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">{text.length}/2000</span>
        <button
          onClick={handleSave}
          disabled={!isDirty || saveEntry.isPending}
          className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition-all
            ${saved
              ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
              : isDirty
                ? "bg-primary text-primary-foreground hover:opacity-90 active:scale-95"
                : "bg-secondary text-muted-foreground cursor-not-allowed"
            }`}
        >
          {saved ? (
            <><CheckCircle2 className="h-3.5 w-3.5" /> Saved</>
          ) : (
            <><PenLine className="h-3.5 w-3.5" /> {saveEntry.isPending ? "Saving…" : "Save"}</>
          )}
        </button>
      </div>
    </div>
  );
};

/* ── Past entry row ────────────────────────────────────────── */
interface PastEntryProps {
  entry: DailyEntry;
}

const PastEntry = ({ entry }: PastEntryProps) => {
  const [expanded, setExpanded] = useState(false);

  if (!entry.notes) return null;

  const preview = entry.notes.length > 100 ? entry.notes.slice(0, 100) + "…" : entry.notes;

  return (
    <button
      onClick={() => setExpanded((e) => !e)}
      className="w-full text-left rounded-xl bg-card border border-border shadow-soft px-4 py-3 hover:bg-secondary/40 transition-colors"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-muted-foreground mb-1">
            {format(parseISO(entry.date), "EEEE, MMMM d")}
          </p>
          <p className="text-sm text-foreground italic leading-relaxed">
            "{expanded ? entry.notes : preview}"
          </p>
        </div>
        <div className="flex-shrink-0 mt-0.5 text-muted-foreground">
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </div>
    </button>
  );
};

/* ── Main page ─────────────────────────────────────────────── */
const JournalPage = () => {
  const { data: entries = [], isLoading } = useEntries();
  const today = format(new Date(), "yyyy-MM-dd");

  const entriesByDate = useMemo(
    () => Object.fromEntries(entries.map((e) => [e.date, e])),
    [entries]
  );

  const todayEntry = entriesByDate[today] ?? null;

  // Past entries that have notes (excluding today)
  const pastWithNotes = useMemo(
    () => entries.filter((e) => e.date !== today && e.notes && e.notes.trim() !== ""),
    [entries, today]
  );

  return (
    <>
      <PageHeader title="Journal" subtitle="Your daily thoughts & feelings" />

      <div className="mx-auto max-w-lg px-4 py-4 space-y-6 animate-fade-in pb-10">
        {/* Today's editor */}
        <section className="space-y-2">
          <p className="px-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Write today's entry
          </p>
          {isLoading ? (
            <div className="rounded-2xl bg-card border border-border p-8 text-center">
              <span className="text-2xl animate-pulse">🧡</span>
            </div>
          ) : (
            <EditorCard date={today} entry={todayEntry} />
          )}
        </section>

        {/* Past entries */}
        {pastWithNotes.length > 0 && (
          <section className="space-y-2">
            <p className="px-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Past entries
            </p>
            <div className="space-y-2">
              {pastWithNotes.map((entry) => (
                <PastEntry key={entry.id} entry={entry} />
              ))}
            </div>
          </section>
        )}

        {!isLoading && pastWithNotes.length === 0 && (
          <div className="rounded-xl bg-secondary/40 border border-border px-4 py-8 text-center">
            <span className="text-3xl">📖</span>
            <p className="mt-2 text-sm text-muted-foreground">
              Your past journal entries will appear here.
            </p>
          </div>
        )}
      </div>
    </>
  );
};

export default JournalPage;
