import { supabase } from "../../lib/supabase/client";
import { logger } from "../../lib/logger";

type InvokeAiFunctionOptions = {
  unavailableMessage?: string;
  logContext?: Record<string, unknown>;
};

export async function invokeAiFunction<T>(
  functionName: string,
  body: unknown,
  options: InvokeAiFunctionOptions = {},
): Promise<T> {
  logger.info("AI function invoke", {
    functionName,
    ...(options.logContext ?? {}),
  });

  const { data, error } = await supabase.functions.invoke(functionName, {
    body,
  });

  if (error) {
    const details: Record<string, unknown> = {
      functionName,
      errorName: error.name,
      errorMessage: error.message,
      ...(options.logContext ?? {}),
    };

    const maybeContext = (error as { context?: unknown }).context;
    if (maybeContext instanceof Response) {
      details.status = maybeContext.status;
      details.statusText = maybeContext.statusText;

      try {
        details.responseBody = await maybeContext.clone().text();
      } catch {
        details.responseBody = "Unable to read response body";
      }
    }

    logger.error("AI function invoke failed", details);
    throw new Error(options.unavailableMessage ?? "AI is temporarily unavailable.");
  }

  return data as T;
}
