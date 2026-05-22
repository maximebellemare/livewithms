import { appSecureStore } from "../../lib/secure-store";
import type { ProgramAudioSessionProgress, ProgramProgressEntry, ProgramProgressSnapshot } from "./types";

const PROGRAM_PROGRESS_KEY = "livewithms.programs.progress";
const MAX_RECENT_PROGRAMS = 4;
let cachedProgramProgress: ProgramProgressSnapshot | null = null;
let cachedProgramProgressSerialized: string | null = null;

const EMPTY_PROGRESS: ProgramProgressSnapshot = {
  completedToolIds: [],
  recentToolIds: [],
  lastOpenedToolId: null,
  activeToolId: null,
  audioSession: null,
  toolProgress: {},
  updatedAt: null,
};

function sanitizeProgressEntry(input: Partial<ProgramProgressEntry> | undefined, toolId: string): ProgramProgressEntry {
  return {
    toolId,
    openedAt: typeof input?.openedAt === "string" ? input.openedAt : null,
    startedAt: typeof input?.startedAt === "string" ? input.startedAt : null,
    completedAt: typeof input?.completedAt === "string" ? input.completedAt : null,
    completionCount: typeof input?.completionCount === "number" ? input.completionCount : 0,
  };
}

function sanitizeAudioSession(input: Partial<ProgramAudioSessionProgress> | null | undefined): ProgramAudioSessionProgress | null {
  if (!input || typeof input !== "object") {
    return null;
  }

  if (typeof input.sessionId !== "string" || typeof input.toolId !== "string") {
    return null;
  }

  return {
    sessionId: input.sessionId,
    toolId: input.toolId,
    phaseIndex: typeof input.phaseIndex === "number" ? Math.max(0, input.phaseIndex) : 0,
    phaseSecondsRemaining:
      typeof input.phaseSecondsRemaining === "number" ? Math.max(0, input.phaseSecondsRemaining) : 0,
    totalSecondsRemaining:
      typeof input.totalSecondsRemaining === "number" ? Math.max(0, input.totalSecondsRemaining) : 0,
    isPlaying: Boolean(input.isPlaying),
    hapticsEnabled: input.hapticsEnabled !== false,
    updatedAt: typeof input.updatedAt === "string" ? input.updatedAt : new Date().toISOString(),
  };
}

function sanitizeSnapshot(input: Partial<ProgramProgressSnapshot> | null | undefined): ProgramProgressSnapshot {
  return {
    completedToolIds: Array.isArray(input?.completedToolIds) ? input.completedToolIds.slice(0, 24) : [],
    recentToolIds: Array.isArray(input?.recentToolIds) ? input.recentToolIds.slice(0, MAX_RECENT_PROGRAMS) : [],
    lastOpenedToolId: typeof input?.lastOpenedToolId === "string" ? input.lastOpenedToolId : null,
    activeToolId: typeof input?.activeToolId === "string" ? input.activeToolId : null,
    audioSession: sanitizeAudioSession(input?.audioSession),
    toolProgress:
      input?.toolProgress && typeof input.toolProgress === "object"
        ? Object.fromEntries(
            Object.entries(input.toolProgress)
              .slice(0, 40)
              .map(([toolId, value]) => [toolId, sanitizeProgressEntry(value as Partial<ProgramProgressEntry>, toolId)]),
          )
        : {},
    updatedAt: typeof input?.updatedAt === "string" ? input.updatedAt : null,
  };
}

export async function loadProgramProgress() {
  if (cachedProgramProgress) {
    return cachedProgramProgress;
  }

  try {
    const raw = await appSecureStore.getItem(PROGRAM_PROGRESS_KEY);
    if (!raw) {
      cachedProgramProgress = EMPTY_PROGRESS;
      cachedProgramProgressSerialized = JSON.stringify(EMPTY_PROGRESS);
      return EMPTY_PROGRESS;
    }

    const nextValue = sanitizeSnapshot(JSON.parse(raw) as Partial<ProgramProgressSnapshot>);
    cachedProgramProgress = nextValue;
    cachedProgramProgressSerialized = JSON.stringify(nextValue);
    return nextValue;
  } catch {
    return EMPTY_PROGRESS;
  }
}

export async function saveProgramProgress(snapshot: ProgramProgressSnapshot) {
  try {
    const sanitized = sanitizeSnapshot(snapshot);
    const serialized = JSON.stringify(sanitized);
    cachedProgramProgress = sanitized;

    if (cachedProgramProgressSerialized === serialized) {
      return;
    }

    cachedProgramProgressSerialized = serialized;
    await appSecureStore.setItem(PROGRAM_PROGRESS_KEY, serialized);
  } catch {
    // Program progress should stay non-blocking.
  }
}
