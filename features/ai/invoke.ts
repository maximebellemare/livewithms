import env from "../../lib/env";
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
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token ?? null;
  const functionUrl = `${env.supabaseUrl}/functions/v1/${functionName}`;

  logger.info("AI function invoke", {
    functionName,
    sessionExists: Boolean(sessionData.session),
    accessTokenExists: Boolean(accessToken),
    ...(options.logContext ?? {}),
  });

  console.log("[ai] invoke", {
    functionName,
    sessionExists: Boolean(sessionData.session),
    accessTokenExists: Boolean(accessToken),
    ...(options.logContext ?? {}),
  });

  if (sessionError) {
    logger.error("AI function session lookup failed", {
      functionName,
      errorName: sessionError.name,
      errorMessage: sessionError.message,
      ...(options.logContext ?? {}),
    });
    console.error("[ai] session lookup failed", {
      functionName,
      errorName: sessionError.name,
      errorMessage: sessionError.message,
      ...(options.logContext ?? {}),
    });
    throw new Error(options.unavailableMessage ?? "AI is temporarily unavailable.");
  }

  let response: Response;

  try {
    response = await fetch(functionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: env.supabaseAnonKey,
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify(body),
    });
  } catch (error) {
    const details = {
      functionName,
      sessionExists: Boolean(sessionData.session),
      accessTokenExists: Boolean(accessToken),
      errorMessage: error instanceof Error ? error.message : String(error),
      ...(options.logContext ?? {}),
    };
    logger.error("AI function network invoke failed", details);
    console.error("[ai] invoke network failed", details);
    throw new Error(options.unavailableMessage ?? "AI is temporarily unavailable.");
  }

  if (!response.ok) {
    let responseBody = "";

    try {
      responseBody = await response.clone().text();
    } catch {
      responseBody = "Unable to read response body";
    }

    const details: Record<string, unknown> = {
      functionName,
      status: response.status,
      statusText: response.statusText,
      responseBody,
      sessionExists: Boolean(sessionData.session),
      accessTokenExists: Boolean(accessToken),
      ...(options.logContext ?? {}),
    };

    logger.error("AI function invoke failed", details);
    console.error("[ai] invoke failed", details);
    throw new Error(options.unavailableMessage ?? "AI is temporarily unavailable.");
  }

  return (await response.json()) as T;
}
