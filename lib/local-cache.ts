import { appSecureStore } from "./secure-store";

const CHUNK_SIZE = 1800;
const MAX_CHUNKS = 12;

function getMetaKey(key: string) {
  return `${key}.meta`;
}

function getChunkKey(key: string, index: number) {
  return `${key}.chunk.${index}`;
}

export async function getCachedJson<T>(key: string): Promise<T | null> {
  try {
    const metaRaw = await appSecureStore.getItem(getMetaKey(key));

    if (!metaRaw) {
      const raw = await appSecureStore.getItem(key);
      return raw ? (JSON.parse(raw) as T) : null;
    }

    const meta = JSON.parse(metaRaw) as { chunks?: number };
    const chunkCount = typeof meta.chunks === "number" ? meta.chunks : 0;

    if (chunkCount <= 0) {
      return null;
    }

    const parts = await Promise.all(
      Array.from({ length: chunkCount }, (_, index) => appSecureStore.getItem(getChunkKey(key, index))),
    );

    if (parts.some((part) => !part)) {
      return null;
    }

    return JSON.parse(parts.join("")) as T;
  } catch {
    return null;
  }
}

export async function setCachedJson(key: string, value: unknown) {
  try {
    const serialized = JSON.stringify(value);
    const previousMetaRaw = await appSecureStore.getItem(getMetaKey(key));
    const previousMeta = previousMetaRaw ? (JSON.parse(previousMetaRaw) as { chunks?: number }) : null;
    const previousChunkCount = typeof previousMeta?.chunks === "number" ? previousMeta.chunks : 0;

    if (serialized.length <= CHUNK_SIZE) {
      await appSecureStore.setItem(key, serialized);
      await appSecureStore.deleteItem(getMetaKey(key));
      if (previousChunkCount > 0) {
        await Promise.all(
          Array.from({ length: previousChunkCount }, (_, index) => appSecureStore.deleteItem(getChunkKey(key, index))),
        );
      }
      return;
    }

    const chunks = serialized.match(new RegExp(`.{1,${CHUNK_SIZE}}`, "g")) ?? [];
    const safeChunks = chunks.slice(0, MAX_CHUNKS);

    await Promise.all(
      safeChunks.map((chunk, index) => appSecureStore.setItem(getChunkKey(key, index), chunk)),
    );

    await appSecureStore.setItem(
      getMetaKey(key),
      JSON.stringify({
        chunks: safeChunks.length,
      }),
    );
    await appSecureStore.deleteItem(key);
    if (previousChunkCount > safeChunks.length) {
      await Promise.all(
        Array.from({ length: previousChunkCount - safeChunks.length }, (_, index) =>
          appSecureStore.deleteItem(getChunkKey(key, safeChunks.length + index)),
        ),
      );
    }
  } catch {
    // Keep local cache failures silent so they never affect app usage.
  }
}

export async function clearCachedJson(key: string) {
  try {
    const metaRaw = await appSecureStore.getItem(getMetaKey(key));
    await appSecureStore.deleteItem(key);

    if (!metaRaw) {
      return;
    }

    const meta = JSON.parse(metaRaw) as { chunks?: number };
    const chunkCount = typeof meta.chunks === "number" ? meta.chunks : 0;

    await Promise.all(
      Array.from({ length: chunkCount }, (_, index) => appSecureStore.deleteItem(getChunkKey(key, index))),
    );
    await appSecureStore.deleteItem(getMetaKey(key));
  } catch {
    // Keep local cache failures silent so they never affect app usage.
  }
}
