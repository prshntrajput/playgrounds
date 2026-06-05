import { Hono } from "hono";
import { VenueSearchRequestSchema } from "@playgrounds/shared";
import { jsonResponse, errorResponse } from "../lib/responses";
import type { AppEnv } from "../types";

export function venuesRoutes(app: Hono<AppEnv>) {
  app.get("/venues/search", async (c) => {
    const query = Object.fromEntries(new URL(c.req.url).searchParams);
    const parsed = VenueSearchRequestSchema.safeParse(query);

    if (!parsed.success) {
      return errorResponse(parsed.error.message, 400);
    }

    const result = await c.get("container").searchVenues.execute(parsed.data);
    return jsonResponse(result);
  });

  app.get("/venues/:id", async (c) => {
    const { id } = c.req.param();
    const result = await c.get("container").getVenueDetails.execute(id);

    return jsonResponse({
      venue: result.venue,
      reviewCount: result.reviewCount,
      crowdLevel: result.crowdLevel,
      aiSummary: result.aiSummary,
    });
  });
}
