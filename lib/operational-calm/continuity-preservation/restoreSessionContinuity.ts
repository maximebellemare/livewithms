export function restoreSessionContinuity<T>(input: {
  serverValue: T | null | undefined;
  localValue: T | null | undefined;
  preferLocalWhenEmpty?: boolean;
}) {
  if (input.preferLocalWhenEmpty && !input.serverValue && input.localValue) {
    return input.localValue;
  }

  return input.serverValue ?? input.localValue ?? null;
}
