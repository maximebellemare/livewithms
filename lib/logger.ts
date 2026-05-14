type LogMeta = Record<string, unknown> | undefined;

const write = (level: "info" | "warn" | "error", message: string, meta?: LogMeta) => {
  if (!__DEV__ && level !== "error") {
    return;
  }

  console[level](`[livewithms] ${message}`, meta ?? {});
};

export const logger = {
  info: (message: string, meta?: LogMeta) => write("info", message, meta),
  warn: (message: string, meta?: LogMeta) => write("warn", message, meta),
  error: (message: string, meta?: LogMeta) => write("error", message, meta),
};
