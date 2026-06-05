import { Context, Next } from "hono";
import {
  VenueNotFoundError,
  UnauthorizedError,
  ValidationError,
  SpamDetectedError,
} from "@playgrounds/core";
import { errorResponse } from "../lib/responses";

export async function errorMiddleware(c: Context, next: Next) {
  try {
    await next();
  } catch (err) {
    if (err instanceof VenueNotFoundError) {
      return errorResponse(err.message, 404);
    }
    if (err instanceof UnauthorizedError) {
      return errorResponse(err.message, 401);
    }
    if (err instanceof ValidationError) {
      return errorResponse(err.message, 400);
    }
    if (err instanceof SpamDetectedError) {
      return errorResponse(err.message, 422);
    }

    console.error("[API] Unhandled error:", err);
    return errorResponse("Internal server error", 500);
  }
}
