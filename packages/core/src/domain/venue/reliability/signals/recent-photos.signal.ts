import { SIGNAL_WEIGHTS } from "@playgrounds/shared";
import { ReliabilitySignal, SignalResult, VenueSignalContext } from "../reliability-signal";

const RECENT_DAYS = 60;
const PHOTOS_FOR_FULL_CONFIDENCE = 3;

export class RecentPhotosSignal implements ReliabilitySignal {
  readonly key = "recent-photos";
  readonly weight = SIGNAL_WEIGHTS.RECENT_PHOTOS;

  compute(ctx: VenueSignalContext): SignalResult {
    const cutoff = new Date(Date.now() - RECENT_DAYS * 24 * 60 * 60 * 1000);
    const recent = ctx.photos.filter((p) => p.createdAt >= cutoff);

    if (recent.length === 0) {
      return { score: 0.5, confidence: 0.05, reason: "No recent photos" };
    }

    const confidence = Math.min(recent.length / PHOTOS_FOR_FULL_CONFIDENCE, 1);

    return {
      score: 0.8,
      confidence,
      reason: `${recent.length} photo(s) uploaded in last ${RECENT_DAYS} days`,
    };
  }
}
