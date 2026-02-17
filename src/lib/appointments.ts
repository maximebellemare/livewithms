export const APPOINTMENT_TYPES = [
  { value: "neurologist", label: "Neurologist", emoji: "🧠" },
  { value: "mri", label: "MRI", emoji: "🔬" },
  { value: "labs", label: "Labs", emoji: "🩸" },
  { value: "therapy", label: "Therapy", emoji: "💬" },
  { value: "custom", label: "Other", emoji: "📋" },
] as const;

export type AppointmentType = (typeof APPOINTMENT_TYPES)[number]["value"];

export interface Appointment {
  id: string;
  title: string;
  type: AppointmentType;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  location?: string;
  notes?: string;
  createdAt: string;
}

const APPTS_KEY = "ms-appointments";

const generateId = () => Math.random().toString(36).slice(2, 10);

export const getAppointments = (): Appointment[] => {
  return JSON.parse(localStorage.getItem(APPTS_KEY) || "[]");
};

export const saveAppointment = (appt: Omit<Appointment, "id" | "createdAt"> & { id?: string; createdAt?: string }): Appointment => {
  const appointments = getAppointments();
  const saved: Appointment = {
    ...appt,
    id: appt.id || generateId(),
    createdAt: appt.createdAt || new Date().toISOString(),
  };
  const idx = appointments.findIndex((a) => a.id === saved.id);
  if (idx >= 0) appointments[idx] = saved;
  else appointments.push(saved);
  localStorage.setItem(APPTS_KEY, JSON.stringify(appointments));
  return saved;
};

export const deleteAppointment = (id: string) => {
  const appointments = getAppointments().filter((a) => a.id !== id);
  localStorage.setItem(APPTS_KEY, JSON.stringify(appointments));
};

export const getUpcomingAppointments = (limit = 3): Appointment[] => {
  const today = new Date().toISOString().split("T")[0];
  return getAppointments()
    .filter((a) => a.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date) || (a.time || "").localeCompare(b.time || ""))
    .slice(0, limit);
};

export const getAppointmentTypeInfo = (type: AppointmentType) => {
  return APPOINTMENT_TYPES.find((t) => t.value === type) || APPOINTMENT_TYPES[4];
};
