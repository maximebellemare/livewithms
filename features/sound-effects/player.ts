import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from "expo-av";
import * as FileSystem from "expo-file-system";

type CueId =
  | "coach-send"
  | "coach-response"
  | "breathing-start"
  | "breathing-end"
  | "timer-start"
  | "timer-halfway"
  | "timer-near-end"
  | "timer-end";

type CueConfig = {
  frequencies: number[];
  durationMs: number;
  volume: number;
};

const BASE64_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
const SAMPLE_RATE = 22050;
const cueBase64Cache = new Map<string, string>();
const cueFileUriCache = new Map<string, string>();
let audioModeReady = false;
export type AmbientDebugState = {
  status: "idle" | "muted" | "loaded" | "playing" | "failed" | "stopped";
  detail?: string;
};

type AmbientDebugListener = (state: AmbientDebugState) => void;

const CUE_CONFIG: Record<CueId, CueConfig> = {
  "coach-send": { frequencies: [554.37, 659.25], durationMs: 130, volume: 0.05 },
  "coach-response": { frequencies: [440, 523.25], durationMs: 180, volume: 0.06 },
  "breathing-start": { frequencies: [659.25, 783.99], durationMs: 340, volume: 0.16 },
  "breathing-end": { frequencies: [659.25, 523.25], durationMs: 320, volume: 0.13 },
  "timer-start": { frequencies: [392, 523.25], durationMs: 210, volume: 0.065 },
  "timer-halfway": { frequencies: [392], durationMs: 120, volume: 0.045 },
  "timer-near-end": { frequencies: [523.25], durationMs: 120, volume: 0.05 },
  "timer-end": { frequencies: [392, 523.25, 659.25], durationMs: 260, volume: 0.072 },
};

export function getSoundCueDurationMs(cueId: CueId) {
  return CUE_CONFIG[cueId].durationMs;
}

function emitAmbientDebug(listener: AmbientDebugListener | undefined, state: AmbientDebugState) {
  listener?.(state);
}

function bytesToBase64(bytes: Uint8Array) {
  let output = "";

  for (let index = 0; index < bytes.length; index += 3) {
    const chunk = ((bytes[index] ?? 0) << 16) | ((bytes[index + 1] ?? 0) << 8) | (bytes[index + 2] ?? 0);
    output += BASE64_CHARS[(chunk >> 18) & 63];
    output += BASE64_CHARS[(chunk >> 12) & 63];
    output += index + 1 < bytes.length ? BASE64_CHARS[(chunk >> 6) & 63] : "=";
    output += index + 2 < bytes.length ? BASE64_CHARS[chunk & 63] : "=";
  }

  return output;
}

function writeAscii(view: DataView, offset: number, value: string) {
  for (let index = 0; index < value.length; index += 1) {
    view.setUint8(offset + index, value.charCodeAt(index));
  }
}

function getCueCacheKey(config: CueConfig & { loopSeconds?: number; fadeMs?: number }) {
  return JSON.stringify(config);
}

function hashString(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash.toString(16);
}

function buildWavBase64(config: CueConfig & { loopSeconds?: number; fadeMs?: number }) {
  const cacheKey = getCueCacheKey(config);
  const cached = cueBase64Cache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const durationSeconds = (config.loopSeconds ?? config.durationMs / 1000);
  const sampleCount = Math.max(1, Math.floor(SAMPLE_RATE * durationSeconds));
  const pcmByteLength = sampleCount * 2;
  const buffer = new ArrayBuffer(44 + pcmByteLength);
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);

  writeAscii(view, 0, "RIFF");
  view.setUint32(4, 36 + pcmByteLength, true);
  writeAscii(view, 8, "WAVE");
  writeAscii(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, SAMPLE_RATE, true);
  view.setUint32(28, SAMPLE_RATE * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeAscii(view, 36, "data");
  view.setUint32(40, pcmByteLength, true);

  const fadeSamples = Math.floor(SAMPLE_RATE * ((config.fadeMs ?? 40) / 1000));
  const dataOffset = 44;

  for (let index = 0; index < sampleCount; index += 1) {
    const time = index / SAMPLE_RATE;
    const envelopeIn = fadeSamples > 0 ? Math.min(1, index / fadeSamples) : 1;
    const envelopeOut = fadeSamples > 0 ? Math.min(1, (sampleCount - index) / fadeSamples) : 1;
    const envelope = Math.min(envelopeIn, envelopeOut);
    const combined =
      config.frequencies.reduce((sum, frequency) => sum + Math.sin(2 * Math.PI * frequency * time), 0) /
      config.frequencies.length;
    const harmonic = Math.sin(2 * Math.PI * config.frequencies[0] * time * 0.5) * 0.15;
    const sample = Math.max(-1, Math.min(1, (combined + harmonic) * envelope * config.volume));
    view.setInt16(dataOffset + index * 2, sample * 32767, true);
  }

  const base64 = bytesToBase64(bytes);
  cueBase64Cache.set(cacheKey, base64);
  return base64;
}

