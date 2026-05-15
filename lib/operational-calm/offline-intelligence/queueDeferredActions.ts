import { getCachedJson, setCachedJson } from "../../local-cache";

export type DeferredAction<TPayload = Record<string, unknown>> = {
  id: string;
  type: string;
  payload: TPayload;
  queuedAt: string;
};

function getKey(scope: string) {
  return `operational-calm.deferred.${scope}`;
}

export async function queueDeferredActions<TPayload>(
  scope: string,
  nextAction: DeferredAction<TPayload>,
) {
  const current = (await getCachedJson<DeferredAction<TPayload>[]>(getKey(scope))) ?? [];
  const next = current.filter((action) => action.id !== nextAction.id);
  next.push(nextAction);
  await setCachedJson(getKey(scope), next);
  return next;
}

export async function loadDeferredActions<TPayload>(scope: string) {
  return (await getCachedJson<DeferredAction<TPayload>[]>(getKey(scope))) ?? [];
}
