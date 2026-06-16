import type { MedicationDay, MedicationDoseTime, MedicationScheduleType } from "./schedule";

export type Medication = {
  id: string;
  user_id: string;
  name: string;
  dosage: string | null;
  frequency: string;
  schedule_type: MedicationScheduleType;
  dose_times: MedicationDoseTime[];
  selected_days: MedicationDay[];
  reminder_time?: string | null;
  notes: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type MedicationInput = {
  name: string;
  dosage: string | null;
  schedule_type: MedicationScheduleType;
  dose_times: MedicationDoseTime[];
  selected_days: MedicationDay[];
  notes: string | null;
  active?: boolean;
};
