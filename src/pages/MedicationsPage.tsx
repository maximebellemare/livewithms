import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import SEOHead from "@/components/SEOHead";
import { StaggerContainer, StaggerItem } from "@/components/StaggeredReveal";
import PageHeader from "@/components/PageHeader";
import { Plus, Pill, Trash2, Edit2, ArrowLeft, Bell, BellOff, Package, CalendarIcon } from "lucide-react";
import { useDbMedications, useSaveMedication, useDeleteMedication } from "@/hooks/useMedications";
import { CardListSkeleton } from "@/components/PageSkeleton";
import PullToRefresh from "@/components/PullToRefresh";
import { useQueryClient } from "@tanstack/react-query";
import MedicationStats from "@/components/medications/MedicationStats";
import SideEffectsTracker from "@/components/medications/SideEffectsTracker";
import RefillAlert from "@/components/medications/RefillAlert";
import DrugInteractionWarnings from "@/components/medications/DrugInteractionWarnings";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { parseISO } from "date-fns";

const MedicationsPage = () => {
  const { data: meds = [], isLoading } = useDbMedications();
  const saveMutation = useSaveMedication();
  const deleteMutation = useDeleteMedication();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);

  const handleRefresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["medications"] });
  }, [queryClient]);

  const handleSave = async () => {
    if (!editing?.name) return;
    await saveMutation.mutateAsync({
      id: editing.id,
      name: editing.name,
      dosage: editing.dosage || null,
      schedule_type: editing.schedule_type || "daily",
      times_per_day: editing.times_per_day,
      infusion_interval_months: editing.infusion_interval_months,
      active: editing.active ?? true,
      color: editing.color,
      reminder_time: editing.reminder_enabled ? editing.reminder_time || null : null,
      supply_count: editing.supply_count || null,
      supply_unit: editing.supply_unit || "pills",
      refill_date: editing.refill_date || null,
      pills_per_dose: editing.pills_per_dose || 1,
    });
    setShowForm(false);
    setEditing(null);
  };

  const handleDelete = async (id: string) => {
    await deleteMutation.mutateAsync(id);
  };

  const openEdit = (med: any) => {
    setEditing({ ...med, reminder_enabled: !!med.reminder_time });
    setShowForm(true);
  };

  const openNew = () => {
    setEditing({
      name: "",
      dosage: "",
      schedule_type: "daily",
      times_per_day: 1,
      infusion_interval_months: 6,
      active: true,
      reminder_enabled: false,
      reminder_time: "08:00",
      supply_count: null,
      supply_unit: "pills",
      refill_date: null,
      pills_per_dose: 1,
    });
    setShowForm(true);
  };

  if (showForm && editing) {
    return (
      <>
        <PageHeader
          title={editing.id ? "Edit Medication" : "Add Medication"}
          action={
            <button onClick={() => { setShowForm(false); setEditing(null); }} className="rounded-full p-2 text-muted-foreground hover:bg-secondary">
              <ArrowLeft className="h-5 w-5" />
            </button>
          }
        />
        <div className="mx-auto max-w-lg space-y-4 px-4 py-4 animate-fade-in">
          <div className="card-base space-y-3">
            <label className="block text-sm font-medium text-foreground">Medication name</label>
            <input
              value={editing.name || ""}
              onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              placeholder="e.g. Ocrevus, Tecfidera..."
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <label className="block text-sm font-medium text-foreground">Dosage</label>
            <input
              value={editing.dosage || ""}
              onChange={(e) => setEditing({ ...editing, dosage: e.target.value })}
              placeholder="e.g. 300mg, 0.5ml..."
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="card-base space-y-3">
            <label className="block text-sm font-medium text-foreground">Schedule</label>
            <div className="flex gap-2">
              {(["daily", "custom", "infusion"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setEditing({ ...editing, schedule_type: type })}
                  className={`flex-1 rounded-lg px-3 py-2 text-xs font-medium capitalize transition-all ${
                    editing.schedule_type === type
                      ? "bg-primary text-primary-foreground shadow-soft"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            {editing.schedule_type === "daily" && (
              <div className="space-y-2">
                <label className="block text-xs text-muted-foreground">Times per day</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      onClick={() => setEditing({ ...editing, times_per_day: n })}
                      className={`rounded-lg px-4 py-2 text-sm font-medium ${
                        editing.times_per_day === n
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {n}×
                    </button>
                  ))}
                </div>
              </div>
            )}

            {editing.schedule_type === "infusion" && (
              <div className="space-y-2">
                <label className="block text-xs text-muted-foreground">Every X months</label>
                <input
                  type="number"
                  min={1}
                  max={24}
                  value={editing.infusion_interval_months || 6}
                  onChange={(e) => setEditing({ ...editing, infusion_interval_months: Number(e.target.value) })}
                  className="w-24 rounded-lg border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
            )}
          </div>

          {/* Reminder time */}
          <div className="card-base space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">Daily reminder</label>
              <button
                onClick={() => setEditing({ ...editing, reminder_enabled: !editing.reminder_enabled })}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                  editing.reminder_enabled
                    ? "bg-primary/10 text-primary"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                {editing.reminder_enabled ? <Bell className="h-3.5 w-3.5" /> : <BellOff className="h-3.5 w-3.5" />}
                {editing.reminder_enabled ? "On" : "Off"}
              </button>
            </div>
            {editing.reminder_enabled && (
              <div className="space-y-2">
                <label className="block text-xs text-muted-foreground">Reminder time (your local time)</label>
                <select
                  value={editing.reminder_time || "08:00"}
                  onChange={(e) => {
                    // Convert local hour to UTC for storage
                    const localHour = parseInt(e.target.value.split(":")[0], 10);
                    const utcHour = (localHour - new Date().getTimezoneOffset() / 60 + 24) % 24;
                    const utcTime = `${String(Math.floor(utcHour)).padStart(2, "0")}:00`;
                    setEditing({ ...editing, reminder_time: utcTime, _display_time: e.target.value });
                  }}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {Array.from({ length: 18 }, (_, i) => i + 6).map((h) => {
                    const label = `${h === 0 ? 12 : h > 12 ? h - 12 : h}:00 ${h < 12 ? "AM" : "PM"}`;
                    const value = `${String(h).padStart(2, "0")}:00`;
                    return <option key={h} value={value}>{label}</option>;
                  })}
                </select>
                <p className="text-[10px] text-muted-foreground">
                  You'll get a push notification if you haven't logged this medication yet.
                </p>
              </div>
            )}
          </div>

          {/* Supply Tracking */}
          <div className="card-base space-y-3">
            <label className="block text-sm font-medium text-foreground flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              Supply Tracking (optional)
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Current supply</label>
                <input
                  type="number"
                  min={0}
                  value={editing.supply_count ?? ""}
                  onChange={(e) => setEditing({ ...editing, supply_count: e.target.value ? Number(e.target.value) : null })}
                  placeholder="e.g. 30"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Unit</label>
                <select
                  value={editing.supply_unit || "pills"}
                  onChange={(e) => setEditing({ ...editing, supply_unit: e.target.value })}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="pills">Pills</option>
                  <option value="capsules">Capsules</option>
                  <option value="tablets">Tablets</option>
                  <option value="ml">mL</option>
                  <option value="doses">Doses</option>
                  <option value="injections">Injections</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Per dose</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={editing.pills_per_dose || 1}
                  onChange={(e) => setEditing({ ...editing, pills_per_dose: Number(e.target.value) || 1 })}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Refill date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className={cn("w-full justify-start text-left font-normal text-xs", !editing.refill_date && "text-muted-foreground")}>
                      <CalendarIcon className="mr-1.5 h-3 w-3" />
                      {editing.refill_date ? format(parseISO(editing.refill_date), "MMM d") : "Set date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={editing.refill_date ? parseISO(editing.refill_date) : undefined}
                      onSelect={(d) => d && setEditing({ ...editing, refill_date: format(d, "yyyy-MM-dd") })}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* Side Effects (only when editing existing) */}
          {editing.id && (
            <SideEffectsTracker medicationId={editing.id} medicationName={editing.name} />
          )}

          <button
            onClick={handleSave}
            disabled={!editing.name || saveMutation.isPending}
            className="w-full rounded-full bg-primary py-3.5 text-base font-semibold text-primary-foreground shadow-card transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
          >
            {saveMutation.isPending ? "Saving..." : editing.id ? "Save Changes" : "Add Medication"}
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <SEOHead title="Medications" description="Track and manage your MS medications, dosages and reminders." />
      <PageHeader
        title="Medications"
        subtitle="Manage your medication schedule"
        showBack
        action={
          <button data-tour="meds-add-btn" onClick={openNew} className="rounded-full bg-primary p-2 text-primary-foreground shadow-soft transition-all hover:opacity-90 active:scale-[0.98]">
            <Plus className="h-5 w-5" />
          </button>
        }
      />
      <PullToRefresh onRefresh={handleRefresh} className="mx-auto max-w-lg space-y-3 px-4 py-4">
        <MedicationStats medications={meds} />
        <DrugInteractionWarnings medications={meds} />
        <RefillAlert medications={meds} />
        {isLoading ? (
          <CardListSkeleton count={3} />
        ) : meds.length === 0 ? (
          <StaggerItem>
          <div className="rounded-2xl bg-card border border-border shadow-soft px-6 py-10 text-center space-y-3">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-accent/50">
              <svg viewBox="0 0 48 48" className="h-10 w-10 text-primary" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="14" y="6" width="20" height="36" rx="10" />
                <line x1="14" y1="24" x2="34" y2="24" />
                <circle cx="24" cy="15" r="2" fill="currentColor" opacity="0.4" />
                <circle cx="24" cy="33" r="2" fill="currentColor" opacity="0.4" />
              </svg>
            </div>
            <h3 className="font-display text-base font-semibold text-foreground">No medications yet</h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
              Keep track of your treatments by adding your first medication. We'll help you stay on schedule.
            </p>
            <button onClick={openNew} className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft transition-all hover:opacity-90 active:scale-[0.98]">
              <Plus className="h-4 w-4" /> Add medication
            </button>
          </div>
          </StaggerItem>
        ) : (
          <div data-tour="meds-list">
          {meds.map((med) => (
            <StaggerItem key={med.id}>
            <div onClick={() => { openEdit(med); localStorage.setItem("hint_meds_tap_used", "1"); }} className="flex items-center gap-3 card-base mb-3 cursor-pointer">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-accent">
                <Pill className="h-5 w-5 text-accent-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">{med.name}</p>
                <p className="text-xs text-muted-foreground">
                  {med.dosage && `${med.dosage} · `}
                  {med.schedule_type === "daily" && `${med.times_per_day || 1}× daily`}
                  {med.schedule_type === "infusion" && `Every ${med.infusion_interval_months || 6} months`}
                  {med.schedule_type === "custom" && "Custom schedule"}
                  {med.reminder_time && (() => {
                    const utcH = parseInt(med.reminder_time!.split(":")[0], 10);
                    const localH = (utcH + new Date().getTimezoneOffset() / -60 + 24) % 24;
                    const displayH = localH === 0 ? 12 : localH > 12 ? localH - 12 : localH;
                    const ampm = localH < 12 ? "AM" : "PM";
                    return ` · 🔔 ${displayH}:00 ${ampm}`;
                  })()}
                </p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(med)} className="rounded-full p-2 text-muted-foreground hover:bg-secondary">
                  <Edit2 className="h-4 w-4" />
                </button>
                <button onClick={() => handleDelete(med.id)} className="rounded-full p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            </StaggerItem>
          ))}
          {!localStorage.getItem("hint_meds_tap_used") && (
            <p className="text-[10px] text-muted-foreground/50 text-center mt-1 animate-fade-in">
              Tap a med to log it as taken
            </p>
          )}
          </div>
        )}
      </PullToRefresh>
    </>
  );
};

export default MedicationsPage;
