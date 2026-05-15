import { clearCachedJson, getCachedJson, setCachedJson } from "../../local-cache";

type CheckInDraftSnapshot<T> = {
  draft: T;
  updatedAt: string;
};

function getKey(userId: string, date: string) {
  return `continuity.checkin-draft.${userId}.${date}`;
}

export async function preserveCheckinDraft<T>(userId: string, date: string, draft: T) {
  await setCachedJson(getKey(userId, date), {
    draft,
    updatedAt: new Date().toISOString(),
  } satisfies CheckInDraftSnapshot<T>);
}

export async function loadCheckinDraft<T>(userId: string, date: string) {
  return getCachedJson<CheckInDraftSnapshot<T>>(getKey(userId, date));
}

export async function clearCheckinDraft(userId: string, date: string) {
  await clearCachedJson(getKey(userId, date));
}
