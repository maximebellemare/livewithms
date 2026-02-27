import { useMemo } from "react";
import { parseISO, format, isThisMonth, isBefore, startOfDay } from "date-fns";
import { CalendarIcon, CalendarCheck, CalendarClock, TrendingUp } from "lucide-react";
import { DbAppointment } from "@/hooks/useAppointments";
import { getAppointmentTypeInfo, AppointmentType } from "@/lib/appointments";

interface AppointmentStatsProps {
  appointments: DbAppointment[];
}

const AppointmentStats = ({ appointments }: AppointmentStatsProps) => {
  const stats = useMemo(() => {
    const today = startOfDay(new Date());
    const upcoming = appointments.filter((a) => !isBefore(parseISO(a.date), today));
    const thisMonth = upcoming.filter((a) => isThisMonth(parseISO(a.date)));
    const next = upcoming.sort((a, b) => a.date.localeCompare(b.date))[0];

    return { upcoming: upcoming.length, thisMonth: thisMonth.length, next };
  }, [appointments]);

  if (appointments.length === 0) return null;

  const nextTypeInfo = stats.next
    ? getAppointmentTypeInfo(stats.next.type as AppointmentType)
    : null;

  return (
    <div className="rounded-xl bg-card p-4 shadow-soft space-y-3 animate-fade-in">
      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col items-center gap-1 rounded-lg bg-secondary/50 p-3">
          <CalendarClock className="h-4 w-4 text-primary" />
          <span className="text-lg font-bold text-foreground">{stats.upcoming}</span>
          <span className="text-[10px] text-muted-foreground">Upcoming</span>
        </div>
        <div className="flex flex-col items-center gap-1 rounded-lg bg-secondary/50 p-3">
          <CalendarCheck className="h-4 w-4 text-primary" />
          <span className="text-lg font-bold text-foreground">{stats.thisMonth}</span>
          <span className="text-[10px] text-muted-foreground">This Month</span>
        </div>
        <div className="flex flex-col items-center gap-1 rounded-lg bg-secondary/50 p-3">
          <TrendingUp className="h-4 w-4 text-primary" />
          <span className="text-lg font-bold text-foreground">
            {appointments.filter((a) => isBefore(parseISO(a.date), startOfDay(new Date()))).length}
          </span>
          <span className="text-[10px] text-muted-foreground">Completed</span>
        </div>
      </div>

      {stats.next && nextTypeInfo && (
        <div className="flex items-center gap-3 rounded-lg bg-primary/5 border border-primary/10 px-3 py-2.5">
          <span className="text-lg">{nextTypeInfo.emoji}</span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-foreground truncate">
              Next: {stats.next.title}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {format(parseISO(stats.next.date), "EEEE, MMM d")}
              {stats.next.time ? ` at ${stats.next.time}` : ""}
            </p>
          </div>
          <CalendarIcon className="h-4 w-4 text-primary shrink-0" />
        </div>
      )}
    </div>
  );
};

export default AppointmentStats;
