import { useState, useMemo, useRef } from "react";
import SEOHead from "@/components/SEOHead";
import { StaggerContainer, StaggerItem } from "@/components/StaggeredReveal";
import { format, isToday, isYesterday, startOfWeek, addDays, isFuture } from "date-fns";
import confetti from "canvas-confetti";
import PageHeader from "@/components/PageHeader";
import { useEntries, useSaveEntry, DailyEntry } from "@/hooks/useEntries";
import { JournalEditorSkeleton } from "@/components/PageSkeleton";
import { PenLine, ChevronDown, ChevronUp, CheckCircle2, X } from "lucide-react";
import { toast } from "sonner";

import DailyPromptCard from "@/components/DailyPromptCard";
import ThisWeekInReflection from "@/components/ThisWeekInReflection";
import WeeklyReflectionSummary from "@/components/journal/WeeklyReflectionSummary";
import MoodPatternNudge from "@/components/journal/MoodPatternNudge";
import SmallWinField from "@/components/journal/SmallWinField";
import VoiceJournalButton from "@/components/journal/VoiceJournalButton";


/* ── Parse a yyyy-MM-dd string as local date (avoids UTC midnight shift) ── */
function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/* ── Date label helper ─────────────────────────────────────── */
function dateLabel(dateStr: string): string {
  const d = parseLocalDate(dateStr);
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  return format(d, "EEEE, MMMM d");
}

/* ── Entry editor card ─────────────────────────────────────── */
interface EditorCardProps {
  date: string;
  entry: DailyEntry | null;
  recentEntries?: DailyEntry[];
  onFirstReflection?: () => void;
}

