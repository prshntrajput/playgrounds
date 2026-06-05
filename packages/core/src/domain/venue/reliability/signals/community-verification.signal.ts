import { SIGNAL_WEIGHTS } from "@playgrounds/shared";
import { ReliabilitySignal, SignalResult, VenueSignalContext } from "../reliability-signal";

const VERIFICATIONS_FOR_FULL_CONFIDENCE = 10;

export class CommunityVerificationSignal implements ReliabilitySignal {
  readonly key = "community-verification";
  readonly weight = SIGNAL_WEIGHTS.COMMUNITY_VERIFICATION;

  compute(ctx: VenueSignalContext): SignalResult {
    const { communityVerifications, lastVerifiedAt } = ctx;

    if (communityVerifications === 0) {
      return {
        score: 0.4,
        confidence: 0.2,
        reason: "No community verifications",
      };
    }

    const daysSinceVerified = lastVerifiedAt
      ? (Date.now() - lastVerifiedAt.getTime()) / (1000 * 60 * 60 * 24)
      : 365;

    const recencyScore = Math.max(0, 1 - daysSinceVerified / 90);
    const countScore = Math.min(communityVerifications / VERIFICATIONS_FOR_FULL_CONFIDENCE, 1);
    const score = (recencyScore + countScore) / 2;
    const confidence = Math.min(communityVerifications / 3, 1);

    return {
      score,
      confidence,
      reason: `${communityVerifications} community verifications, last ${Math.round(daysSinceVerified)}d ago`,
    };
  }
}
