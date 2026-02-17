import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { format, parseISO, differenceInDays } from "date-fns";
import { CalendarIcon, Clock, MapPin, ChevronRight } from "lucide-react";
import { getUpcomingAppointments, getAppointmentTypeInfo, Appointment } from "@/lib/appointments";

const UpcomingAppointments = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    setAppointments(getUpcomingAppointments(3));
  }, []);

  if (appointments.length === 0) return null;

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="rounded-xl bg-card p-4 shadow-soft space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-foreground flex items-center gap-2">
          <CalendarIcon className="h-4 w-4 text-primary" />
          Upcoming Appointments
        </p>
        <button
          onClick={() => navigate("/appointments")}
          className="text-[11px] font-medium text-primary flex items-center gap-0.5"
        >
          View all <ChevronRight className="h-3 w-3" />
        </button>
      </div>
      {appointments.map((appt) => {
        const typeInfo = getAppointmentTypeInfo(appt.type);
        const daysUntil = differenceInDays(parseISO(appt.date), new Date());
        const isToday = appt.date === today;
        const isTomorrow = daysUntil === 1;

        return (
          <div
            key={appt.id}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all ${
              isToday ? "bg-accent/60" : "bg-secondary/30"
            }`}
          >
            <span className="text-base">{typeInfo.emoji}</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground truncate">{appt.title}</p>
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                <span>
                  {isToday ? "Today" : isTomorrow ? "Tomorrow" : format(parseISO(appt.date), "MMM d")}
                </span>
                {appt.time && (
                  <>
                    <span>·</span>
                    <span>{appt.time}</span>
                  </>
                )}
              </div>
            </div>
            {isToday && (
              <span className="text-[10px] font-medium text-primary bg-accent px-2 py-0.5 rounded-full">
                Today
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default UpcomingAppointments;
