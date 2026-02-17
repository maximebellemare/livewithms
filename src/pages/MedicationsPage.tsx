import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import { Plus, Pill, ChevronRight, Trash2, Edit2, ArrowLeft } from "lucide-react";
import {
  Medication,
  getMedications,
  saveMedication,
  deleteMedication,
  getAdherenceRate,
} from "@/lib/medications";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const generateId = () => Math.random().toString(36).slice(2, 10);

const emptyMed: Omit<Medication, "id" | "createdAt"> = {
  name: "",
  dosage: "",
  scheduleType: "daily",
  timesPerDay: 1,
  timeSlots: ["08:00"],
  customDays: [1, 2, 3, 4, 5],
  infusionIntervalMonths: 6,
  nextInfusionDate: "",
  notes: "",
};

const MedicationsPage = () => {
  const [meds, setMeds] = useState<Medication[]>([]);
  const [editing, setEditing] = useState<Partial<Medication> | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    setMeds(getMedications());
  }, []);

  const refresh = () => setMeds(getMedications());

  const handleSave = () => {
    if (!editing?.name) return;
    const med: Medication = {
      id: editing.id || generateId(),
      name: editing.name,
      dosage: editing.dosage || "",
      scheduleType: editing.scheduleType || "daily",
      timesPerDay: editing.timesPerDay,
      timeSlots: editing.timeSlots,
      customDays: editing.customDays,
      infusionIntervalMonths: editing.infusionIntervalMonths,
      nextInfusionDate: editing.nextInfusionDate,
      notes: editing.notes,
      createdAt: editing.createdAt || new Date().toISOString(),
    };
    saveMedication(med);
    setShowForm(false);
    setEditing(null);
    refresh();
  };

  const handleDelete = (id: string) => {
    deleteMedication(id);
    refresh();
  };

  const openEdit = (med: Medication) => {
    setEditing({ ...med });
    setShowForm(true);
  };

  const openNew = () => {
    setEditing({ ...emptyMed });
    setShowForm(true);
  };

  const toggleDay = (day: number) => {
    if (!editing) return;
    const days = editing.customDays || [];
    setEditing({
      ...editing,
      customDays: days.includes(day) ? days.filter((d) => d !== day) : [...days, day],
    });
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
          {/* Name */}
          <div className="rounded-xl bg-card p-4 shadow-soft space-y-3">
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

          {/* Schedule type */}
          <div className="rounded-xl bg-card p-4 shadow-soft space-y-3">
            <label className="block text-sm font-medium text-foreground">Schedule</label>
            <div className="flex gap-2">
              {(["daily", "custom", "infusion"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setEditing({ ...editing, scheduleType: type })}
                  className={`flex-1 rounded-lg px-3 py-2 text-xs font-medium capitalize transition-all ${
                    editing.scheduleType === type
                      ? "bg-primary text-primary-foreground shadow-soft"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            {editing.scheduleType === "daily" && (
              <div className="space-y-2">
                <label className="block text-xs text-muted-foreground">Times per day</label>
                <div className="flex gap-2">
                  {[1, 2, 3].map((n) => (
                    <button
                      key={n}
                      onClick={() => {
                        const slots = Array.from({ length: n }, (_, i) =>
                          i === 0 ? "08:00" : i === 1 ? "14:00" : "20:00"
                        );
                        setEditing({ ...editing, timesPerDay: n, timeSlots: slots });
                      }}
                      className={`rounded-lg px-4 py-2 text-sm font-medium ${
                        editing.timesPerDay === n
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {n}×
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {(editing.timeSlots || []).map((slot, i) => (
                    <input
                      key={i}
                      type="time"
                      value={slot}
                      onChange={(e) => {
                        const slots = [...(editing.timeSlots || [])];
                        slots[i] = e.target.value;
                        setEditing({ ...editing, timeSlots: slots });
                      }}
                      className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    />
                  ))}
                </div>
              </div>
            )}

            {editing.scheduleType === "custom" && (
              <div className="space-y-2">
                <label className="block text-xs text-muted-foreground">Select days</label>
                <div className="flex gap-1.5">
                  {DAY_LABELS.map((label, i) => (
                    <button
                      key={i}
                      onClick={() => toggleDay(i)}
                      className={`flex-1 rounded-lg py-2 text-xs font-medium transition-all ${
                        editing.customDays?.includes(i)
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {editing.scheduleType === "infusion" && (
              <div className="space-y-2">
                <label className="block text-xs text-muted-foreground">Every X months</label>
                <input
                  type="number"
                  min={1}
                  max={24}
                  value={editing.infusionIntervalMonths || 6}
                  onChange={(e) => setEditing({ ...editing, infusionIntervalMonths: Number(e.target.value) })}
                  className="w-24 rounded-lg border border-input bg-background px-3 py-2 text-sm"
                />
                <label className="block text-xs text-muted-foreground mt-2">Next infusion date</label>
                <input
                  type="date"
                  value={editing.nextInfusionDate || ""}
                  onChange={(e) => setEditing({ ...editing, nextInfusionDate: e.target.value })}
                  className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="rounded-xl bg-card p-4 shadow-soft">
            <label className="block text-sm font-medium text-foreground mb-2">Notes (optional)</label>
            <textarea
              rows={2}
              value={editing.notes || ""}
              onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
              placeholder="Side effects to watch, instructions..."
              className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={!editing.name}
            className="w-full rounded-full bg-primary py-3.5 text-base font-semibold text-primary-foreground shadow-card transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
          >
            {editing.id ? "Save Changes" : "Add Medication"}
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Medications"
        subtitle="Manage your medication schedule"
        action={
          <button onClick={openNew} className="rounded-full bg-primary p-2 text-primary-foreground shadow-soft transition-all hover:opacity-90 active:scale-[0.98]">
            <Plus className="h-5 w-5" />
          </button>
        }
      />
      <div className="mx-auto max-w-lg space-y-3 px-4 py-4">
        {meds.length === 0 ? (
          <div className="py-12 text-center animate-fade-in">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent">
              <Pill className="h-7 w-7 text-accent-foreground" />
            </div>
            <h2 className="font-display text-lg font-semibold text-foreground">No medications yet</h2>
            <p className="mt-1 text-sm text-muted-foreground">Tap + to add your first medication</p>
          </div>
        ) : (
          meds.map((med) => {
            const adherence = getAdherenceRate(med.id);
            return (
              <div
                key={med.id}
                className="flex items-center gap-3 rounded-xl bg-card p-4 shadow-soft animate-fade-in"
              >
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-accent">
                  <Pill className="h-5 w-5 text-accent-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">{med.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {med.dosage && `${med.dosage} · `}
                    {med.scheduleType === "daily" && `${med.timesPerDay || 1}× daily`}
                    {med.scheduleType === "custom" &&
                      `${(med.customDays || []).map((d) => DAY_LABELS[d]).join(", ")}`}
                    {med.scheduleType === "infusion" &&
                      `Every ${med.infusionIntervalMonths || 6} months`}
                  </p>
                  {adherence > 0 && (
                    <div className="mt-1 flex items-center gap-2">
                      <div className="h-1.5 w-16 rounded-full bg-secondary overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${adherence}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground">{adherence}%</span>
                    </div>
                  )}
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
            );
          })
        )}
      </div>
    </>
  );
};

export default MedicationsPage;
