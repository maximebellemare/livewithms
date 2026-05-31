import { useCallback, useEffect, useState } from "react";
import { appSecureStore } from "../../lib/secure-store";
import { fetchCommunityActivity } from "./api";
import type { CommunityActivitySummary, CommunityCategoryId } from "./types";

const COMMUNITY_ACTIVITY_SEEN_KEY = "livewithms.community.seen";
const COMMUNITY_RECENT_CATEGORIES_KEY = "livewithms.community.recent-categories";
const COMMUNITY_NOTIFIED_ACTIVITY_IDS_KEY = "livewithms.community.notified-activity";
const activityListeners = new Set<() => void>();

const EMPTY_ACTIVITY: CommunityActivitySummary = {
  unreadCount: 0,
  newReplies: [],
  recentActivity: [],
};

function getSeenKey(userId: string) {
  return `${COMMUNITY_ACTIVITY_SEEN_KEY}.${userId}`;
}

function getRecentCategoriesKey(userId: string) {
  return `${COMMUNITY_RECENT_CATEGORIES_KEY}.${userId}`;
}

function getNotifiedActivityIdsKey(userId: string) {
  return `${COMMUNITY_NOTIFIED_ACTIVITY_IDS_KEY}.${userId}`;
}

export function notifyCommunityActivityChanged() {
  activityListeners.forEach((listener) => listener());
}

async function loadCommunityLastSeen(userId: string) {
  const raw = await appSecureStore.getItem(getSeenKey(userId));
  return raw && raw.trim().length > 0 ? raw : null;
}

async function loadRecentCommunityCategories(userId: string) {
  try {
    const raw = await appSecureStore.getItem(getRecentCategoriesKey(userId));
    if (!raw) {
      return [] as CommunityCategoryId[];
    }
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed.filter((value): value is CommunityCategoryId => typeof value === "string") as CommunityCategoryId[]) : [];
  } catch {
    return [] as CommunityCategoryId[];
  }
}

export async function loadCommunityNotifiedActivityIds(userId: string) {
  try {
    const raw = await appSecureStore.getItem(getNotifiedActivityIdsKey(userId));
    if (!raw) {
      return [] as string[];
    }
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === "string") : [];
  } catch {
    return [] as string[];
  }
}

export async function saveCommunityNotifiedActivityIds(userId: string, ids: string[]) {
  await appSecureStore.setItem(getNotifiedActivityIdsKey(userId), JSON.stringify(ids.slice(0, 60)));
}

export async function markCommunityActivitySeen(userId: string) {
  await appSecureStore.setItem(getSeenKey(userId), new Date().toISOString());
  notifyCommunityActivityChanged();
}

export async function rememberCommunityCategory(userId: string, categoryId: CommunityCategoryId) {
  const current = await loadRecentCommunityCategories(userId);
  const next = [categoryId, ...current.filter((value) => value !== categoryId)].slice(0, 4);
  await appSecureStore.setItem(getRecentCategoriesKey(userId), JSON.stringify(next));
  notifyCommunityActivityChanged();
}

export function useCommunityActivity(userId?: string | null) {
  const [summary, setSummary] = useState<CommunityActivitySummary>(EMPTY_ACTIVITY);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!userId) {
      setSummary(EMPTY_ACTIVITY);
      return EMPTY_ACTIVITY;
    }

    setLoading(true);
    try {
      const [lastSeenAt, recentCategories] = await Promise.all([
        loadCommunityLastSeen(userId),
        loadRecentCommunityCategories(userId),
      ]);
      const nextSummary = await fetchCommunityActivity({
        userId,
        lastSeenAt,
        recentCategories,
      });
      setSummary(nextSummary);
      return nextSummary;
    } catch {
      setSummary(EMPTY_ACTIVITY);
      return EMPTY_ACTIVITY;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const listener = () => {
      void refresh();
    };
    activityListeners.add(listener);
    return () => {
      activityListeners.delete(listener);
    };
  }, [refresh]);

  const markSeen = useCallback(async () => {
    if (!userId) {
      return;
    }
    await markCommunityActivitySeen(userId);
    setSummary((current) => ({ ...current, unreadCount: 0 }));
  }, [userId]);

  return {
    summary,
    loading,
    refresh,
    markSeen,
  };
}
