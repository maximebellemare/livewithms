import { useMemo } from "react";
import { format } from "date-fns";
import { CalendarPlus } from "lucide-react";
import { useDbAppointments } from "@/hooks/useAppointments";
import { EnergyActivity } from "@/hooks/useEnergyBudget";

const APPT_COST: Record<string, number> = {
  neurologist: 3,
  mri: 4,
  labs: 2,
  therapy: 2,
  custom: 2,
};

interface Props {
  budgetId: string;
  activities: EnergyActivity[];
  onImport: (name: string, cost: number) => void;
}

export default function AppointmentImport({ budgetId, activities, onImport }: Props) {
  const { data: appointments = [] } = useDbAppointments();
  const today = format(new Date(), "yyyy-MM-dd");

  const todayAppts = useMemo(() => {
    const existing = new Set(activities.map((a) => a.name.toLowerCase()));
    return appointments
      .filter((a) => a.date === today)
      .filter((a) => !existing.has(a.title.toLowerCase()))
      .filter((a) => !existing.has(`📋 ${a.title}`.toLowerCase()));
  }, [appointments, today, activities]);

  if (todayAppts.length === 0) return null;

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 space-y-2">
      <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
        <CalendarPlus className="h-3.5 w-3.5 text-primary" />
        Today's Appointments
      </p>
      <p className="text-[11px] text-muted-foreground">
        Auto-import as energy activities:
      </p>
      <div className="flex flex-wrap gap-1.5">
        {todayAppts.map((appt) => {
          const cost = APPT_COST[appt.type] ?? 2;
          return (
            <button
              key={appt.id}
              onClick={() => onImport(`📋 ${appt.title}`, cost)}
              className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs text-foreground hover:bg-primary/20 active:scale-95 transition-all"
            >
              {appt.title} ({cost}🥄)
            </button>
          );
        })}
      </div>
    </div>
  );
}
