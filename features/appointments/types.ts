export type Appointment = {
  id: string;
  user_id: string;
  title: string;
  appointment_date: string;
  appointment_time: string | null;
  provider: string | null;
  location: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type AppointmentInput = {
  title: string;
  appointment_date: string;
  appointment_time: string | null;
  provider: string | null;
  location: string | null;
  notes: string | null;
};
