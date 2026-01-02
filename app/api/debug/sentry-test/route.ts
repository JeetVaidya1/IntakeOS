import { NextResponse } from "next/server";
import { captureError } from "@/lib/monitor";

export async function GET() {
  try {
    // Intentionally throw an error to test Sentry
    throw new Error("Sentry test error - This is a test error to verify Sentry integration");
  } catch (error) {
    // Capture the error using our helper function
    captureError(error as Error, {
      test: true,
      route: "/api/debug/sentry-test",
      timestamp: new Date().toISOString(),
    });

    // Return a response so the API doesn't crash
    return NextResponse.json(
      {
        success: false,
        message: "Test error thrown and captured by Sentry",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

