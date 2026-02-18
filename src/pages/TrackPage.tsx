import { useMemo } from "react";
import PageHeader from "@/components/PageHeader";
import { Calendar, List } from "lucide-react";
import { useState } from "react";
import { useEntries } from "@/hooks/useEntries";

const TrackPage = () => {
  const [view, setView] = useState<"list" | "calendar">("list");
  const { data: entries = [], isLoading } = useEntries();

  return (
    <>
      <PageHeader
        title="Track"
        subtitle="Your symptom history"
        action={
          <div className="flex gap-1 rounded-lg bg-secondary p-0.5">
            <button
              onClick={() => setView("list")}
              className={`rounded-md p-1.5 transition-colors ${view === "list" ? "bg-card shadow-sm" : "text-muted-foreground"}`}
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => setView("calendar")}
              className={`rounded-md p-1.5 transition-colors ${view === "calendar" ? "bg-card shadow-sm" : "text-muted-foreground"}`}
            >
              <Calendar className="h-4 w-4" />
            </button>
          </div>
        }
      />
      <div className="mx-auto max-w-lg px-4 py-4">
        {isLoading ? (
          <div className="py-16 text-center"><span className="text-2xl">🧡</span></div>
        ) : entries.length === 0 ? (
          <div className="py-16 text-center animate-fade-in">
            <span className="text-4xl">📊</span>
            <p className="mt-3 font-display text-lg font-medium text-foreground">No entries yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Head to Today and log your first entry!
            </p>
          </div>
        ) : (
          <div className="space-y-3 animate-fade-in">
            {entries.map((entry) => (
              <div key={entry.id} className="rounded-xl bg-card p-4 shadow-soft">
                <p className="mb-2 text-xs font-medium text-muted-foreground">
                  {new Date(entry.date).toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
                <div className="grid grid-cols-5 gap-2 text-center">
                  {[
                    { label: "Fatigue", value: entry.fatigue, emoji: "🔋" },
                    { label: "Pain", value: entry.pain, emoji: "⚡" },
                    { label: "Fog", value: entry.brain_fog, emoji: "🌫️" },
                    { label: "Mood", value: entry.mood, emoji: "😊" },
                    { label: "Move", value: entry.mobility, emoji: "🚶" },
                  ].map(({ label, value, emoji }) => (
                    <div key={label}>
                      <span className="text-base">{emoji}</span>
                      <p className="text-lg font-bold text-foreground">{value ?? "—"}</p>
                      <p className="text-[10px] text-muted-foreground">{label}</p>
                    </div>
                  ))}
                </div>
                {entry.mood_tags && entry.mood_tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {entry.mood_tags.map((tag) => (
                      <span key={tag} className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium text-accent-foreground">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                {entry.notes && (
                  <p className="mt-2 text-xs text-muted-foreground italic">"{entry.notes}"</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default TrackPage;
