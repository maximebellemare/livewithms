import { appSecureStore } from "../../lib/secure-store";

const APP_TOUR_SEEN_KEY = "livewithms.app-tour.seen";
const appTourReplayListeners = new Set<() => void>();

function getAppTourSeenKey(userId: string) {
  return `${APP_TOUR_SEEN_KEY}.${userId}`;
}

export async function loadHasSeenAppTour(userId: string) {
  const raw = await appSecureStore.getItem(getAppTourSeenKey(userId));
  return raw === "true";
}

export async function markAppTourSeen(userId: string) {
  await appSecureStore.setItem(getAppTourSeenKey(userId), "true");
}

export function requestAppTourReplay() {
  appTourReplayListeners.forEach((listener) => listener());
}

export function addAppTourReplayListener(listener: () => void) {
  appTourReplayListeners.add(listener);
  return () => {
    appTourReplayListeners.delete(listener);
  };
}
