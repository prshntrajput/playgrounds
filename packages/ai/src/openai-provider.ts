import OpenAI from "openai";
import type {
  AIProvider,
  ReviewAnalysis,
  ReportClassification,
  SpamVerdict,
  Sentiment,
} from "@playgrounds/core";

export class OpenAIProvider implements AIProvider {
  readonly name = "openai";
  private readonly client: OpenAI;
  private readonly model: string;

  constructor(apiKey: string, model = "gpt-4o-mini") {
    this.client = new OpenAI({ apiKey });
    this.model = model;
  }

  async analyzeReview(text: string): Promise<ReviewAnalysis> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: 'Analyze sports venue reviews. Return JSON: { "sentiment": "positive"|"negative"|"neutral", "issues": [], "tags": [] }',
        },
        { role: "user", content: text },
      ],
    });
    return JSON.parse(response.choices[0].message.content ?? "{}") as ReviewAnalysis;
  }

  async summarizeReviews(reviews: string[]): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: "system",
          content: "Summarize sports venue reviews in 2-3 sentences. Focus on recurring themes.",
        },
        { role: "user", content: reviews.slice(0, 10).join("\n\n") },
      ],
    });
    return response.choices[0].message.content?.trim() ?? "";
  }

  async classifyReport(text: string): Promise<ReportClassification> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: 'Classify venue reports as: CLOSED, FLOODED, UNSAFE, BROKEN_LIGHTS, RENOVATION, NO_WATER, OVERCROWDED, DAMAGED_SURFACE. Return JSON: { "reportType": "TYPE", "confidence": 0.0-1.0 }',
        },
        { role: "user", content: text },
      ],
    });
    return JSON.parse(response.choices[0].message.content ?? "{}") as ReportClassification;
  }

  async detectSpam(text: string): Promise<SpamVerdict> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: 'Detect if text is spam/fake. Return JSON: { "isSpam": bool, "confidence": 0.0-1.0, "reason": "..." }',
        },
        { role: "user", content: text },
      ],
    });
    return JSON.parse(response.choices[0].message.content ?? "{}") as SpamVerdict;
  }

  async analyzeSentiment(text: string): Promise<Sentiment> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: 'Analyze sentiment. Return JSON: { "label": "positive"|"negative"|"neutral", "score": 0.0-1.0 }',
        },
        { role: "user", content: text },
      ],
    });
    return JSON.parse(response.choices[0].message.content ?? "{}") as Sentiment;
  }
}