async function getCueFileUri(config: CueConfig & { loopSeconds?: number; fadeMs?: number }) {
  const cacheKey = getCueCacheKey(config);
  const cached = cueFileUriCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const cacheDirectory = FileSystem.cacheDirectory;
  if (!cacheDirectory) {
    throw new Error("Audio cache directory unavailable.");
  }

  const fileUri = `${cacheDirectory}livewithms-sound-${hashString(cacheKey)}.wav`;
  await FileSystem.writeAsStringAsync(fileUri, buildWavBase64(config), {
    encoding: FileSystem.EncodingType.Base64,
  });
  cueFileUriCache.set(cacheKey, fileUri);
  const fileInfo = await FileSystem.getInfoAsync(fileUri);

  if (__DEV__) {
    console.log("[sound-effects]", {
      event: "cue-file-ready",
      fileUri,
      cacheKey,
      exists: fileInfo.exists,
      size: fileInfo.exists && "size" in fileInfo ? fileInfo.size : null,
    });
  }

  return fileUri;
}

async function ensureAudioMode() {
  if (audioModeReady) {
    return;
  }

  await Audio.setIsEnabledAsync(true);
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: false,
    staysActiveInBackground: false,
    playsInSilentModeIOS: true,
    interruptionModeIOS: InterruptionModeIOS.MixWithOthers,
    interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
    shouldDuckAndroid: true,
    playThroughEarpieceAndroid: false,
  });
  audioModeReady = true;

  if (__DEV__) {
    console.log("[sound-effects]", {
      event: "audio-mode-ready",
      playsInSilentModeIOS: true,
    });
  }
}

export async function playSoundCue(cueId: CueId, enabled: boolean) {
  if (!enabled) {
    return;
  }

  try {
    await ensureAudioMode();
    const sound = new Audio.Sound();
    const fileUri = await getCueFileUri(CUE_CONFIG[cueId]);
    await sound.loadAsync(
      { uri: fileUri },
      { shouldPlay: false, isLooping: false, volume: 1, progressUpdateIntervalMillis: 50 },
    );
    const loadedStatus = await sound.getStatusAsync();
    if (__DEV__) {
      console.log("[sound-effects]", {
        event: "cue-loaded",
        cueId,
        fileUri,
        isLoaded: loadedStatus.isLoaded,
        durationMillis: loadedStatus.isLoaded ? loadedStatus.durationMillis ?? null : null,
      });
    }
    sound.setOnPlaybackStatusUpdate((status) => {
      if (__DEV__ && status.isLoaded && status.didJustFinish) {
        console.log("[sound-effects]", {
          event: "cue-finished",
          cueId,
        });
      }

      if (!status.isLoaded || !status.didJustFinish) {
        return;
      }

      void sound.unloadAsync().catch(() => undefined);
    });
    const playbackStatus = await sound.playAsync();

    if (__DEV__) {
      console.log("[sound-effects]", {
        event: "cue-play-started",
        cueId,
        isLoaded: playbackStatus.isLoaded,
        positionMillis: playbackStatus.isLoaded ? playbackStatus.positionMillis ?? null : null,
      });
    }
  } catch (error) {
    if (__DEV__) {
      console.log("[sound-effects]", {
        event: "cue-play-failed",
        cueId,
        message: error instanceof Error ? error.message : String(error),
      });
    }
    // Sound cues stay optional and should never interrupt core flows.
  }
}

export async function startAmbientLoop(enabled: boolean, options?: { onDebugState?: AmbientDebugListener }) {
  const onDebugState = options?.onDebugState;
  emitAmbientDebug(onDebugState, enabled
    ? {
        status: "stopped",
        detail: "Background ambient audio is disabled in this release.",
      }
    : {
        status: "muted",
        detail: "Background audio is turned off.",
      });

  if (__DEV__) {
    console.log("[sound-effects]", {
      event: "ambient-disabled-for-release",
      enabled,
    });
  }
}

export async function stopAmbientLoop(reason = "stop-requested", onDebugState?: AmbientDebugListener) {
  if (__DEV__) {
    console.log("[sound-effects]", {
      event: "ambient-stopped",
      reason,
    });
  }

  emitAmbientDebug(onDebugState, {
    status: "stopped",
    detail: reason,
  });
}
