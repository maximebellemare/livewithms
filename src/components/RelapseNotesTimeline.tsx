import { useMemo } from "react";
import { useRelapses } from "@/hooks/useRelapses";
import { FileText } from "lucide-react";
import { format, parseISO } from "date-fns";

export default function RelapseNotesTimeline() {
  const { data: relapses = [], isLoading } = useRelapses();

  const notes = useMemo(() => {
    return relapses
      .filter((r) => r.notes && r.notes.trim())
      .map((r) => ({
        id: r.id,
        date: r.start_date,
        severity: (r.severity ?? "moderate").toLowerCase(),
        note: r.notes!.trim(),
      }))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [relapses]);

  if (isLoading || notes.length === 0) return null;

  return (
    <div className="card-base">
      <div className="flex items-center gap-2 mb-3">
        <FileText className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold text-foreground">Relapse Notes</span>
        <span className="ml-auto text-[10px] text-muted-foreground">
          {notes.length} entr{notes.length !== 1 ? "ies" : "y"}
        </span>
      </div>

      <div className="relative pl-4 space-y-4">
        {/* vertical line */}
        <div className="absolute left-[5px] top-1 bottom-1 w-px bg-border" />

        {notes.map((n) => (
          <div key={n.id} className="relative">
            {/* dot */}
            <div className="absolute -left-4 top-1.5 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-card" />
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[11px] font-medium text-foreground">
                  {format(parseISO(n.date), "MMM d, yyyy")}
                </span>
                <span className="text-[10px] text-muted-foreground capitalize">{n.severity}</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{n.note}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
