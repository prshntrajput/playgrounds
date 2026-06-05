import { Hono } from "hono";
import { z } from "zod";
import { OsmDataSource } from "@playgrounds/db";
import { ImportFromSourceUseCase } from "@playgrounds/core";
import { runOsmImport } from "../cron/import-osm";
import { jsonResponse, errorResponse } from "../lib/responses";
import type { AppEnv } from "../types";

const OsmImportBodySchema = z.object({
  lat: z.number().optional(),
  lng: z.number().optional(),
  radiusKm: z.number().positive().max(100).default(25),
  city: z.string().optional(),
}).optional();

export function adminRoutes(app: Hono<AppEnv>) {
  /**
   * POST /admin/import/osm
   * Manual OSM import trigger.
   * - No body → runs the normal KV-progress rotation (same as cron)
   * - Body { lat, lng, radiusKm } → one-shot import for those coordinates
   */
  app.post("/admin/import/osm", async (c) => {
    let rawBody: unknown;
    try {
      rawBody = await c.req.json();
    } catch {
      rawBody = undefined;
    }

    const parsed = OsmImportBodySchema.safeParse(rawBody ?? undefined);
    if (!parsed.success) {
      return errorResponse(`Invalid body: ${parsed.error.message}`, 400);
    }

    const body = parsed.data;
    const { venueRepository, cache } = c.get("container");

    // If coordinates are explicitly supplied, run a targeted one-shot import
    if (body?.lat !== undefined && body?.lng !== undefined) {
      const osmSource = new OsmDataSource();
      const useCase = new ImportFromSourceUseCase(venueRepository, osmSource);
      const result = await useCase.execute({
        lat: body.lat,
        lng: body.lng,
        radiusKm: body.radiusKm,
      });
      return jsonResponse({
        mode: "targeted",
        city: body.city ?? `${body.lat},${body.lng}`,
        ...result,
      });
    }

    // Otherwise run the normal rotating import
    const result = await runOsmImport(venueRepository, cache);
    return jsonResponse({ mode: "rotation", ...result });
  });

  app.get("/admin/import/osm/progress", async (c) => {
    const { cache } = c.get("container");
    const nextIdx = (await cache.get<number>("osm:import:next_index")) ?? 0;
    return jsonResponse({ nextCityIndex: nextIdx });
  });
}
