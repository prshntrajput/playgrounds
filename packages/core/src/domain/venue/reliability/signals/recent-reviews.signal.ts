import { SIGNAL_WEIGHTS } from "@playgrounds/shared";
import { ReliabilitySignal, SignalResult, VenueSignalContext } from "../reliability-signal";

const RECENT_DAYS = 30;
const MIN_REVIEWS_FOR_HIGH_CONFIDENCE = 5;

export class RecentReviewsSignal implements ReliabilitySignal {
  readonly key = "recent-reviews";
  readonly weight = SIGNAL_WEIGHTS.RECENT_REVIEWS;

  compute(ctx: VenueSignalContext): SignalResult {
    const cutoff = new Date(Date.now() - RECENT_DAYS * 24 * 60 * 60 * 1000);
    const recent = ctx.reviews.filter((r) => r.createdAt >= cutoff);

    if (recent.length === 0) {
      return { score: 0.5, confidence: 0.1, reason: "No recent reviews" };
    }

    const avgRating = recent.reduce((a, r) => a + r.rating, 0) / recent.length;
    const score = (avgRating - 1) / 4;
    const confidence = Math.min(recent.length / MIN_REVIEWS_FOR_HIGH_CONFIDENCE, 1);

    return {
      score,
      confidence,
      reason: `${recent.length} reviews in last ${RECENT_DAYS} days, avg rating ${avgRating.toFixed(1)}`,
    };
  }
}
