import { useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import { Plus, Pill, Trash2, Edit2, ArrowLeft } from "lucide-react";
import { useDbMedications, useSaveMedication, useDeleteMedication } from "@/hooks/useMedications";

const MedicationsPage = () => {
  const { data: meds = [], isLoading } = useDbMedications();
  const saveMutation = useSaveMedication();
  const deleteMutation = useDeleteMedication();
  const [editing, setEditing] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);

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
    });
    setShowForm(false);
    setEditing(null);
  };

  const handleDelete = async (id: string) => {
    await deleteMutation.mutateAsync(id);
  };

  const openEdit = (med: any) => {
    setEditing({ ...med });
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

          <div className="rounded-xl bg-card p-4 shadow-soft space-y-3">
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
                  {[1, 2, 3].map((n) => (
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
        {isLoading ? (
          <div className="py-12 text-center"><span className="text-2xl">🧡</span></div>
        ) : meds.length === 0 ? (
          <div className="py-12 text-center animate-fade-in">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent">
              <Pill className="h-7 w-7 text-accent-foreground" />
            </div>
            <h2 className="font-display text-lg font-semibold text-foreground">No medications yet</h2>
            <p className="mt-1 text-sm text-muted-foreground">Tap + to add your first medication</p>
          </div>
        ) : (
          meds.map((med) => (
            <div key={med.id} className="flex items-center gap-3 rounded-xl bg-card p-4 shadow-soft animate-fade-in">
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
          ))
        )}
      </div>
    </>
  );
};

export default MedicationsPage;
