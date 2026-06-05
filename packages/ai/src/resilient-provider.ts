import type {
  AIProvider,
  ReviewAnalysis,
  ReportClassification,
  SpamVerdict,
  Sentiment,
} from "@playgrounds/core";

export class ResilientAIProvider implements AIProvider {
  readonly name = "resilient";

  constructor(private readonly chain: AIProvider[]) {
    if (chain.length === 0) throw new Error("Provider chain cannot be empty");
  }

  async analyzeReview(text: string): Promise<ReviewAnalysis> {
    return this.tryChain((p) => p.analyzeReview(text));
  }

  async summarizeReviews(reviews: string[]): Promise<string> {
    return this.tryChain((p) => p.summarizeReviews(reviews));
  }

  async classifyReport(text: string): Promise<ReportClassification> {
    return this.tryChain((p) => p.classifyReport(text));
  }

  async detectSpam(text: string): Promise<SpamVerdict> {
    return this.tryChain((p) => p.detectSpam(text));
  }

  async analyzeSentiment(text: string): Promise<Sentiment> {
    return this.tryChain((p) => p.analyzeSentiment(text));
  }

  private async tryChain<T>(fn: (provider: AIProvider) => Promise<T>): Promise<T> {
    let lastError: unknown;

    for (const provider of this.chain) {
      try {
        const result = await fn(provider);
        return result;
      } catch (err) {
        console.warn(`[AI] Provider "${provider.name}" failed, trying next`, err);
        lastError = err;
      }
    }

    throw lastError ?? new Error("All AI providers failed");
  }
}
