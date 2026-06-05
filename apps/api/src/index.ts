import { Hono } from "hono";
import { cors } from "hono/cors";
import { buildContainer } from "./container";
import { parseEnv } from "./env";
import { authMiddleware } from "./middleware/auth";
import { errorMiddleware } from "./middleware/error";
import { rateLimitMiddleware } from "./middleware/rate-limit";
import { venuesRoutes } from "./routes/venues.routes";
import { reviewsRoutes } from "./routes/reviews.routes";
import { reportsRoutes } from "./routes/reports.routes";
import { crowdRoutes } from "./routes/crowd.routes";
import { favoritesRoutes } from "./routes/favorites.routes";
import { dispatchNotifications } from "./cron/dispatch-notifications";
import { recomputeStaleScores } from "./cron/recompute-scores";
import { runOsmImport } from "./cron/import-osm";
import { adminRoutes } from "./routes/admin.routes";
import { statusVotesRoutes } from "./routes/status-votes.routes";
import { qaRoutes } from "./routes/qa.routes";
import type { AppEnv } from "./types";

const app = new Hono<AppEnv>();

app.use("*", cors({ origin: "*", allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"] }));
app.use("*", errorMiddleware);
app.use("*", rateLimitMiddleware);
app.use("*", authMiddleware);

// Inject the container into context on every request
app.use("*", async (c, next) => {
  const env = parseEnv(c.env);
  c.set("container", buildContainer(env));
  return next();
});

app.get("/health", (c) => c.json({ ok: true, ts: new Date().toISOString() }));

// Mount feature routers
venuesRoutes(app);
reviewsRoutes(app);
reportsRoutes(app);
crowdRoutes(app);
favoritesRoutes(app);
adminRoutes(app);
statusVotesRoutes(app);
qaRoutes(app);

// Scheduled cron handler
const scheduled: ExportedHandlerScheduledHandler<Env> = async (event, env) => {
  const parsedEnv = parseEnv(env);
  const container = buildContainer(parsedEnv);

  switch (event.cron) {
    case "0 3 * * *": {
      console.log("[CRON] Starting nightly OSM import");
      const osmResult = await runOsmImport(container.venueRepository, container.cache);
      console.log(`[CRON] OSM import done — cities: ${osmResult.cities.join(", ")}, +${osmResult.imported} new, ${osmResult.updated} updated, ${osmResult.skipped} skipped`);
      break;
    }
    case "0 */6 * * *":
      await recomputeStaleScores(container);
      break;
    case "*/30 * * * *":
      await dispatchNotifications();
      break;
  }
};

export default {
  fetch: app.fetch,
  scheduled,
} satisfies ExportedHandler<Env>;
