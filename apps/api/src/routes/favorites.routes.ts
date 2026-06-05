import { Hono } from "hono";
import { jsonResponse } from "../lib/responses";
import { requireRole } from "../middleware/require-role";
import type { AppEnv } from "../types";

export function favoritesRoutes(app: Hono<AppEnv>) {
  app.post("/venues/:id/favorites", requireRole("USER", "ADMIN"), async (c) => {
    const { id } = c.req.param();
    const user = c.get("user") as { id: string };
    const result = await c.get("container").toggleFavorite.execute(user.id, id);
    return jsonResponse(result);
  });
}
