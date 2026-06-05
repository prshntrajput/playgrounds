import { SpamDetectedError, VenueNotFoundError } from "../../../domain/errors";
import { ReviewEntity } from "../../../domain/review/review.entity";
import { AIProvider } from "../../ports/ai.provider";
import { ReviewRepository } from "../../ports/review.repository";
import { VenueRepository } from "../../ports/venue.repository";
import { RecomputeReliabilityUseCase } from "../venues/recompute-reliability.usecase";

export interface SubmitReviewInput {
  venueId: string;
  userId: string;
  rating: number;
  review: string;
}

export class SubmitReviewUseCase {
  constructor(
    private readonly venueRepository: VenueRepository,
    private readonly reviewRepository: ReviewRepository,
    private readonly aiProvider: AIProvider,
    private readonly recomputeReliability: RecomputeReliabilityUseCase
  ) {}

  async execute(input: SubmitReviewInput): Promise<ReviewEntity> {
    const venue = await this.venueRepository.findById(input.venueId);
    if (!venue) throw new VenueNotFoundError(input.venueId);

    const spam = await this.aiProvider.detectSpam(input.review);
    if (spam.isSpam) throw new SpamDetectedError(spam.reason);

    const analysis = await this.aiProvider.analyzeReview(input.review);

    const review = ReviewEntity.create({
      id: crypto.randomUUID(),
      venueId: input.venueId,
      userId: input.userId,
      rating: input.rating,
      review: input.review,
      sentiment: analysis.sentiment,
      issues: analysis.issues,
      createdAt: new Date(),
    });

    const saved = await this.reviewRepository.save(review);
    await this.recomputeReliability.execute(input.venueId);

    return saved;
  }
}
