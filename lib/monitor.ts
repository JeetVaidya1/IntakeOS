import * as Sentry from "@sentry/nextjs";

/**
 * Helper function to capture non-fatal errors in Sentry
 * @param error - The error object or error message
 * @param context - Optional context object with additional information
 */
export function captureError(
  error: Error | string,
  context?: Record<string, unknown>
): void {
  if (error instanceof Error) {
    Sentry.captureException(error, {
      extra: context,
    });
  } else {
    Sentry.captureMessage(error, {
      level: "error",
      extra: context,
    });
  }
}

