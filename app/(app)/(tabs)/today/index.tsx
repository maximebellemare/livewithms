import { useEffect, useRef, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import DailyCheckInCard, {
  getEmptyCheckInDraft,
  normalizeCheckInInput,
  type DailyCheckInDraft,
} from "../../../../components/today/DailyCheckInCard";
import ErrorState from "../../../../components/ui/ErrorState";
import AppScreen from "../../../../components/ui/AppScreen";
import AppText from "../../../../components/ui/AppText";
import LoadingState from "../../../../components/ui/LoadingState";
import { useAuth } from "../../../../features/auth/hooks";
import { useSaveDailyCheckIn, useTodaysCheckIn } from "../../../../features/checkins/hooks";
import type { DailyCheckIn } from "../../../../features/checkins/types";
import { getErrorMessage } from "../../../../lib/errors";

function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getDraftFromCheckIn(checkIn: DailyCheckIn | null): DailyCheckInDraft {
  return {
    mood: checkIn?.mood ?? null,
    energy: checkIn?.energy ?? null,
    pain: checkIn?.pain ?? null,
    fatigue: checkIn?.fatigue ?? null,
    mobility: checkIn?.mobility ?? null,
    notes: checkIn?.notes ?? "",
  };
}

function getDraftSnapshot(draft: DailyCheckInDraft) {
  return JSON.stringify(normalizeCheckInInput(draft));
}

export default function TodayScreen() {
  const { user } = useAuth();
  const today = getTodayDateString();
  const checkInQuery = useTodaysCheckIn(user?.id, today);
  const saveCheckIn = useSaveDailyCheckIn();
  const [draft, setDraft] = useState<DailyCheckInDraft>(getEmptyCheckInDraft());
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const hydratedRef = useRef(false);
  const lastSavedSnapshotRef = useRef(getDraftSnapshot(getEmptyCheckInDraft()));

  useEffect(() => {
    if (!checkInQuery.isSuccess || hydratedRef.current) {
      return;
    }

    const nextDraft = getDraftFromCheckIn(checkInQuery.data);
    hydratedRef.current = true;
    lastSavedSnapshotRef.current = getDraftSnapshot(nextDraft);
    setDraft(nextDraft);
    setSaveState("idle");
  }, [checkInQuery.data, checkInQuery.isSuccess]);

  useEffect(() => {
    if (!hydratedRef.current || !user?.id) {
      return;
    }

    const nextSnapshot = getDraftSnapshot(draft);
    if (nextSnapshot === lastSavedSnapshotRef.current) {
      return;
    }

    setSaveState("saving");

    const timeoutId = setTimeout(() => {
      void saveCheckIn
        .mutateAsync({
          userId: user.id,
          date: today,
          input: normalizeCheckInInput(draft),
        })
        .then(() => {
          lastSavedSnapshotRef.current = nextSnapshot;
          setSaveState("saved");
        })
        .catch(() => {
          setSaveState("error");
        });
    }, 800);

    return () => clearTimeout(timeoutId);
  }, [draft, saveCheckIn, today, user?.id]);

  if (!user?.id) {
    return <ErrorState message="You need to be signed in to view today's check-in." />;
  }

  if (checkInQuery.isLoading) {
    return <LoadingState message="Loading today..." />;
  }

  if (checkInQuery.isError) {
    return (
      <ErrorState
        message={getErrorMessage(checkInQuery.error)}
        onRetry={() => void checkInQuery.refetch()}
      />
    );
  }

  return (
    <AppScreen title="Today" subtitle="Check in with how you're feeling.">
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <AppText style={styles.kicker}>Today&apos;s check-in</AppText>
          <AppText style={styles.date}>{today}</AppText>
        </View>
        <DailyCheckInCard draft={draft} onChange={setDraft} saveState={saveState} />
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 32,
    gap: 16,
  },
  header: {
    gap: 4,
  },
  kicker: {
    fontSize: 14,
    fontWeight: "600",
    color: "#e8751a",
  },
  date: {
    fontSize: 14,
    color: "#6b7280",
  },
});