const EditorCard = ({ date, entry, recentEntries = [], onFirstReflection }: EditorCardProps) => {
  const [text, setText] = useState(entry?.notes ?? "");
  const [saved, setSaved] = useState(false);
  const saveEntry = useSaveEntry();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isDirty = text !== (entry?.notes ?? "");

  const handleSave = async () => {
    if (text.length > 2000) {
      toast.error("Note is too long (max 2000 characters).");
      return;
    }
    const isFirstNote = !entry?.notes?.trim() && !!text.trim();
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
    if (isFirstNote) onFirstReflection?.();
  };

  const appendText = (newText: string) => {
    const prefix = text.trim() ? text + "\n\n" : "";
    setText(prefix + newText + " ");
    setSaved(false);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
        textareaRef.current.focus();
      }
    }, 50);
  };

  const handleVoiceTranscript = (transcript: string) => {
    const prefix = text.trim() ? text + " " : "";
    setText(prefix + transcript);
    setSaved(false);
  };

  return (
    <div className="rounded-2xl bg-card border border-border shadow-soft p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">{dateLabel(date)}</p>
        <p className="text-xs text-muted-foreground">{format(parseLocalDate(date), "MMM d, yyyy")}</p>
      </div>

      {/* Daily rotating prompt (symptom-linked when data exists) */}
      <div data-tour="journal-prompt">
        <DailyPromptCard
          entry={entry}
          onUsePrompt={(prompt) => appendText(prompt)}
        />
      </div>


      {/* Small win / gratitude field */}
      <SmallWinField
        onSubmit={(win) => {
          appendText(`🏆 Small win: ${win}`);
          toast.success("Win captured! 🎉", { duration: 2000 });
        }}
      />

      {/* Voice input + textarea */}
      <div className="flex items-center gap-2">
        <VoiceJournalButton onTranscript={handleVoiceTranscript} />
      </div>

      <textarea
        ref={textareaRef}
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


/* ── Past entry row (with inline editor) ──────────────────── */
interface PastEntryProps {
  entry: DailyEntry;
}

const PastEntry = ({ entry }: PastEntryProps) => {
  const [editing, setEditing] = useState(false);
  const handleToggle = () => {
    setEditing((e) => !e);
    if (!localStorage.getItem("hint_journal_swipe_used")) {
      localStorage.setItem("hint_journal_swipe_used", "1");
    }
  };
  const [text, setText] = useState(entry.notes ?? "");
  const [saved, setSaved] = useState(false);
  const saveEntry = useSaveEntry();

  const isDirty = text !== (entry.notes ?? "");
  const preview = text.length > 120 ? text.slice(0, 120) + "…" : text;

  const handleSave = async () => {
    if (text.length > 2000) {
      toast.error("Note is too long (max 2000 characters).");
      return;
    }
    await saveEntry.mutateAsync({
      date: entry.date,
      notes: text.trim() || null,
      fatigue: entry.fatigue ?? null,
      pain: entry.pain ?? null,
      brain_fog: entry.brain_fog ?? null,
      mood: entry.mood ?? null,
      mobility: entry.mobility ?? null,
      sleep_hours: entry.sleep_hours ?? null,
      mood_tags: entry.mood_tags ?? [],
    });
    setSaved(true);
    setTimeout(() => { setSaved(false); setEditing(false); }, 1500);
    toast.success("Entry updated 🧡");
  };

  return (
    <div className="rounded-xl bg-card border border-border shadow-soft overflow-hidden transition-all">
      <button
        onClick={handleToggle}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 hover:bg-secondary/40 transition-colors text-left"
      >
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-muted-foreground mb-0.5">
            {format(parseLocalDate(entry.date), "EEEE, MMMM d")}
          </p>
          {!editing && text && (
            <p className="text-sm text-foreground italic leading-relaxed truncate">
              "{preview}"
            </p>
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0 text-muted-foreground">
          {!editing && <PenLine className="h-3.5 w-3.5" />}
          {editing ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </button>

      {editing && (
        <div className="px-4 pb-4 space-y-3 border-t border-border animate-fade-in">
          <textarea
            value={text}
            onChange={(e) => { setText(e.target.value); setSaved(false); }}
            maxLength={2000}
            rows={4}
            autoFocus
            className="mt-3 w-full resize-none rounded-xl bg-secondary/60 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
          />
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">{text.length}/2000</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setText(entry.notes ?? ""); setEditing(false); }}
                className="flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-secondary transition-colors"
              >
                <X className="h-3 w-3" /> Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!isDirty || saveEntry.isPending}
                className={`flex items-center gap-1.5 rounded-xl px-4 py-1.5 text-xs font-semibold transition-all
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
        </div>
      )}
    </div>
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

  const pastEntries = useMemo(
    () => entries.filter((e) => e.date !== today),
    [entries, today]
  );

  const isFirstThisWeek = useMemo(() => {
    const monday = startOfWeek(new Date(), { weekStartsOn: 1 });
    const weekDates = Array.from({ length: 7 }, (_, i) => addDays(monday, i))
      .filter((d) => !isFuture(d))
      .map((d) => format(d, "yyyy-MM-dd"))
      .filter((d) => d !== today);
    return !weekDates.some((d) => !!entriesByDate[d]?.notes?.trim());
  }, [entries, today]);

  const fireConfetti = () => {
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.55 }, colors: ["#E8751A", "#f59e0b", "#10b981", "#6366f1"] });
    setTimeout(() => confetti({ particleCount: 40, spread: 50, origin: { y: 0.5 }, angle: 60 }), 200);
    setTimeout(() => confetti({ particleCount: 40, spread: 50, origin: { y: 0.5 }, angle: 120 }), 350);
    toast.success("First reflection of the week — brilliant! 🎉", { duration: 4000 });
  };

  return (
    <>
      <SEOHead title="Journal" description="Write daily reflections and track your emotional well-being with MS." />
      <PageHeader title="Journal" subtitle="Your daily thoughts & feelings" />

      <StaggerContainer className="mx-auto max-w-lg px-4 py-4 space-y-6 pb-10">
        {/* Today's editor */}
        <StaggerItem>
        <section data-tour="journal-editor" className="space-y-2">
          <p className="px-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Write today's entry
          </p>
          {isLoading ? (
            <JournalEditorSkeleton />
          ) : (
            <EditorCard
              date={today}
              entry={todayEntry}
              recentEntries={entries}
              onFirstReflection={isFirstThisWeek ? fireConfetti : undefined}
            />
          )}
        </section>
        </StaggerItem>

        {/* Mood pattern nudges */}
        {!isLoading && entries.length >= 3 && (
          <StaggerItem>
            <MoodPatternNudge entries={entries} />
          </StaggerItem>
        )}

        {/* AI weekly reflection summary */}
        {!isLoading && entries.length >= 2 && (
          <StaggerItem>
            <WeeklyReflectionSummary entries={entries} />
          </StaggerItem>
        )}

        {/* This week in reflection */}
        <StaggerItem>
        <div data-tour="journal-week">
          <ThisWeekInReflection entries={entries} />
        </div>
        </StaggerItem>

        {/* Past entries */}
        {pastEntries.length > 0 && (
          <StaggerItem>
          <section className="space-y-2">
            <p className="px-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Past entries
            </p>
            <div className="space-y-2">
              {pastEntries.map((entry) => (
                <div key={entry.id}>
                  <PastEntry entry={entry} />
                </div>
              ))}
            </div>
            {!localStorage.getItem("hint_journal_swipe_used") && (
              <p className="text-[10px] text-muted-foreground/50 text-center mt-2 animate-fade-in">
                Swipe an entry to edit or delete it
              </p>
            )}
          </section>
          </StaggerItem>
        )}

        {!isLoading && pastEntries.length === 0 && (
          <StaggerItem>
          <div className="rounded-2xl bg-card border border-border shadow-soft px-6 py-10 text-center space-y-3">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-accent/50">
              <svg viewBox="0 0 48 48" className="h-10 w-10 text-primary" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="8" y="4" width="32" height="40" rx="4" />
                <line x1="14" y1="14" x2="34" y2="14" />
                <line x1="14" y1="22" x2="30" y2="22" />
                <line x1="14" y1="30" x2="26" y2="30" />
                <path d="M32 36l4-4-4-4" opacity="0.5" />
              </svg>
            </div>
            <h3 className="font-display text-base font-semibold text-foreground">No past entries yet</h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
              Start writing today and your reflections will build up here — a personal timeline of how you're feeling.
            </p>
          </div>
          </StaggerItem>
        )}
      </StaggerContainer>
    </>
  );
};

export default JournalPage;
