const pendingRetries = new Map<string, ReturnType<typeof setTimeout>>();

export function scheduleSilentRetry(key: string, delayMs: number, callback: () => void | Promise<void>) {
  const existing = pendingRetries.get(key);
  if (existing) {
    clearTimeout(existing);
  }

  const timeout = setTimeout(() => {
    pendingRetries.delete(key);
    void callback();
  }, delayMs);

  pendingRetries.set(key, timeout);
}

export function cancelSilentRetry(key: string) {
  const existing = pendingRetries.get(key);
  if (existing) {
    clearTimeout(existing);
    pendingRetries.delete(key);
  }
}
