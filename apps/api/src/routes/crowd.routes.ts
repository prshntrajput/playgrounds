import { Hono } from "hono";
import { ReportCrowdRequestSchema } from "@playgrounds/shared";
import { jsonResponse, errorResponse } from "../lib/responses";
import { requireRole } from "../middleware/require-role";
import type { AppEnv } from "../types";

export function crowdRoutes(app: Hono<AppEnv>) {
  app.post("/venues/:id/crowd", requireRole("USER", "ADMIN"), async (c) => {
    const { id } = c.req.param();
    const body = await c.req.json();
    const parsed = ReportCrowdRequestSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.message, 400);
    }

    const user = c.get("user") as { id: string };
    await c.get("container").reportCrowd.execute({
      venueId: id,
      userId: user.id,
      level: parsed.data.level as import("@playgrounds/shared").CrowdLevel,
    });

    return jsonResponse({ ok: true }, 201);
  });
}
