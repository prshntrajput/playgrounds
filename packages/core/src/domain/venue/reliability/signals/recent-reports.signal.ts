import { REPORT_TYPE, SIGNAL_WEIGHTS } from "@playgrounds/shared";
import type { ReportType } from "@playgrounds/shared";
import { ReliabilitySignal, SignalResult, VenueSignalContext } from "../reliability-signal";

const RECENT_DAYS = 7;

const NEGATIVE_REPORTS = new Set<ReportType>([
  REPORT_TYPE.CLOSED,
  REPORT_TYPE.FLOODED,
  REPORT_TYPE.UNSAFE,
  REPORT_TYPE.RENOVATION,
  REPORT_TYPE.DAMAGED_SURFACE,
]);

export class RecentReportsSignal implements ReliabilitySignal {
  readonly key = "recent-reports";
  readonly weight = SIGNAL_WEIGHTS.RECENT_REPORTS;

  compute(ctx: VenueSignalContext): SignalResult {
    const cutoff = new Date(Date.now() - RECENT_DAYS * 24 * 60 * 60 * 1000);
    const recent = ctx.reports.filter((r) => r.createdAt >= cutoff);

    if (recent.length === 0) {
      return {
        score: 0.8,
        confidence: 0.6,
        reason: "No recent negative reports",
      };
    }

    const negativeCount = recent.filter((r) => NEGATIVE_REPORTS.has(r.type)).length;
    const negativeRatio = negativeCount / recent.length;
    const score = 1 - negativeRatio;
    const confidence = Math.min(recent.length / 3, 1);

    return {
      score,
      confidence,
      reason: `${negativeCount} of ${recent.length} reports are negative in last ${RECENT_DAYS} days`,
    };
  }
}
