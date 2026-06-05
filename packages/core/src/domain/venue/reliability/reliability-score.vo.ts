export interface WeightedSignalResult {
  key: string;
  score: number;
  confidence: number;
  reason: string;
  effectiveWeight: number;
}

export class ReliabilityScore {
  private constructor(
    readonly value: number,
    readonly breakdown: WeightedSignalResult[]
  ) {}

  static fromUnit(score: number, breakdown: WeightedSignalResult[]) {
    return new ReliabilityScore(Math.max(0, Math.min(1, score)), breakdown);
  }

  toPercent() {
    return Math.round(this.value * 100);
  }

  asUnit() {
    return this.value;
  }
}
