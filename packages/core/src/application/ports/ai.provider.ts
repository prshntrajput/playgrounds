export interface ReviewAnalysis {
  sentiment: "positive" | "negative" | "neutral";
  issues: string[];
  tags: string[];
}

export interface ReportClassification {
  reportType: string;
  confidence: number;
}

export interface SpamVerdict {
  isSpam: boolean;
  confidence: number;
  reason: string;
}

export interface Sentiment {
  label: "positive" | "negative" | "neutral";
  score: number;
}

export interface AIProvider {
  readonly name: string;
  analyzeReview(text: string): Promise<ReviewAnalysis>;
  summarizeReviews(reviews: string[]): Promise<string>;
  classifyReport(text: string): Promise<ReportClassification>;
  detectSpam(text: string): Promise<SpamVerdict>;
  analyzeSentiment(text: string): Promise<Sentiment>;
}
