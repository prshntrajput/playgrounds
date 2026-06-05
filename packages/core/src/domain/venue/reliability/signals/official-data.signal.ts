import { SIGNAL_WEIGHTS } from "@playgrounds/shared";
import { ReliabilitySignal, SignalResult, VenueSignalContext } from "../reliability-signal";

export class OfficialDataSignal implements ReliabilitySignal {
  readonly key = "official-data";
  readonly weight = SIGNAL_WEIGHTS.OFFICIAL_DATA;

  compute(ctx: VenueSignalContext): SignalResult {
    if (!ctx.hasOfficialData) {
      return {
        score: 0.5,
        confidence: 0.1,
        reason: "No official data source linked",
      };
    }

    return {
      score: 0.9,
      confidence: 0.9,
      reason: "Venue backed by official data source",
    };
  }
}
