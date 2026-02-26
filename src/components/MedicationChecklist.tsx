import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, X, Pill } from "lucide-react";
import { useDbMedications, useDbMedicationLogs, useLogMedication } from "@/hooks/useMedications";

const MedicationChecklist = () => {
  const today = new Date().toISOString().split("T")[0];
  const { data: allMeds = [] } = useDbMedications();
  const { data: allLogs = [] } = useDbMedicationLogs(today, today);
  const logMutation = useLogMedication();

  // Only show active daily meds for now
  const meds = allMeds.filter((m) => m.active && m.schedule_type === "daily");
  const logs = allLogs;

  const getLogStatus = (medId: string) => {
    return logs.find((l) => l.medication_id === medId)?.status;
  };

  const handleLog = async (medId: string, status: string) => {
    await logMutation.mutateAsync({
      medication_id: medId,
      date: today,
      status,
    });
  };

  if (meds.length === 0) return null;

  const allDone = meds.every((med) => getLogStatus(med.id));

  return (
    <div className="card-base space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-foreground flex items-center gap-2">
          <Pill className="h-4 w-4 text-primary" />
          Today's Medications
        </p>
        {allDone && (
          <span className="text-[10px] font-medium text-primary bg-accent px-2 py-0.5 rounded-full">
            All done ✓
          </span>
        )}
      </div>
      {!allDone && (
        <p className="text-[10px] text-muted-foreground">Tap ✓ if you took it, ✗ if you skipped it.</p>
      )}
      <Link to="/medications" className="text-[10px] font-medium text-primary hover:underline">
        + Add or manage medications
      </Link>
      {meds.map((med) => {
        const status = getLogStatus(med.id);
        return (
          <div
            key={med.id}
            className={`flex items-center justify-between rounded-lg px-3 py-2.5 transition-all ${
              status === "taken" ? "bg-accent/50" : status === "skipped" ? "bg-secondary/50 opacity-60" : "bg-secondary/30"
            }`}
          >
            <div className="min-w-0">
              <p className={`text-sm font-medium ${status === "taken" ? "text-primary line-through" : "text-foreground"}`}>
                {med.name}
              </p>
              <p className="text-[10px] text-muted-foreground">{med.dosage}</p>
            </div>
            {!status ? (
              <div className="flex gap-1.5">
                <button onClick={() => handleLog(med.id, "taken")} className="rounded-full bg-primary p-1.5 text-primary-foreground shadow-soft transition-all active:scale-95">
                  <Check className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => handleLog(med.id, "skipped")} className="rounded-full bg-secondary p-1.5 text-muted-foreground transition-all active:scale-95">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <span className="text-[10px] font-medium text-muted-foreground capitalize">{status}</span>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default MedicationChecklist;
