import { GoogleGenerativeAI } from "@google/generative-ai";
import type {
  AIProvider,
  ReviewAnalysis,
  ReportClassification,
  SpamVerdict,
  Sentiment,
} from "@playgrounds/core";

export class GeminiProvider implements AIProvider {
  readonly name = "gemini";
  private readonly model;

  constructor(apiKey: string, modelName = "gemini-1.5-flash") {
    const client = new GoogleGenerativeAI(apiKey);
    this.model = client.getGenerativeModel({ model: modelName });
  }

  async analyzeReview(text: string): Promise<ReviewAnalysis> {
    const prompt = `Analyze this sports venue review and respond with JSON only.
Review: "${text}"

Response format:
{
  "sentiment": "positive" | "negative" | "neutral",
  "issues": ["issue1", "issue2"],
  "tags": ["tag1", "tag2"]
}`;

    const result = await this.model.generateContent(prompt);
    const json = this.extractJson(result.response.text());
    return json as ReviewAnalysis;
  }

  async summarizeReviews(reviews: string[]): Promise<string> {
    if (reviews.length === 0) return "";
    const prompt = `Summarize these sports venue reviews in 2-3 concise sentences. Focus on recurring themes about facilities, conditions, and crowd.

Reviews:
${reviews.slice(0, 10).map((r, i) => `${i + 1}. ${r}`).join("\n")}

Write only the summary, no preamble.`;

    const result = await this.model.generateContent(prompt);
    return result.response.text().trim();
  }

  async classifyReport(text: string): Promise<ReportClassification> {
    const prompt = `Classify this sports venue report into one of: CLOSED, FLOODED, UNSAFE, BROKEN_LIGHTS, RENOVATION, NO_WATER, OVERCROWDED, DAMAGED_SURFACE.
Report: "${text}"

Respond with JSON only: { "reportType": "TYPE", "confidence": 0.0-1.0 }`;

    const result = await this.model.generateContent(prompt);
    const json = this.extractJson(result.response.text());
    return json as ReportClassification;
  }

  async detectSpam(text: string): Promise<SpamVerdict> {
    const prompt = `Is this a spam/fake sports venue review? Respond with JSON only.
Text: "${text}"

{ "isSpam": true/false, "confidence": 0.0-1.0, "reason": "..." }`;

    const result = await this.model.generateContent(prompt);
    const json = this.extractJson(result.response.text());
    return json as SpamVerdict;
  }

  async analyzeSentiment(text: string): Promise<Sentiment> {
    const prompt = `Analyze sentiment of this text. Respond with JSON only.
Text: "${text}"

{ "label": "positive" | "negative" | "neutral", "score": 0.0-1.0 }`;

    const result = await this.model.generateContent(prompt);
    const json = this.extractJson(result.response.text());
    return json as Sentiment;
  }

  private extractJson(text: string): unknown {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON in AI response");
    return JSON.parse(match[0]);
  }
}
