import { useState, useMemo, useEffect, useCallback } from "react";
import { format, isSameDay, parseISO } from "date-fns";
import PageHeader from "@/components/PageHeader";
import { Calendar } from "@/components/ui/calendar";
import { Plus, ArrowLeft, Trash2, Edit2, MapPin, Clock, CalendarIcon, Bell, BellOff, Repeat } from "lucide-react";
import { APPOINTMENT_TYPES, getAppointmentTypeInfo, AppointmentType } from "@/lib/appointments";
import { useDbAppointments, useSaveAppointment, useDeleteAppointment } from "@/hooks/useAppointments";
import { CardListSkeleton } from "@/components/PageSkeleton";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import TimePicker from "@/components/TimePicker";
import SwipeableAppointmentCard from "@/components/appointments/SwipeableAppointmentCard";
import { useIsMobile } from "@/hooks/use-mobile";
import PullToRefresh from "@/components/PullToRefresh";
import { useQueryClient } from "@tanstack/react-query";
import AppointmentStats from "@/components/appointments/AppointmentStats";
import PreVisitChecklist from "@/components/appointments/PreVisitChecklist";

const AppointmentsPage = () => {
  const { data: appointments = [], isLoading } = useDbAppointments();
  const saveMutation = useSaveAppointment();
  const deleteMutation = useDeleteAppointment();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [filterType, setFilterType] = useState<AppointmentType | "all">("all");
  const isMobile = useIsMobile();
  const [swipeHintDismissed, setSwipeHintDismissed] = useState(() => localStorage.getItem("hint_appt_swipe_used") === "1");

  const handleRefresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["appointments"] });
  }, [queryClient]);

  const appointmentDates = useMemo(() => {
    return appointments.map((a) => parseISO(a.date));
  }, [appointments]);

  const filteredAppointments = useMemo(() => {
    let filtered = appointments;
    if (filterType !== "all") {
      filtered = filtered.filter((a) => a.type === filterType);
    }
    if (viewMode === "calendar") {
      filtered = filtered.filter((a) => isSameDay(parseISO(a.date), selectedDate));
    }
    return filtered.sort((a, b) => a.date.localeCompare(b.date) || (a.time || "").localeCompare(b.time || ""));
  }, [appointments, filterType, viewMode, selectedDate]);

  const openNew = () => {
    setEditing({
      title: "",
      type: "neurologist",
      date: format(selectedDate, "yyyy-MM-dd"),
      time: "",
      location: "",
      notes: "",
      reminder: "none",
      recurrence: "none",
      checklist: [],
    });
    setShowForm(true);
  };

  const openEdit = (appt: any) => {
    setEditing({ ...appt });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!editing?.title || !editing?.date) return;
    await saveMutation.mutateAsync(editing);
    setShowForm(false);
    setEditing(null);
  };

  const handleDelete = async (id: string) => {
    await deleteMutation.mutateAsync(id);
  };

  if (showForm && editing) {
    return (
      <>
        <PageHeader
          title={editing.id ? "Edit Appointment" : "New Appointment"}
          action={
            <button onClick={() => { setShowForm(false); setEditing(null); }} className="rounded-full p-2 text-muted-foreground hover:bg-secondary">
              <ArrowLeft className="h-5 w-5" />
            </button>
          }
        />
        <div className="mx-auto max-w-lg space-y-4 px-4 py-4 pb-24 animate-fade-in">
          <div className="rounded-xl bg-card p-4 shadow-soft space-y-3">
            <label className="block text-sm font-medium text-foreground">Appointment title</label>
            <input
              value={editing.title || ""}
              onChange={(e) => setEditing({ ...editing, title: e.target.value })}
              placeholder="e.g. Neuro follow-up"
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="rounded-xl bg-card p-4 shadow-soft space-y-3">
            <label className="block text-sm font-medium text-foreground">Type</label>
            <div className="flex flex-wrap gap-2">
              {APPOINTMENT_TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setEditing({ ...editing, type: t.value })}
                  className={`rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                    editing.type === t.value
                      ? "bg-primary text-primary-foreground shadow-soft"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {t.emoji} {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl bg-card p-4 shadow-soft space-y-3">
            <label className="block text-sm font-medium text-foreground">Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !editing.date && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {editing.date ? format(parseISO(editing.date), "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={editing.date ? parseISO(editing.date) : undefined}
                  onSelect={(d) => d && setEditing({ ...editing, date: format(d, "yyyy-MM-dd") })}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
            <label className="block text-sm font-medium text-foreground">Time (optional)</label>
            <TimePicker value={editing.time || ""} onChange={(t) => setEditing({ ...editing, time: t })} />
          </div>

          <div className="rounded-xl bg-card p-4 shadow-soft space-y-3">
            <label className="block text-sm font-medium text-foreground">Location (optional)</label>
            <input value={editing.location || ""} onChange={(e) => setEditing({ ...editing, location: e.target.value })} placeholder="e.g. City Hospital" className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>

          <div className="rounded-xl bg-card p-4 shadow-soft space-y-3">
            <label className="block text-sm font-medium text-foreground">Reminder</label>
            <div className="flex flex-wrap gap-2">
              {[
                { value: "none", label: "None", icon: BellOff },
                { value: "1h", label: "1 hour before", icon: Bell },
                { value: "1d", label: "1 day before", icon: Bell },
                { value: "both", label: "Both", icon: Bell },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setEditing({ ...editing, reminder: opt.value })}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                    (editing.reminder || "none") === opt.value
                      ? "bg-primary text-primary-foreground shadow-soft"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  <opt.icon className="h-3.5 w-3.5" />
                  {opt.label}
                </button>
              ))}
            </div>
            {editing.reminder !== "none" && !editing.time && (
              <p className="text-xs text-muted-foreground">⚠️ Set a time above for hour-based reminders to work</p>
            )}
          </div>

          <div className="rounded-xl bg-card p-4 shadow-soft space-y-3">
            <label className="block text-sm font-medium text-foreground">Recurrence</label>
            <div className="flex flex-wrap gap-2">
              {[
                { value: "none", label: "One-time" },
                { value: "monthly", label: "Monthly" },
                { value: "quarterly", label: "Every 3 months" },
                { value: "biannual", label: "Every 6 months" },
                { value: "annual", label: "Yearly" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setEditing({ ...editing, recurrence: opt.value })}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                    (editing.recurrence || "none") === opt.value
                      ? "bg-primary text-primary-foreground shadow-soft"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {opt.value !== "none" && <Repeat className="h-3 w-3" />}
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <PreVisitChecklist
            type={editing.type || "custom"}
            checklist={editing.checklist || []}
            onChange={(checklist) => setEditing({ ...editing, checklist })}
          />

          <div className="rounded-xl bg-card p-4 shadow-soft">
            <label className="block text-sm font-medium text-foreground mb-2">Notes (optional)</label>
            <textarea rows={2} value={editing.notes || ""} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} placeholder="Questions to ask..." className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>

          <div className="pb-4">
            <button onClick={handleSave} disabled={!editing.title || !editing.date || saveMutation.isPending} className="w-full rounded-full bg-primary py-3.5 text-base font-semibold text-primary-foreground shadow-card transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50">
              {saveMutation.isPending ? "Saving..." : editing.id ? "Save Changes" : "Add Appointment"}
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Appointments"
        subtitle="Your upcoming visits"
        showBack
        action={
          <button data-tour="appts-add-btn" onClick={openNew} className="rounded-full bg-primary p-2 text-primary-foreground shadow-soft transition-all hover:opacity-90 active:scale-[0.98]">
            <Plus className="h-5 w-5" />
          </button>
        }
      />
      <PullToRefresh onRefresh={handleRefresh} className="mx-auto max-w-lg px-4 py-4 space-y-4">
        <div className="flex gap-2" data-tour="appts-view-toggle">
          {(["calendar", "list"] as const).map((mode) => (
            <button key={mode} onClick={() => setViewMode(mode)} className={`flex-1 rounded-lg py-2 text-xs font-medium capitalize transition-all ${viewMode === mode ? "bg-primary text-primary-foreground shadow-soft" : "bg-secondary text-muted-foreground"}`}>
              {mode}
            </button>
          ))}
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button onClick={() => setFilterType("all")} className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-medium transition-all ${filterType === "all" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>All</button>
          {APPOINTMENT_TYPES.map((t) => (
            <button key={t.value} onClick={() => setFilterType(t.value)} className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-medium transition-all ${filterType === t.value ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
              {t.emoji} {t.label}
            </button>
          ))}
        </div>

        {viewMode === "calendar" && (
          <div className="rounded-xl bg-card shadow-soft overflow-hidden animate-fade-in">
            <Calendar mode="single" selected={selectedDate} onSelect={(d) => d && setSelectedDate(d)} modifiers={{ hasAppointment: appointmentDates }} modifiersClassNames={{ hasAppointment: "bg-accent text-accent-foreground font-bold" }} className="p-3 pointer-events-auto" />
            <div className="border-t border-border px-4 py-2">
              <p className="text-xs font-medium text-muted-foreground">{format(selectedDate, "EEEE, MMMM d")}</p>
            </div>
          </div>
        )}

        <AppointmentStats appointments={appointments} />

        <div className="space-y-2" data-tour="appts-list">
          {isLoading ? (
            <CardListSkeleton count={2} />
          ) : filteredAppointments.length === 0 ? (
            <div className="rounded-2xl bg-card border border-border shadow-soft px-6 py-10 text-center space-y-3 animate-fade-in">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-accent/50">
                <svg viewBox="0 0 48 48" className="h-10 w-10 text-primary" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="6" y="10" width="36" height="32" rx="4" />
                  <line x1="6" y1="20" x2="42" y2="20" />
                  <line x1="16" y1="6" x2="16" y2="14" />
                  <line x1="32" y1="6" x2="32" y2="14" />
                  <circle cx="24" cy="30" r="4" opacity="0.4" fill="currentColor" />
                </svg>
              </div>
              <h3 className="font-display text-base font-semibold text-foreground">
                {viewMode === "calendar" ? "Nothing scheduled today" : "No appointments found"}
              </h3>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
                {viewMode === "calendar"
                  ? "This day is free. Tap below to schedule a visit."
                  : "Add your upcoming appointments to stay on top of your care."}
              </p>
              <button onClick={openNew} className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft transition-all hover:opacity-90 active:scale-[0.98]">
                <Plus className="h-4 w-4" /> Add appointment
              </button>
            </div>
          ) : (
            filteredAppointments.map((appt, idx) => (
              <div key={appt.id}>
                <SwipeableAppointmentCard
                  appt={appt}
                  showDate={viewMode === "list"}
                  onEdit={() => openEdit(appt)}
                  onDelete={() => handleDelete(appt.id)}
                />
                {idx === 0 && isMobile && !swipeHintDismissed && (
                  <p
                    className="mt-1.5 text-center text-[11px] text-muted-foreground/60 animate-fade-in cursor-pointer select-none"
                    onClick={() => {
                      localStorage.setItem("hint_appt_swipe_used", "1");
                      setSwipeHintDismissed(true);
                    }}
                  >
                    ← Swipe left to edit or delete
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </PullToRefresh>
    </>
  );
};

export default AppointmentsPage;
