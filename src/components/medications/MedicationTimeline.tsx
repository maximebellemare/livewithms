import { useMemo } from "react";
import { format, parseISO, differenceInMonths } from "date-fns";
import { Pill, Calendar } from "lucide-react";
import { DbMedication } from "@/hooks/useMedications";

interface Props {
  medications: DbMedication[];
  onEdit: (med: DbMedication) => void;
}

const MedicationTimeline = ({ medications, onEdit }: Props) => {
  const { current, past } = useMemo(() => {
    const curr: DbMedication[] = [];
    const p: DbMedication[] = [];
    for (const med of medications) {
      if (med.active && !med.end_date) {
        curr.push(med);
      } else {
        p.push(med);
      }
    }
    // Sort past by end_date descending, then start_date
    p.sort((a, b) => {
      const aEnd = a.end_date || a.start_date || a.created_at;
      const bEnd = b.end_date || b.start_date || b.created_at;
      return new Date(bEnd).getTime() - new Date(aEnd).getTime();
    });
    return { current: curr, past: p };
  }, [medications]);

  const formatDateRange = (med: DbMedication) => {
    const start = med.start_date || med.created_at.split("T")[0];
    const startStr = format(parseISO(start), "MMM yyyy");
    if (!med.end_date) return `${startStr} — Present`;
    const endStr = format(parseISO(med.end_date), "MMM yyyy");
    const months = differenceInMonths(parseISO(med.end_date), parseISO(start));
    const duration = months >= 12
      ? `${Math.floor(months / 12)}y ${months % 12}m`
      : `${months}m`;
    return `${startStr} — ${endStr} (${duration})`;
  };

  const TimelineCard = ({ med, isCurrent }: { med: DbMedication; isCurrent: boolean }) => (
    <button
      onClick={() => onEdit(med)}
      className="relative flex w-full items-start gap-3 text-left transition-all active:scale-[0.98]"
    >
      {/* Timeline dot + line */}
      <div className="flex flex-col items-center pt-1">
        <div className={`h-3 w-3 rounded-full border-2 ${
          isCurrent
            ? "border-primary bg-primary"
            : "border-muted-foreground/40 bg-muted"
        }`} />
        <div className="w-0.5 flex-1 bg-border" />
      </div>

      {/* Card */}
      <div className={`mb-4 flex-1 rounded-xl border p-3 transition-all hover:shadow-card ${
        isCurrent
          ? "border-primary/30 bg-primary/5"
          : "border-border bg-card"
      }`}>
        <div className="flex items-center gap-2">
          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
            isCurrent ? "bg-primary/15" : "bg-muted"
          }`}>
            <Pill className={`h-4 w-4 ${isCurrent ? "text-primary" : "text-muted-foreground"}`} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground truncate">{med.name}</p>
            {med.dosage && (
              <p className="text-xs text-muted-foreground">{med.dosage}</p>
            )}
          </div>
          {isCurrent && (
            <span className="shrink-0 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">
              Current
            </span>
          )}
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          <span>{formatDateRange(med)}</span>
        </div>
        {med.schedule_type && (
          <p className="mt-1 text-xs text-muted-foreground">
            {med.schedule_type === "daily" && `${med.times_per_day || 1}× daily`}
            {med.schedule_type === "infusion" && `Infusion every ${med.infusion_interval_months || 6} months`}
            {med.schedule_type === "custom" && "Custom schedule"}
          </p>
        )}
      </div>
    </button>
  );

  if (medications.length === 0) {
    return (
      <div className="rounded-2xl bg-card border border-border shadow-soft px-6 py-10 text-center space-y-2">
        <Calendar className="h-8 w-8 text-muted-foreground mx-auto" />
        <p className="text-sm text-muted-foreground">No medications to show on the timeline.</p>
        <p className="text-xs text-muted-foreground">Add a medication and set its start date to see it here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {current.length > 0 && (
        <div>
          <p className="section-label mb-3">Current Medications</p>
          <div>
            {current.map((med) => (
              <TimelineCard key={med.id} med={med} isCurrent />
            ))}
          </div>
        </div>
      )}

      {past.length > 0 && (
        <div>
          <p className="section-label mb-3">Past Medications</p>
          <div>
            {past.map((med) => (
              <TimelineCard key={med.id} med={med} isCurrent={false} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicationTimeline;
