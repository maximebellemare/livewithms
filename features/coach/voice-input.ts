import { Platform } from "react-native";
import Constants from "expo-constants";

type VoiceInputResult =
  | {
      ok: true;
      transcript: string;
    }
  | {
      ok: false;
      reason: "unavailable" | "permission-denied" | "empty" | "failed";
      message: string;
    };

type VoiceInputOptions = {
  timeoutMs?: number;
  locale?: string;
  onTranscript?: (transcript: string) => void;
};

type SpeechRecognitionSubscription = {
  remove: () => void;
};

type ExpoSpeechRecognitionModule = {
  addListener: (
    eventName: "result" | "error" | "end",
    listener: (event: unknown) => void,
  ) => SpeechRecognitionSubscription;
  requestPermissionsAsync: () => Promise<{ granted?: boolean; status?: string }>;
  isRecognitionAvailable: () => boolean;
  start: (options: {
    lang: string;
    interimResults: boolean;
    continuous: boolean;
    maxAlternatives: number;
    addsPunctuation?: boolean;
    contextualStrings?: string[];
  }) => void;
  stop: () => void;
  abort: () => void;
};

function isExpoGoRuntime() {
  return Constants.appOwnership === "expo";
}

async function loadExpoSpeechRecognitionModule(): Promise<ExpoSpeechRecognitionModule | null> {
  if (Platform.OS === "web" || isExpoGoRuntime()) {
    return null;
  }

  try {
    const loaded = (await import("expo-speech-recognition")) as {
      ExpoSpeechRecognitionModule?: ExpoSpeechRecognitionModule;
    };
    return loaded.ExpoSpeechRecognitionModule ?? null;
  } catch {
    return null;
  }
}

function getWebSpeechRecognition() {
  const maybeWindow = globalThis as typeof globalThis & {
    SpeechRecognition?: new () => {
      continuous: boolean;
      interimResults: boolean;
      lang: string;
      onresult: ((event: { results: ArrayLike<{ 0?: { transcript?: string } }> }) => void) | null;
      onerror: (() => void) | null;
      onend: (() => void) | null;
      start: () => void;
      stop: () => void;
  };
    webkitSpeechRecognition?: new () => {
      continuous: boolean;
      interimResults: boolean;
      lang: string;
      onresult: ((event: { results: ArrayLike<{ 0?: { transcript?: string } }> }) => void) | null;
      onerror: (() => void) | null;
      onend: (() => void) | null;
      start: () => void;
      stop: () => void;
    };
  };

  return maybeWindow.SpeechRecognition ?? maybeWindow.webkitSpeechRecognition ?? null;
}

let stopActiveVoiceInput: (() => void) | null = null;

export function isCoachVoiceInputAvailable() {
  return Platform.OS === "web" ? Boolean(getWebSpeechRecognition()) : !isExpoGoRuntime();
}

export function stopCoachVoiceInput() {
  stopActiveVoiceInput?.();
}

