import { useState, useEffect } from "react";
import { Check, X, Pill } from "lucide-react";
import {
  Medication,
  MedicationLog,
  getMedications,
  getMedicationLogs,
  logMedication,
  getTodayDateStr,
  isMedDueToday,
} from "@/lib/medications";

const generateId = () => Math.random().toString(36).slice(2, 10);

const MedicationChecklist = () => {
  const [meds, setMeds] = useState<Medication[]>([]);
  const [logs, setLogs] = useState<MedicationLog[]>([]);
  const today = getTodayDateStr();

  useEffect(() => {
    const allMeds = getMedications();
    setMeds(allMeds.filter((m) => isMedDueToday(m, today)));
    setLogs(getMedicationLogs().filter((l) => l.date === today));
  }, [today]);

  const getLogStatus = (medId: string, slot?: string) => {
    return logs.find((l) => l.medicationId === medId && l.timeSlot === (slot || undefined))?.status;
  };

  const handleLog = (med: Medication, status: "taken" | "skipped", slot?: string) => {
    const log: MedicationLog = {
      id: generateId(),
      medicationId: med.id,
      date: today,
      timeSlot: slot,
      status,
      loggedAt: new Date().toISOString(),
    };
    logMedication(log);
    setLogs((prev) => {
      const filtered = prev.filter(
        (l) => !(l.medicationId === med.id && l.timeSlot === (slot || undefined))
      );
      return [...filtered, log];
    });
  };

  if (meds.length === 0) return null;

  const allDone = meds.every((med) => {
    if (med.scheduleType === "daily" && med.timeSlots) {
      return med.timeSlots.every((slot) => getLogStatus(med.id, slot));
    }
    return getLogStatus(med.id);
  });

  return (
    <div className="rounded-xl bg-card p-4 shadow-soft space-y-3">
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
      {meds.map((med) => {
        const slots =
          med.scheduleType === "daily" && med.timeSlots && med.timeSlots.length > 1
            ? med.timeSlots
            : [undefined];

        return slots.map((slot, i) => {
          const status = getLogStatus(med.id, slot);
          return (
            <div
              key={`${med.id}-${i}`}
              className={`flex items-center justify-between rounded-lg px-3 py-2.5 transition-all ${
                status === "taken"
                  ? "bg-accent/50"
                  : status === "skipped"
                  ? "bg-secondary/50 opacity-60"
                  : "bg-secondary/30"
              }`}
            >
              <div className="min-w-0">
                <p className={`text-sm font-medium ${status === "taken" ? "text-primary line-through" : "text-foreground"}`}>
                  {med.name}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {med.dosage}
                  {slot && ` · ${slot}`}
                </p>
              </div>
              {!status ? (
                <div className="flex gap-1.5">
                  <button
                    onClick={() => handleLog(med, "taken", slot)}
                    className="rounded-full bg-primary p-1.5 text-primary-foreground shadow-soft transition-all active:scale-95"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleLog(med, "skipped", slot)}
                    className="rounded-full bg-secondary p-1.5 text-muted-foreground transition-all active:scale-95"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <span className="text-[10px] font-medium text-muted-foreground capitalize">{status}</span>
              )}
            </div>
          );
        });
      })}
    </div>
  );
};

export default MedicationChecklist;
