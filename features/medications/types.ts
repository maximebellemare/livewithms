export type Medication = {
  id: string;
  user_id: string;
  name: string;
  dosage: string | null;
  frequency: string;
  notes: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type MedicationInput = {
  name: string;
  dosage: string | null;
  frequency: string;
  notes: string | null;
};