export async function startCoachVoiceInput(options: VoiceInputOptions = {}): Promise<VoiceInputResult> {
  const timeoutMs = options.timeoutMs ?? 10000;
  const locale = options.locale ?? "en-US";

  if (Platform.OS === "web") {
    const SpeechRecognition = getWebSpeechRecognition();

    if (!SpeechRecognition) {
      return {
        ok: false,
        reason: "unavailable",
        message: "Voice input is not available here.",
      };
    }

    return new Promise((resolve) => {
      const recognition = new SpeechRecognition();
      let settled = false;
      let transcript = "";
      const finish = (result: VoiceInputResult) => {
        if (settled) {
          return;
        }
        settled = true;
        stopActiveVoiceInput = null;
        recognition.stop();
        resolve(result);
      };

      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = locale;
      recognition.onresult = (event) => {
        transcript = Array.from(event.results)
          .map((result) => result[0]?.transcript ?? "")
          .join(" ")
          .trim();
        if (transcript) {
          options.onTranscript?.(transcript);
        }
      };
      recognition.onerror = () =>
        finish({
          ok: false,
          reason: "permission-denied",
          message: "Microphone access is turned off for LiveWithMS.",
        });
      recognition.onend = () =>
        finish(
          transcript
            ? { ok: true, transcript }
            : {
                ok: false,
                reason: "empty",
                message: "No speech was detected.",
              },
        );

      stopActiveVoiceInput = () => recognition.stop();
      try {
        recognition.start();
      } catch {
        finish({
          ok: false,
          reason: "failed",
          message: "Voice input could not start right now.",
        });
      }
      const timeout = setTimeout(() => {
        finish(
          transcript
            ? { ok: true, transcript }
            : {
                ok: false,
                reason: "empty",
                message: "No speech was detected.",
            },
        );
      }, timeoutMs);
      const previousFinish = finish;
      stopActiveVoiceInput = () => {
        clearTimeout(timeout);
        recognition.stop();
        previousFinish(
          transcript
            ? { ok: true, transcript }
            : {
                ok: false,
                reason: "empty",
                message: "No speech was detected.",
              },
        );
      };
    });
  }

  const SpeechRecognition = await loadExpoSpeechRecognitionModule();

  if (!SpeechRecognition) {
    return {
      ok: false,
      reason: "unavailable",
      message: "Voice input requires the app build version.",
    };
  }

  const permission = await SpeechRecognition.requestPermissionsAsync().catch(() => null);

  if (!permission?.granted) {
    return {
      ok: false,
      reason: "permission-denied",
      message: "Microphone access is turned off for LiveWithMS.",
    };
  }

  if (!SpeechRecognition.isRecognitionAvailable()) {
    return {
      ok: false,
      reason: "unavailable",
      message: "Voice input is not available here.",
    };
  }

  return new Promise((resolve) => {
    let settled = false;
    let transcript = "";
    const subscriptions: SpeechRecognitionSubscription[] = [];
    const finish = async (result: VoiceInputResult) => {
      if (settled) {
        return;
      }
      settled = true;
      stopActiveVoiceInput = null;
      subscriptions.forEach((subscription) => subscription.remove());
      try {
        SpeechRecognition.stop();
      } catch {
        try {
          SpeechRecognition.abort();
        } catch {
          // Native speech cleanup should never block returning control to Coach.
        }
      }
      resolve(result);
    };

    subscriptions.push(
      SpeechRecognition.addListener("result", (event) => {
        const resultEvent = event as {
          results?: Array<{ transcript?: string }>;
          isFinal?: boolean;
        };
        const nextTranscript = (resultEvent.results ?? [])
          .map((result) => result.transcript ?? "")
          .join(" ")
          .trim();

        if (nextTranscript) {
          transcript = nextTranscript;
          options.onTranscript?.(nextTranscript);
        }

        if (resultEvent.isFinal) {
          void finish(
            transcript
              ? { ok: true, transcript }
              : {
                  ok: false,
                  reason: "empty",
                  message: "No speech was detected.",
                },
          );
        }
      }),
      SpeechRecognition.addListener("end", () => {
        void finish(
          transcript
            ? { ok: true, transcript }
            : {
                ok: false,
                reason: "empty",
                message: "No speech was detected.",
              },
        );
      }),
      SpeechRecognition.addListener("error", (event) => {
        const errorEvent = event as { error?: string };
        void finish({
          ok: false,
          reason: errorEvent.error === "not-allowed" ? "permission-denied" : "failed",
          message:
            errorEvent.error === "not-allowed"
              ? "Microphone access is turned off for LiveWithMS."
              : "Voice input could not start right now.",
        });
      }),
    );

    stopActiveVoiceInput = () => {
      SpeechRecognition.stop();
      void finish(
        transcript
          ? { ok: true, transcript }
          : {
              ok: false,
              reason: "empty",
              message: "No speech was detected.",
            },
      );
    };

    try {
      SpeechRecognition.start({
        lang: locale,
        interimResults: true,
        continuous: false,
        maxAlternatives: 1,
        addsPunctuation: true,
        contextualStrings: ["fatigue", "stress", "brain fog", "symptoms", "appointment"],
      });
    } catch {
      void finish({
        ok: false,
        reason: "failed",
        message: "Voice input could not start right now.",
      });
    }

    setTimeout(() => {
      void finish(
        transcript
          ? { ok: true, transcript }
          : {
              ok: false,
              reason: "empty",
              message: "No speech was detected.",
            },
      );
    }, timeoutMs);
  });
}
