import { ReliabilitySignal, VenueSignalContext } from "./reliability-signal";
import { ReliabilityScore } from "./reliability-score.vo";

export class ReliabilityEngine {
  constructor(private readonly signals: ReliabilitySignal[]) {}

  evaluate(ctx: VenueSignalContext): ReliabilityScore {
    const weighted = this.signals.map((s) => {
      const r = s.compute(ctx);
      return {
        key: s.key,
        score: r.score,
        confidence: r.confidence,
        reason: r.reason,
        effectiveWeight: s.weight * r.confidence,
      };
    });

    const totalWeight = weighted.reduce((a, w) => a + w.effectiveWeight, 0) || 1;
    const score = weighted.reduce((a, w) => a + w.score * w.effectiveWeight, 0) / totalWeight;

    return ReliabilityScore.fromUnit(score, weighted);
  }
}
