import { useEffect, useState } from "react";
import { loadProgramProgress, saveProgramProgress } from "./storage";
import type { ProgramProgressEntry, ProgramProgressSnapshot } from "./types";

const EMPTY_PROGRESS: ProgramProgressSnapshot = {
  completedToolIds: [],
  recentToolIds: [],
  lastOpenedToolId: null,
  activeToolId: null,
  toolProgress: {},
  updatedAt: null,
};

function buildRecentToolIds(current: string[], nextToolId: string) {
  return [nextToolId, ...current.filter((toolId) => toolId !== nextToolId)].slice(0, 4);
}

export function useProgramProgress() {
  const [progress, setProgress] = useState<ProgramProgressSnapshot>(EMPTY_PROGRESS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const loaded = await loadProgramProgress();
      if (!cancelled) {
        setProgress(loaded);
        setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const persist = async (nextValue: ProgramProgressSnapshot) => {
    setProgress(nextValue);
    await saveProgramProgress(nextValue);
  };

  const getToolProgress = (toolId: string): ProgramProgressEntry => {
    return progress.toolProgress[toolId] ?? {
      toolId,
      openedAt: null,
      startedAt: null,
      completedAt: null,
      completionCount: 0,
    };
  };

  const markOpened = async (toolId: string) => {
    const currentToolProgress = getToolProgress(toolId);
    const nextValue: ProgramProgressSnapshot = {
      ...progress,
      lastOpenedToolId: toolId,
      recentToolIds: buildRecentToolIds(progress.recentToolIds, toolId),
      toolProgress: {
        ...progress.toolProgress,
        [toolId]: {
          ...currentToolProgress,
          openedAt: new Date().toISOString(),
        },
      },
      updatedAt: new Date().toISOString(),
    };

    await persist(nextValue);
  };

  const markStarted = async (toolId: string) => {
    const currentToolProgress = getToolProgress(toolId);
    const nextValue: ProgramProgressSnapshot = {
      ...progress,
      activeToolId: toolId,
      lastOpenedToolId: toolId,
      recentToolIds: buildRecentToolIds(progress.recentToolIds, toolId),
      toolProgress: {
        ...progress.toolProgress,
        [toolId]: {
          ...currentToolProgress,
          openedAt: currentToolProgress.openedAt ?? new Date().toISOString(),
          startedAt: new Date().toISOString(),
        },
      },
      updatedAt: new Date().toISOString(),
    };

    await persist(nextValue);
  };

  const markCompleted = async (toolId: string) => {
    const currentToolProgress = getToolProgress(toolId);
    const nextCompletedToolIds = progress.completedToolIds.includes(toolId)
      ? progress.completedToolIds
      : [...progress.completedToolIds, toolId];

    const nextValue: ProgramProgressSnapshot = {
      completedToolIds: nextCompletedToolIds,
      lastOpenedToolId: toolId,
      activeToolId: null,
      recentToolIds: buildRecentToolIds(progress.recentToolIds, toolId),
      toolProgress: {
        ...progress.toolProgress,
        [toolId]: {
          ...currentToolProgress,
          openedAt: currentToolProgress.openedAt ?? new Date().toISOString(),
          completedAt: new Date().toISOString(),
          completionCount: currentToolProgress.completionCount + 1,
        },
      },
      updatedAt: new Date().toISOString(),
    };

    await persist(nextValue);
  };

  const clearActiveTool = async () => {
    if (!progress.activeToolId) {
      return;
    }

    await persist({
      ...progress,
      activeToolId: null,
      updatedAt: new Date().toISOString(),
    });
  };

  return {
    progress,
    isLoading,
    getToolProgress,
    markOpened,
    markStarted,
    markCompleted,
    clearActiveTool,
  };
}
