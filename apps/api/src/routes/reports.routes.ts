import { Hono } from "hono";
import { SubmitReportRequestSchema } from "@playgrounds/shared";
import { jsonResponse, errorResponse } from "../lib/responses";
import { requireRole } from "../middleware/require-role";
import type { AppEnv } from "../types";

export function reportsRoutes(app: Hono<AppEnv>) {
  app.post("/venues/:id/reports", requireRole("USER", "ADMIN"), async (c) => {
    const { id } = c.req.param();
    const body = await c.req.json();
    const parsed = SubmitReportRequestSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.message, 400);
    }

    const user = c.get("user") as { id: string };
    const report = await c.get("container").submitReport.execute({
      venueId: id,
      userId: user.id,
      reportType: parsed.data.reportType as import("@playgrounds/shared").ReportType,
      description: parsed.data.description,
    });

    return jsonResponse(report, 201);
  });
}
