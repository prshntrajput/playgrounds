import { Hono } from "hono";
import { SubmitReviewRequestSchema } from "@playgrounds/shared";
import { jsonResponse, errorResponse } from "../lib/responses";
import { requireRole } from "../middleware/require-role";
import type { AppEnv } from "../types";

export function reviewsRoutes(app: Hono<AppEnv>) {
  app.post("/venues/:id/reviews", requireRole("USER", "ADMIN"), async (c) => {
    const { id } = c.req.param();
    const body = await c.req.json();
    const parsed = SubmitReviewRequestSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.message, 400);
    }

    const user = c.get("user") as { id: string };
    const review = await c.get("container").submitReview.execute({
      venueId: id,
      userId: user.id,
      rating: parsed.data.rating,
      review: parsed.data.review,
    });

    return jsonResponse(review, 201);
  });
}
