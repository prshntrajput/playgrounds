import { CROWD_DECAY_HOURS, CROWD_LEVEL, CrowdLevel } from "@playgrounds/shared";

interface CrowdReport {
  level: CrowdLevel;
  createdAt: Date;
}

export class CrowdEngine {
  /**
   * Time-decay weighted aggregation of crowd reports.
   * Reports lose half their weight every CROWD_DECAY_HOURS hours.
   */
  evaluate(reports: CrowdReport[]): CrowdLevel | null {
    if (reports.length === 0) return null;

    const now = Date.now();
    const levelToNumber: Record<CrowdLevel, number> = {
      [CROWD_LEVEL.LOW]: 0,
      [CROWD_LEVEL.MEDIUM]: 1,
      [CROWD_LEVEL.HIGH]: 2,
    };

    let totalWeight = 0;
    let weightedSum = 0;

    for (const report of reports) {
      const ageHours = (now - report.createdAt.getTime()) / (1000 * 60 * 60);
      const weight = Math.pow(0.5, ageHours / CROWD_DECAY_HOURS);
      weightedSum += levelToNumber[report.level] * weight;
      totalWeight += weight;
    }

    if (totalWeight === 0) return null;

    const avg = weightedSum / totalWeight;

    if (avg < 0.5) return CROWD_LEVEL.LOW;
    if (avg < 1.5) return CROWD_LEVEL.MEDIUM;
    return CROWD_LEVEL.HIGH;
  }
}
