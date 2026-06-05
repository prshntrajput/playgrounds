import { RELIABILITY_STALE_HOURS } from "@playgrounds/shared";
import type { Container } from "../container";

const BATCH_SIZE = 50;

export async function recomputeStaleScores(container: Container) {
  console.log("[CRON] Starting reliability recompute for stale venues");

  const staleBeforeMs = Date.now() - RELIABILITY_STALE_HOURS * 60 * 60 * 1000;
  const staleBefore = new Date(staleBeforeMs);

  const venues = await container.venueRepository.findStaleForRecompute(staleBefore, BATCH_SIZE);
  if (venues.length === 0) {
    console.log("[CRON] No stale venues found — skipping");
    return;
  }

  let recomputed = 0;
  let failed = 0;

  for (const venue of venues) {
    try {
      await container.recomputeReliability.execute(venue.id);
      recomputed++;
    } catch (err) {
      console.error(`[CRON] Failed to recompute venue ${venue.id}:`, err);
      failed++;
    }
  }

  console.log(`[CRON] Reliability recompute done — ${recomputed} updated, ${failed} failed`);
}
