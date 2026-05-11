import { useMemo, useState } from "react";
import { router } from "expo-router";
import { Alert, ScrollView, StyleSheet, TextInput, View } from "react-native";
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
import type { MedicationInput } from "../../features/medications/types";
import { getErrorMessage } from "../../lib/errors";

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
  const [provider, setProvider] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [medicationName, setMedicationName] = useState("");
  const [medicationDosage, setMedicationDosage] = useState("");
  const [medicationFrequency, setMedicationFrequency] = useState("");
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

  const resetAppointmentForm = () => {
    setTitle("");
    setDate("");
    setTime("");
    setProvider("");
    setLocation("");
    setNotes("");
    setEditingAppointmentId(null);
  };

  const resetMedicationForm = () => {
    setMedicationName("");
    setMedicationDosage("");
    setMedicationFrequency("");
    setMedicationNotes("");
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

    const input: MedicationInput = {
      name: medicationName,
      dosage: medicationDosage || null,
      frequency: medicationFrequency,
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

  if (appointmentsQuery.isLoading || medicationsQuery.isLoading || careNotesQuery.isLoading) {
    return <LoadingState message="Loading Care..." />;
  }

  if (appointmentsQuery.isError) {
    return (
      <ErrorState
        message={getErrorMessage(appointmentsQuery.error)}
        onRetry={() => void appointmentsQuery.refetch()}
      />
    );
  }

  if (medicationsQuery.isError) {
    return (
      <ErrorState
        message={getErrorMessage(medicationsQuery.error)}
        onRetry={() => void medicationsQuery.refetch()}
      />
    );
  }

  if (careNotesQuery.isError) {
    return (
      <ErrorState
        message={getErrorMessage(careNotesQuery.error)}
        onRetry={() => void careNotesQuery.refetch()}
      />
    );
  }

  return (
    <AppScreen
      title="Care"
      subtitle="Keep track of appointments, medications, and important health notes."
    >
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <AppText style={styles.heroTitle}>Your care tools in one place</AppText>
          <AppText style={styles.body}>
            Keep the essentials close by so appointments, medications, and important reminders feel easier to manage.
          </AppText>
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
                <TextInput
                  value={date}
                  onChangeText={setDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#9ca3af"
                  style={styles.input}
                />
              </View>
              <View style={styles.fieldGroup}>
                <AppText style={styles.fieldLabel}>Time</AppText>
                <TextInput
                  value={time}
                  onChangeText={setTime}
                  placeholder="2:30 PM"
                  placeholderTextColor="#9ca3af"
                  style={styles.input}
                />
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
              <AppText style={styles.emptyHint}>Add your next visit so everything is in one place.</AppText>
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
            <AppText style={styles.body}>No past appointments yet.</AppText>
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
                <TextInput
                  value={medicationFrequency}
                  onChangeText={setMedicationFrequency}
                  placeholder="Daily"
                  placeholderTextColor="#9ca3af"
                  style={styles.input}
                />
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

          {(medicationsQuery.data ?? []).length === 0 ? (
            <AppText style={styles.body}>No medications added yet.</AppText>
          ) : (
            <View style={styles.list}>
              {medicationsQuery.data?.map((medication) => (
                <View key={medication.id} style={styles.itemCard}>
                  <AppText style={styles.itemTitle}>{medication.name}</AppText>
                  <AppText style={styles.itemMeta}>
                    {medication.dosage ? `${medication.dosage} · ` : ""}
                    {medication.frequency}
                  </AppText>
                  {medication.notes ? <AppText style={styles.itemNotes}>{medication.notes}</AppText> : null}
                </View>
              ))}
            </View>
          )}
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
                  <AppText style={styles.itemNotes}>{note.body}</AppText>
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
