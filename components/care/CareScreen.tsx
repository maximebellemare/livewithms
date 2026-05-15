import { useMemo, useState } from "react";
import { router } from "expo-router";
import { Alert, Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import AppButton from "../ui/AppButton";
import AppScreen from "../ui/AppScreen";
import AppText from "../ui/AppText";
import ErrorState from "../ui/ErrorState";
import LoadingState from "../ui/LoadingState";
import {
  useAppointments,
  useCreateAppointment,
  useDeleteAppointment,
  useUpdateAppointment,
} from "../../features/appointments/hooks";
import type { Appointment, AppointmentInput } from "../../features/appointments/types";
import { useAuth } from "../../features/auth/hooks";
import {
  useCareNotes,
  useCreateCareNote,
  useDeleteCareNote,
  useUpdateCareNote,
} from "../../features/care-notes/hooks";
import type { CareNote, CareNoteInput } from "../../features/care-notes/types";
import { useCreateMedication, useMedications } from "../../features/medications/hooks";
import type { Medication, MedicationInput } from "../../features/medications/types";
import { getErrorMessage } from "../../lib/errors";
import { logger } from "../../lib/logger";
import { trackRetryTriggered } from "../../lib/events";
import { useSlowScreenDiagnostics } from "../../lib/observability";

const MEDICATION_FREQUENCY_OPTIONS = [
  "Once daily",
  "Twice daily",
  "Three times daily",
  "Every morning",
  "Every evening",
  "As needed",
  "Weekly",
  "Custom",
] as const;

function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function sortAppointmentsByDateTime(items: Appointment[], ascending: boolean) {
  return items.slice().sort((left, right) => {
    const dateCompare = left.appointment_date.localeCompare(right.appointment_date);

    if (dateCompare !== 0) {
      return ascending ? dateCompare : -dateCompare;
    }

    const leftTime = left.appointment_time ?? "";
    const rightTime = right.appointment_time ?? "";
    const timeCompare = leftTime.localeCompare(rightTime);

    return ascending ? timeCompare : -timeCompare;
  });
}

function formatAppointmentDate(date: string) {
  const parsed = new Date(`${date}T12:00:00`);

  return parsed.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function formatAppointmentDateLong(date: string) {
  const parsed = new Date(`${date}T12:00:00`);

  return parsed.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatAppointmentDateInput(date: string) {
  if (!date) {
    return "Choose a date";
  }

  const parsed = new Date(`${date}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return "Choose a date";
  }

  return parsed.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatAppointmentTimeInput(time: string) {
  if (!time) {
    return "Choose a time";
  }

  const [hourText = "0", minuteText = "0"] = time.split(":");
  const hour = Number(hourText);
  const minute = Number(minuteText);

  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    return time;
  }

  const parsed = new Date();
  parsed.setHours(hour, minute, 0, 0);

  return parsed.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function buildPickerDateFromAppointment(date: string, time: string) {
  const fallback = new Date();
  fallback.setSeconds(0, 0);

  if (!date) {
    return fallback;
  }

  const isoTime = time && time.includes(":") ? `${time}:00` : "12:00:00";
  const parsed = new Date(`${date}T${isoTime}`);

  return Number.isNaN(parsed.getTime()) ? fallback : parsed;
}

function formatTimeForStorage(date: Date) {
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `${hour}:${minute}`;
}

function getInitialFrequencyOption(frequency: string) {
  if (!frequency) {
    return "Once daily";
  }

  return MEDICATION_FREQUENCY_OPTIONS.includes(frequency as (typeof MEDICATION_FREQUENCY_OPTIONS)[number])
    ? (frequency as (typeof MEDICATION_FREQUENCY_OPTIONS)[number])
    : "Custom";
}

function formatShortDateFromIso(dateString: string) {
  return new Date(dateString).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function getNotePreview(note: string, maxLength = 110) {
  const trimmed = note.trim();

  if (trimmed.length <= maxLength) {
    return trimmed;
  }

  return `${trimmed.slice(0, maxLength).trimEnd()}…`;
}

export default function CareScreen() {
  const { user } = useAuth();
  const appointmentsQuery = useAppointments(user?.id);
  const medicationsQuery = useMedications(user?.id);
  const careNotesQuery = useCareNotes(user?.id);
  const createAppointment = useCreateAppointment();
  const updateAppointment = useUpdateAppointment();
  const deleteAppointment = useDeleteAppointment();
  const createMedication = useCreateMedication();
  const createCareNote = useCreateCareNote();
  const updateCareNote = useUpdateCareNote();
  const deleteCareNote = useDeleteCareNote();
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);
  const [showMedicationForm, setShowMedicationForm] = useState(false);
  const [editingAppointmentId, setEditingAppointmentId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [activePicker, setActivePicker] = useState<"date" | "time" | null>(null);
  const [appointmentPickerDate, setAppointmentPickerDate] = useState(() => buildPickerDateFromAppointment("", ""));
  const [pickerDraftDate, setPickerDraftDate] = useState(() => buildPickerDateFromAppointment("", ""));
  const [provider, setProvider] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [medicationName, setMedicationName] = useState("");
  const [medicationDosage, setMedicationDosage] = useState("");
  const [medicationFrequency, setMedicationFrequency] = useState("");
  const [selectedMedicationFrequencyOption, setSelectedMedicationFrequencyOption] = useState<(typeof MEDICATION_FREQUENCY_OPTIONS)[number]>("Once daily");
  const [medicationNotes, setMedicationNotes] = useState("");
  const [showCareNoteForm, setShowCareNoteForm] = useState(false);
  const [editingCareNoteId, setEditingCareNoteId] = useState<string | null>(null);
  const [careNoteTitle, setCareNoteTitle] = useState("");
  const [careNoteCategory, setCareNoteCategory] = useState("");
  const [careNoteBody, setCareNoteBody] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [medicationMessage, setMedicationMessage] = useState<string | null>(null);
  const [careNoteMessage, setCareNoteMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [medicationErrorMessage, setMedicationErrorMessage] = useState<string | null>(null);
  const [careNoteErrorMessage, setCareNoteErrorMessage] = useState<string | null>(null);
  const isInitialLoading =
    (appointmentsQuery.isLoading && !appointmentsQuery.data) ||
    (medicationsQuery.isLoading && !medicationsQuery.data) ||
    (careNotesQuery.isLoading && !careNotesQuery.data);
  useSlowScreenDiagnostics("care", isInitialLoading);
  const [showInactiveMedications, setShowInactiveMedications] = useState(false);

  const upcomingAppointments = useMemo(() => {
    const today = getTodayDateString();
    const items = (appointmentsQuery.data ?? []).filter((item) => item.appointment_date >= today);
    return sortAppointmentsByDateTime(items, true);
  }, [appointmentsQuery.data]);

  const pastAppointments = useMemo(() => {
    const today = getTodayDateString();
    const items = (appointmentsQuery.data ?? []).filter((item) => item.appointment_date < today);
    return sortAppointmentsByDateTime(items, false);
  }, [appointmentsQuery.data]);

  const medications = medicationsQuery.data ?? [];
  const activeMedications = useMemo(
    () => medications.filter((medication) => medication.active),
    [medications],
  );
  const inactiveMedications = useMemo(
    () => medications.filter((medication) => !medication.active),
    [medications],
  );
  const recentCareNote = careNotesQuery.data?.[0] ?? null;
  const nextAppointment = upcomingAppointments[0] ?? null;

  const resetAppointmentForm = () => {
    setTitle("");
    setDate("");
    setTime("");
    setActivePicker(null);
    setAppointmentPickerDate(buildPickerDateFromAppointment("", ""));
    setPickerDraftDate(buildPickerDateFromAppointment("", ""));
    setProvider("");
    setLocation("");
    setNotes("");
    setEditingAppointmentId(null);
  };

  const resetMedicationForm = () => {
    setMedicationName("");
    setMedicationDosage("");
    setMedicationFrequency("");
    setSelectedMedicationFrequencyOption("Once daily");
    setMedicationNotes("");
  };

  const handleDateChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    if (!selectedDate) {
      return;
    }

    setPickerDraftDate(selectedDate);
  };

  const handleTimeChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    if (!selectedDate) {
      return;
    }

    setPickerDraftDate(selectedDate);
  };

  const openAppointmentPicker = (mode: "date" | "time") => {
    const nextDate = buildPickerDateFromAppointment(date, time);
    setAppointmentPickerDate(nextDate);
    setPickerDraftDate(nextDate);
    logger.info("Appointment picker opened", {
      mode,
      date,
      time,
    });
    setActivePicker(mode);
  };

  const closeAppointmentPicker = () => {
    logger.info("Appointment picker closed", {
      mode: activePicker,
    });
    setActivePicker(null);
  };

  const confirmAppointmentPicker = () => {
    const nextDate = pickerDraftDate;
    setAppointmentPickerDate(nextDate);

    if (activePicker === "date") {
      setDate(nextDate.toISOString().slice(0, 10));
    }

    if (activePicker === "time") {
      setTime(formatTimeForStorage(nextDate));
    }

    logger.info("Appointment picker confirmed", {
      mode: activePicker,
      nextDate: nextDate.toISOString(),
      storedDate: activePicker === "date" ? nextDate.toISOString().slice(0, 10) : date,
      storedTime: activePicker === "time" ? formatTimeForStorage(nextDate) : time,
    });
    setActivePicker(null);
  };

  const resetCareNoteForm = () => {
    setCareNoteTitle("");
    setCareNoteCategory("");
    setCareNoteBody("");
    setEditingCareNoteId(null);
  };

  const handleAppointmentSubmit = async () => {
    if (!user?.id || createAppointment.isPending || updateAppointment.isPending) {
      return;
    }

    setErrorMessage(null);
    setMessage(null);

    const input: AppointmentInput = {
      title,
      appointment_date: date,
      appointment_time: time || null,
      provider: provider || null,
      location: location || null,
      notes: notes || null,
    };

    try {
      if (editingAppointmentId) {
        await updateAppointment.mutateAsync({
          userId: user.id,
          appointmentId: editingAppointmentId,
          input,
        });
        setMessage("Appointment updated.");
      } else {
        await createAppointment.mutateAsync({
          userId: user.id,
          input,
        });
        setMessage("Appointment added.");
      }

      resetAppointmentForm();
      setShowAppointmentForm(false);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    }
  };

  const startEditingAppointment = (appointment: Appointment) => {
    setTitle(appointment.title);
    setDate(appointment.appointment_date);
    setTime(appointment.appointment_time ?? "");
    const pickerDate = buildPickerDateFromAppointment(
      appointment.appointment_date,
      appointment.appointment_time ?? "",
    );
    setActivePicker(null);
    setAppointmentPickerDate(pickerDate);
    setPickerDraftDate(pickerDate);
    setProvider(appointment.provider ?? "");
    setLocation(appointment.location ?? "");
    setNotes(appointment.notes ?? "");
    setEditingAppointmentId(appointment.id);
    setShowAppointmentForm(true);
    setErrorMessage(null);
    setMessage(null);
  };

  const confirmDeleteAppointment = (appointment: Appointment) => {
    Alert.alert(
      "Delete appointment",
      `Remove "${appointment.title}" from your care list?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            void handleDeleteAppointment(appointment.id);
          },
        },
      ],
    );
  };

  const handleDeleteAppointment = async (appointmentId: string) => {
    if (!user?.id || deleteAppointment.isPending) {
      return;
    }

    setErrorMessage(null);
    setMessage(null);

    try {
      await deleteAppointment.mutateAsync({
        userId: user.id,
        appointmentId,
      });

      if (editingAppointmentId === appointmentId) {
        resetAppointmentForm();
        setShowAppointmentForm(false);
      }

      setMessage("Appointment deleted.");
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    }
  };

  const handleMedicationSubmit = async () => {
    if (!user?.id || createMedication.isPending) {
      return;
    }

    setMedicationErrorMessage(null);
    setMedicationMessage(null);

    const effectiveFrequency =
      selectedMedicationFrequencyOption === "Custom"
        ? medicationFrequency
        : selectedMedicationFrequencyOption;

    const input: MedicationInput = {
      name: medicationName,
      dosage: medicationDosage || null,
      frequency: effectiveFrequency,
      notes: medicationNotes || null,
    };

    try {
      await createMedication.mutateAsync({
        userId: user.id,
        input,
      });
      resetMedicationForm();
      setShowMedicationForm(false);
      setMedicationMessage("Medication added.");
    } catch (error) {
      setMedicationErrorMessage(getErrorMessage(error));
    }
  };

  const handleMedicationFrequencyOptionPress = (
    option: (typeof MEDICATION_FREQUENCY_OPTIONS)[number],
  ) => {
    setSelectedMedicationFrequencyOption(option);
    if (option !== "Custom") {
      setMedicationFrequency(option);
    } else {
      setMedicationFrequency("");
    }
  };

  const handleCareNoteSave = async () => {
    if (!user?.id || createCareNote.isPending || updateCareNote.isPending) {
      return;
    }

    setCareNoteErrorMessage(null);
    setCareNoteMessage(null);

    const input: CareNoteInput = {
      title: careNoteTitle || null,
      category: careNoteCategory || null,
      body: careNoteBody,
    };

    try {
      if (editingCareNoteId) {
        await updateCareNote.mutateAsync({
          userId: user.id,
          noteId: editingCareNoteId,
          input,
        });
        setCareNoteMessage("Care note updated.");
      } else {
        await createCareNote.mutateAsync({
          userId: user.id,
          input,
        });
        setCareNoteMessage("Care note saved.");
      }

      resetCareNoteForm();
      setShowCareNoteForm(false);
    } catch (error) {
      setCareNoteErrorMessage(getErrorMessage(error));
    }
  };

  const startEditingCareNote = (note: CareNote) => {
    setCareNoteTitle(note.title ?? "");
    setCareNoteCategory(note.category ?? "");
    setCareNoteBody(note.body);
    setEditingCareNoteId(note.id);
    setShowCareNoteForm(true);
    setCareNoteErrorMessage(null);
    setCareNoteMessage(null);
  };

  const handleDeleteCareNote = async (noteId: string) => {
    if (!user?.id || deleteCareNote.isPending) {
      return;
    }

    setCareNoteErrorMessage(null);
    setCareNoteMessage(null);

    try {
      await deleteCareNote.mutateAsync({
        userId: user.id,
        noteId,
      });

      if (editingCareNoteId === noteId) {
        resetCareNoteForm();
        setShowCareNoteForm(false);
      }

      setCareNoteMessage("Care note deleted.");
    } catch (error) {
      setCareNoteErrorMessage(getErrorMessage(error));
    }
  };

  const confirmDeleteCareNote = (note: CareNote) => {
    Alert.alert(
      "Delete care note",
      `Remove "${note.title || "this note"}"?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            void handleDeleteCareNote(note.id);
          },
        },
      ],
    );
  };

  if (!user?.id) {
    return <ErrorState message="You need to be signed in to view Care." />;
  }

  if (isInitialLoading) {
    return <LoadingState message="Loading Care..." />;
  }

  if (appointmentsQuery.isError) {
    return (
      <ErrorState
        message={getErrorMessage(appointmentsQuery.error)}
        onRetry={() => {
          void trackRetryTriggered("care-appointments-query");
          void appointmentsQuery.refetch();
        }}
      />
    );
  }

  if (medicationsQuery.isError) {
    return (
      <ErrorState
        message={getErrorMessage(medicationsQuery.error)}
        onRetry={() => {
          void trackRetryTriggered("care-medications-query");
          void medicationsQuery.refetch();
        }}
      />
    );
  }

  if (careNotesQuery.isError) {
    return (
      <ErrorState
        message={getErrorMessage(careNotesQuery.error)}
        onRetry={() => {
          void trackRetryTriggered("care-notes-query");
          void careNotesQuery.refetch();
        }}
      />
    );
  }

  return (
    <AppScreen
      title="Care organizer"
      subtitle="Keep appointments, medications, and notes in one place."
    >
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <AppText style={styles.heroTitle}>Your care tools in one place</AppText>
          <AppText style={styles.body}>
            Keep the essentials close by so appointments, medications, and important reminders feel easier to manage.
          </AppText>
        </View>

        <View style={styles.summaryGrid}>
          <View style={styles.summaryCard}>
            <AppText style={styles.summaryLabel}>Next appointment</AppText>
            {nextAppointment ? (
              <>
                <AppText style={styles.summaryTitle}>{nextAppointment.title}</AppText>
                <AppText style={styles.summaryBody}>
                  {formatAppointmentDateLong(nextAppointment.appointment_date)}
                  {nextAppointment.appointment_time ? ` · ${nextAppointment.appointment_time}` : ""}
                </AppText>
                {nextAppointment.provider ? (
                  <AppText style={styles.summaryBody}>{nextAppointment.provider}</AppText>
                ) : (
                  <AppText style={styles.summaryHint}>Nothing scheduled yet? Add your next visit.</AppText>
                )}
              </>
            ) : (
              <>
                <AppText style={styles.summaryEmptyTitle}>No upcoming appointments yet.</AppText>
                <AppText style={styles.summaryHint}>Add one so it’s easier to stay organized.</AppText>
              </>
            )}
          </View>

          <View style={styles.summaryCard}>
            <AppText style={styles.summaryLabel}>Active medications</AppText>
            <AppText style={styles.summaryCount}>{activeMedications.length}</AppText>
            <AppText style={styles.summaryBody}>
              {activeMedications.length === 0
                ? "No medications added yet."
                : activeMedications.length === 1
                  ? activeMedications[0]?.name ?? "1 medication"
                  : `${activeMedications.length} medications currently listed`}
            </AppText>
          </View>

          <View style={styles.summaryCard}>
            <AppText style={styles.summaryLabel}>Recent care note</AppText>
            {recentCareNote ? (
              <>
                <AppText style={styles.summaryTitle}>{recentCareNote.title || "Care note"}</AppText>
                <AppText style={styles.summaryBody}>{getNotePreview(recentCareNote.body, 90)}</AppText>
                <AppText style={styles.summaryHint}>
                  Updated {formatShortDateFromIso(recentCareNote.updated_at)}
                </AppText>
              </>
            ) : (
              <>
                <AppText style={styles.summaryEmptyTitle}>No care notes yet.</AppText>
                <AppText style={styles.summaryHint}>Keep questions and reminders here when you need them.</AppText>
              </>
            )}
          </View>
        </View>

        <View style={styles.quickLinksCard}>
          <AppText style={styles.sectionTitle}>Quick links</AppText>
          <View style={styles.navButtons}>
            <AppButton label="Go to Today" onPress={() => router.push("/today")} variant="secondary" />
            <AppButton label="Go to Profile" onPress={() => router.push("/profile")} variant="secondary" />
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.formHeader}>
            <View style={styles.formHeaderCopy}>
              <AppText style={styles.title}>Appointments</AppText>
              <AppText style={styles.body}>Keep upcoming visits easy to find, with quick notes attached.</AppText>
            </View>
            <AppButton
              label={showAppointmentForm ? "Hide form" : "Add Appointment"}
              onPress={() => setShowAppointmentForm((current) => !current)}
              variant="secondary"
            />
          </View>

          {showAppointmentForm ? (
            <View style={styles.formCard}>
              <View style={styles.fieldGroup}>
                <AppText style={styles.fieldLabel}>Title</AppText>
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Neurology follow-up"
                  placeholderTextColor="#9ca3af"
                  style={styles.input}
                />
              </View>
              <View style={styles.fieldGroup}>
                <AppText style={styles.fieldLabel}>Date</AppText>
                <Pressable
                  onPress={() => openAppointmentPicker("date")}
                  style={({ pressed }) => [
                    styles.selectionField,
                    pressed && styles.selectionFieldPressed,
                  ]}
                >
                  <AppText style={date ? styles.selectionValue : styles.selectionPlaceholder}>
                    {formatAppointmentDateInput(date)}
                  </AppText>
                </Pressable>
              </View>
              <View style={styles.fieldGroup}>
                <AppText style={styles.fieldLabel}>Time</AppText>
                <Pressable
                  onPress={() => openAppointmentPicker("time")}
                  style={({ pressed }) => [
                    styles.selectionField,
                    pressed && styles.selectionFieldPressed,
                  ]}
                >
                  <AppText style={time ? styles.selectionValue : styles.selectionPlaceholder}>
                    {formatAppointmentTimeInput(time)}
                  </AppText>
                </Pressable>
              </View>
              <View style={styles.fieldGroup}>
                <AppText style={styles.fieldLabel}>Provider</AppText>
                <TextInput
                  value={provider}
                  onChangeText={setProvider}
                  placeholder="Neurologist"
                  placeholderTextColor="#9ca3af"
                  style={styles.input}
                />
              </View>
              <View style={styles.fieldGroup}>
                <AppText style={styles.fieldLabel}>Location</AppText>
                <TextInput
                  value={location}
                  onChangeText={setLocation}
                  placeholder="Clinic or hospital"
                  placeholderTextColor="#9ca3af"
                  style={styles.input}
                />
              </View>
              <View style={styles.fieldGroup}>
                <AppText style={styles.fieldLabel}>Notes</AppText>
                <TextInput
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Questions to ask or details to remember"
                  placeholderTextColor="#9ca3af"
                  multiline
                  textAlignVertical="top"
                  style={styles.notesInput}
                />
              </View>
              <AppButton
                label={
                  createAppointment.isPending || updateAppointment.isPending
                    ? "Saving..."
                    : editingAppointmentId
                      ? "Save changes"
                      : "Save appointment"
                }
                onPress={() => void handleAppointmentSubmit()}
                disabled={createAppointment.isPending || updateAppointment.isPending}
              />
              {errorMessage ? <AppText style={styles.errorText}>{errorMessage}</AppText> : null}
            </View>
          ) : null}

          {message ? <AppText style={styles.successText}>{message}</AppText> : null}

          <AppText style={styles.sectionLabel}>Upcoming appointments</AppText>
          {upcomingAppointments.length === 0 ? (
            <View style={styles.emptyState}>
              <AppText style={styles.body}>No upcoming appointments yet.</AppText>
              <AppText style={styles.emptyHint}>Add one so it’s easier to stay organized.</AppText>
            </View>
          ) : (
            <View style={styles.list}>
              {upcomingAppointments.map((appointment) => (
                <View key={appointment.id} style={styles.itemCard}>
                  <View style={styles.itemHeader}>
                    <View style={styles.datePill}>
                      <AppText style={styles.datePillText}>
                        {formatAppointmentDate(appointment.appointment_date)}
                      </AppText>
                    </View>
                    <View style={styles.itemHeaderCopy}>
                      <AppText style={styles.itemTitle}>{appointment.title}</AppText>
                      <AppText style={styles.itemMeta}>
                        {formatAppointmentDateLong(appointment.appointment_date)}
                        {appointment.appointment_time ? ` · ${appointment.appointment_time}` : ""}
                      </AppText>
                    </View>
                  </View>
                  {appointment.provider ? (
                    <AppText style={styles.detailText}>Provider: {appointment.provider}</AppText>
                  ) : null}
                  {appointment.location ? (
                    <AppText style={styles.detailText}>Location: {appointment.location}</AppText>
                  ) : null}
                  {appointment.notes ? <AppText style={styles.itemNotes}>{appointment.notes}</AppText> : null}
                  <View style={styles.itemActions}>
                    <AppButton label="Edit" onPress={() => startEditingAppointment(appointment)} variant="secondary" />
                    <AppButton
                      label={deleteAppointment.isPending ? "Deleting..." : "Delete"}
                      onPress={() => confirmDeleteAppointment(appointment)}
                      variant="secondary"
                      disabled={deleteAppointment.isPending}
                    />
                  </View>
                </View>
              ))}
            </View>
          )}

          <AppText style={styles.sectionLabel}>Past appointments</AppText>
          {pastAppointments.length === 0 ? (
            <View style={styles.emptyState}>
              <AppText style={styles.body}>No past appointments yet.</AppText>
              <AppText style={styles.emptyHint}>Completed visits will settle here over time.</AppText>
            </View>
          ) : (
            <View style={styles.list}>
              {pastAppointments.map((appointment) => (
                <View key={appointment.id} style={styles.itemCard}>
                  <View style={styles.itemHeader}>
                    <View style={styles.datePill}>
                      <AppText style={styles.datePillText}>
                        {formatAppointmentDate(appointment.appointment_date)}
                      </AppText>
                    </View>
                    <View style={styles.itemHeaderCopy}>
                      <AppText style={styles.itemTitle}>{appointment.title}</AppText>
                      <AppText style={styles.itemMeta}>
                        {formatAppointmentDateLong(appointment.appointment_date)}
                        {appointment.appointment_time ? ` · ${appointment.appointment_time}` : ""}
                      </AppText>
                    </View>
                  </View>
                  {appointment.provider ? (
                    <AppText style={styles.detailText}>Provider: {appointment.provider}</AppText>
                  ) : null}
                  {appointment.location ? (
                    <AppText style={styles.detailText}>Location: {appointment.location}</AppText>
                  ) : null}
                  {appointment.notes ? <AppText style={styles.itemNotes}>{appointment.notes}</AppText> : null}
                  <View style={styles.itemActions}>
                    <AppButton label="Edit" onPress={() => startEditingAppointment(appointment)} variant="secondary" />
                    <AppButton
                      label={deleteAppointment.isPending ? "Deleting..." : "Delete"}
                      onPress={() => confirmDeleteAppointment(appointment)}
                      variant="secondary"
                      disabled={deleteAppointment.isPending}
                    />
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.card}>
          <View style={styles.formHeader}>
            <View style={styles.formHeaderCopy}>
              <AppText style={styles.title}>Medications</AppText>
              <AppText style={styles.body}>Keep current medications together with the basics you want to remember.</AppText>
            </View>
            <AppButton
              label={showMedicationForm ? "Hide form" : "Add Medication"}
              onPress={() => setShowMedicationForm((current) => !current)}
              variant="secondary"
            />
          </View>

          {showMedicationForm ? (
            <View style={styles.formCard}>
              <View style={styles.fieldGroup}>
                <AppText style={styles.fieldLabel}>Name</AppText>
                <TextInput
                  value={medicationName}
                  onChangeText={setMedicationName}
                  placeholder="Vitamin D"
                  placeholderTextColor="#9ca3af"
                  style={styles.input}
                />
              </View>
              <View style={styles.fieldGroup}>
                <AppText style={styles.fieldLabel}>Dosage</AppText>
                <TextInput
                  value={medicationDosage}
                  onChangeText={setMedicationDosage}
                  placeholder="1000 IU"
                  placeholderTextColor="#9ca3af"
                  style={styles.input}
                />
              </View>
              <View style={styles.fieldGroup}>
                <AppText style={styles.fieldLabel}>Frequency</AppText>
                <View style={styles.frequencyOptions}>
                  {MEDICATION_FREQUENCY_OPTIONS.map((option) => {
                    const isSelected = selectedMedicationFrequencyOption === option;

                    return (
                      <Pressable
                        key={option}
                        onPress={() => handleMedicationFrequencyOptionPress(option)}
                        style={({ pressed }) => [
                          styles.frequencyChip,
                          isSelected && styles.frequencyChipSelected,
                          pressed && styles.frequencyChipPressed,
                        ]}
                      >
                        <AppText
                          style={[
                            styles.frequencyChipText,
                            isSelected && styles.frequencyChipTextSelected,
                          ]}
                        >
                          {option}
                        </AppText>
                      </Pressable>
                    );
                  })}
                </View>
                {selectedMedicationFrequencyOption === "Custom" ? (
                  <TextInput
                    value={medicationFrequency}
                    onChangeText={setMedicationFrequency}
                    placeholder="Describe the schedule"
                    placeholderTextColor="#9ca3af"
                    style={styles.input}
                  />
                ) : null}
              </View>
              <View style={styles.fieldGroup}>
                <AppText style={styles.fieldLabel}>Notes</AppText>
                <TextInput
                  value={medicationNotes}
                  onChangeText={setMedicationNotes}
                  placeholder="Take with food"
                  placeholderTextColor="#9ca3af"
                  multiline
                  textAlignVertical="top"
                  style={styles.notesInput}
                />
              </View>
              <AppButton
                label={createMedication.isPending ? "Saving..." : "Save medication"}
                onPress={() => void handleMedicationSubmit()}
                disabled={createMedication.isPending}
              />
              {medicationErrorMessage ? <AppText style={styles.errorText}>{medicationErrorMessage}</AppText> : null}
            </View>
          ) : null}

          {medicationMessage ? <AppText style={styles.successText}>{medicationMessage}</AppText> : null}

          <AppText style={styles.sectionLabel}>Active medications</AppText>
          {activeMedications.length === 0 ? (
            <View style={styles.emptyState}>
              <AppText style={styles.body}>No medications added yet.</AppText>
              <AppText style={styles.emptyHint}>Keep dosage and frequency here for quick reference.</AppText>
            </View>
          ) : (
            <View style={styles.list}>
              {activeMedications.map((medication) => (
                <View key={medication.id} style={styles.itemCard}>
                  <View style={styles.medicationHeader}>
                    <AppText style={styles.itemTitle}>{medication.name}</AppText>
                    <AppText style={[styles.badge, styles.badgeActive]}>Active</AppText>
                  </View>
                  <AppText style={styles.itemMeta}>
                    {medication.dosage ? `${medication.dosage} · ` : ""}
                    {medication.frequency}
                  </AppText>
                  {medication.notes ? <AppText style={styles.itemNotes}>{medication.notes}</AppText> : null}
                </View>
              ))}
            </View>
          )}

          {inactiveMedications.length > 0 ? (
            <View style={styles.inactiveSection}>
              <Pressable
                onPress={() => setShowInactiveMedications((current) => !current)}
                style={({ pressed }) => [styles.collapseRow, pressed && styles.collapseRowPressed]}
              >
                <AppText style={styles.sectionLabel}>Inactive medications</AppText>
                <AppText style={styles.collapseLabel}>
                  {showInactiveMedications ? "Hide" : `Show ${inactiveMedications.length}`}
                </AppText>
              </Pressable>

              {showInactiveMedications ? (
                <View style={styles.list}>
                  {inactiveMedications.map((medication) => (
                    <View key={medication.id} style={styles.itemCard}>
                      <View style={styles.medicationHeader}>
                        <AppText style={styles.itemTitle}>{medication.name}</AppText>
                        <AppText style={[styles.badge, styles.badgeInactive]}>Inactive</AppText>
                      </View>
                      <AppText style={styles.itemMeta}>
                        {medication.dosage ? `${medication.dosage} · ` : ""}
                        {medication.frequency}
                      </AppText>
                      {medication.notes ? <AppText style={styles.itemNotes}>{medication.notes}</AppText> : null}
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
          ) : null}
        </View>

        <View style={styles.card}>
          <View style={styles.formHeader}>
            <View style={styles.formHeaderCopy}>
              <AppText style={styles.title}>Care notes</AppText>
              <AppText style={styles.body}>
                Save questions, reminders, or things to mention at your next appointment.
              </AppText>
            </View>
            <AppButton
              label={showCareNoteForm ? "Hide form" : "Add Note"}
              onPress={() => setShowCareNoteForm((current) => !current)}
              variant="secondary"
            />
          </View>

          {showCareNoteForm ? (
            <View style={styles.formCard}>
              <View style={styles.fieldGroup}>
                <AppText style={styles.fieldLabel}>Title</AppText>
                <TextInput
                  value={careNoteTitle}
                  onChangeText={setCareNoteTitle}
                  placeholder="Questions for my next visit"
                  placeholderTextColor="#9ca3af"
                  style={styles.input}
                />
              </View>
              <View style={styles.fieldGroup}>
                <AppText style={styles.fieldLabel}>Category</AppText>
                <TextInput
                  value={careNoteCategory}
                  onChangeText={setCareNoteCategory}
                  placeholder="Questions for doctor"
                  placeholderTextColor="#9ca3af"
                  style={styles.input}
                />
              </View>
              <AppText style={styles.helperText}>
                Try: Questions for doctor, Symptoms to mention, Medication notes, Personal note
              </AppText>
              <View style={styles.fieldGroup}>
                <AppText style={styles.fieldLabel}>Note</AppText>
                <TextInput
                  value={careNoteBody}
                  onChangeText={setCareNoteBody}
                  placeholder="Write anything you want to remember or bring up later"
                  placeholderTextColor="#9ca3af"
                  multiline
                  textAlignVertical="top"
                  style={styles.notesInput}
                />
              </View>
              <AppButton
                label={
                  createCareNote.isPending || updateCareNote.isPending
                    ? "Saving..."
                    : editingCareNoteId
                      ? "Save changes"
                      : "Save note"
                }
                onPress={() => void handleCareNoteSave()}
                disabled={createCareNote.isPending || updateCareNote.isPending}
              />
            </View>
          ) : null}

          {careNoteMessage ? <AppText style={styles.successText}>{careNoteMessage}</AppText> : null}
          {careNoteErrorMessage ? <AppText style={styles.errorText}>{careNoteErrorMessage}</AppText> : null}

          {(careNotesQuery.data ?? []).length === 0 ? (
            <View style={styles.emptyState}>
              <AppText style={styles.body}>No care notes yet.</AppText>
              <AppText style={styles.emptyHint}>
                Save questions, reminders, or things to mention at your next appointment.
              </AppText>
            </View>
          ) : (
            <View style={styles.list}>
              {careNotesQuery.data?.map((note) => (
                <View key={note.id} style={styles.itemCard}>
                  <View style={styles.noteHeader}>
                    <View style={styles.itemHeaderCopy}>
                      <AppText style={styles.itemTitle}>{note.title || "Untitled note"}</AppText>
                      {note.category ? <AppText style={styles.categoryChip}>{note.category}</AppText> : null}
                    </View>
                  </View>
                  <AppText style={styles.itemNotes}>{getNotePreview(note.body, 180)}</AppText>
                  <AppText style={styles.noteMeta}>
                    Updated {new Date(note.updated_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </AppText>
                  <View style={styles.itemActions}>
                    <AppButton label="Edit" onPress={() => startEditingCareNote(note)} variant="secondary" />
                    <AppButton
                      label={deleteCareNote.isPending ? "Deleting..." : "Delete"}
                      onPress={() => confirmDeleteCareNote(note)}
                      variant="secondary"
                      disabled={deleteCareNote.isPending}
                    />
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
      <Modal
        visible={activePicker !== null}
        transparent
        animationType="slide"
        presentationStyle="overFullScreen"
        statusBarTranslucent
        onRequestClose={closeAppointmentPicker}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Pressable onPress={closeAppointmentPicker} style={styles.modalAction}>
                <AppText style={styles.modalActionText}>Cancel</AppText>
              </Pressable>
              <AppText style={styles.modalTitle}>
                {activePicker === "date" ? "Choose a date" : "Choose a time"}
              </AppText>
              <Pressable onPress={confirmAppointmentPicker} style={styles.modalAction}>
                <AppText style={styles.modalActionText}>Done</AppText>
              </Pressable>
            </View>
            {activePicker ? (
              <DateTimePicker
                value={pickerDraftDate}
                mode={activePicker}
                display="spinner"
                onChange={activePicker === "date" ? handleDateChange : handleTimeChange}
                style={styles.modalPicker}
              />
            ) : null}
          </View>
        </View>
      </Modal>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 120,
    gap: 16,
  },
  heroCard: {
    backgroundColor: "#fff4ec",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#f2d8c4",
    padding: 18,
    gap: 10,
  },
  summaryGrid: {
    gap: 12,
  },
  summaryCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#f1e1d4",
    padding: 18,
    gap: 8,
  },
  quickLinksCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#f1e1d4",
    padding: 18,
    gap: 12,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#f1e1d4",
    padding: 18,
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1f2937",
  },
  heroTitle: {
    fontSize: 22,
    lineHeight: 30,
    fontWeight: "700",
    color: "#1f2937",
  },
  body: {
    color: "#4b5563",
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
  },
  summaryLabel: {
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    color: "#c25d10",
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
  },
  summaryCount: {
    fontSize: 30,
    fontWeight: "700",
    color: "#1f2937",
    lineHeight: 38,
  },
  summaryBody: {
    color: "#4b5563",
    lineHeight: 20,
  },
  summaryHint: {
    color: "#6b7280",
    lineHeight: 20,
  },
  summaryEmptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1f2937",
  },
  navButtons: {
    gap: 10,
  },
  formHeader: {
    gap: 12,
  },
  formHeaderCopy: {
    gap: 6,
  },
  formCard: {
    backgroundColor: "#fffaf6",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#f3dfd1",
    padding: 14,
    gap: 12,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 14,
    color: "#374151",
  },
  helperText: {
    marginTop: -4,
    fontSize: 13,
    lineHeight: 18,
    color: "#6b7280",
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5d6cb",
    backgroundColor: "#ffffff",
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: "#1f2937",
  },
  selectionField: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5d6cb",
    backgroundColor: "#ffffff",
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  selectionFieldPressed: {
    opacity: 0.88,
  },
  selectionValue: {
    fontSize: 16,
    color: "#1f2937",
  },
  selectionPlaceholder: {
    fontSize: 16,
    color: "#9ca3af",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(31, 41, 55, 0.22)",
    justifyContent: "flex-end",
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  modalCard: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: "#f1e1d4",
    paddingTop: 12,
    paddingBottom: 16,
    minHeight: 320,
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  modalTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "700",
    color: "#1f2937",
  },
  modalAction: {
    minWidth: 56,
    paddingVertical: 8,
  },
  modalActionText: {
    color: "#c25d10",
    fontSize: 15,
    fontWeight: "600",
  },
  modalPicker: {
    minHeight: 220,
    alignSelf: "stretch",
  },
  frequencyOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  frequencyChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#ead8ca",
    backgroundColor: "#ffffff",
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  frequencyChipSelected: {
    borderColor: "#e8751a",
    backgroundColor: "#fff4ec",
  },
  frequencyChipPressed: {
    opacity: 0.88,
  },
  frequencyChipText: {
    color: "#6b7280",
    fontSize: 13,
    fontWeight: "600",
  },
  frequencyChipTextSelected: {
    color: "#9a4a11",
  },
  notesInput: {
    minHeight: 96,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5d6cb",
    backgroundColor: "#ffffff",
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: "#1f2937",
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#c25d10",
  },
  errorText: {
    fontSize: 14,
    color: "#b91c1c",
  },
  successText: {
    fontSize: 14,
    color: "#166534",
  },
  emptyState: {
    gap: 4,
  },
  emptyHint: {
    color: "#6b7280",
    lineHeight: 20,
  },
  list: {
    gap: 10,
  },
  inactiveSection: {
    gap: 10,
  },
  collapseRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  collapseRowPressed: {
    opacity: 0.82,
  },
  collapseLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#c25d10",
  },
  itemCard: {
    backgroundColor: "#fffaf6",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#f3dfd1",
    padding: 14,
    gap: 6,
  },
  itemHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  noteHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  medicationHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  datePill: {
    backgroundColor: "#fff0e2",
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minWidth: 72,
    alignItems: "center",
  },
  datePillText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#c25d10",
  },
  itemHeaderCopy: {
    flex: 1,
    gap: 2,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1f2937",
  },
  itemMeta: {
    fontSize: 13,
    color: "#c25d10",
    fontWeight: "600",
  },
  categoryChip: {
    alignSelf: "flex-start",
    marginTop: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#fff0e2",
    fontSize: 12,
    color: "#c25d10",
    fontWeight: "600",
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    fontSize: 12,
    fontWeight: "700",
    overflow: "hidden",
  },
  badgeActive: {
    backgroundColor: "#e8f7ec",
    color: "#166534",
  },
  badgeInactive: {
    backgroundColor: "#f3f4f6",
    color: "#4b5563",
  },
  detailText: {
    color: "#4b5563",
    lineHeight: 20,
  },
  itemNotes: {
    color: "#4b5563",
    lineHeight: 20,
  },
  noteMeta: {
    fontSize: 12,
    color: "#6b7280",
  },
  itemActions: {
    flexDirection: "row",
    gap: 10,
  },
});
