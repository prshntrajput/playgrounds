import { SIGNAL_WEIGHTS } from "@playgrounds/shared";
import { ReliabilitySignal, SignalResult, VenueSignalContext } from "../reliability-signal";

export class AiConfidenceSignal implements ReliabilitySignal {
  readonly key = "ai-confidence";
  readonly weight = SIGNAL_WEIGHTS.AI_CONFIDENCE;

  compute(ctx: VenueSignalContext): SignalResult {
    if (ctx.aiConfidenceScore === undefined) {
      return {
        score: 0.5,
        confidence: 0,
        reason: "No AI analysis available",
      };
    }

    return {
      score: ctx.aiConfidenceScore,
      confidence: 0.8,
      reason: `AI confidence score: ${Math.round(ctx.aiConfidenceScore * 100)}%`,
    };
  }
}
