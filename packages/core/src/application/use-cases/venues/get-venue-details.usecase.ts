import { CACHE_TTL_SECONDS, CROWD_DECAY_HOURS } from "@playgrounds/shared";
import { CrowdEngine } from "../../../domain/crowd/crowd-engine";
import { VenueNotFoundError } from "../../../domain/errors";
import { VenueEntity } from "../../../domain/venue/venue.entity";
import { AIProvider } from "../../ports/ai.provider";
import { CachePort } from "../../ports/cache.port";
import { CrowdRepository } from "../../ports/crowd.repository";
import { ReviewRepository } from "../../ports/review.repository";
import { VenueRepository } from "../../ports/venue.repository";
import { CrowdLevel } from "@playgrounds/shared";

export interface VenueDetailsOutput {
  venue: VenueEntity;
  reviewCount: number;
  crowdLevel: CrowdLevel | null;
  aiSummary: string | null;
}

export class GetVenueDetailsUseCase {
  private readonly crowdEngine = new CrowdEngine();

  constructor(
    private readonly venueRepository: VenueRepository,
    private readonly reviewRepository: ReviewRepository,
    private readonly crowdRepository: CrowdRepository,
    private readonly aiProvider: AIProvider,
    private readonly cache: CachePort
  ) {}

  async execute(venueId: string): Promise<VenueDetailsOutput> {
    const cacheKey = `venue:${venueId}`;
    const cached = await this.cache.get<VenueDetailsOutput>(cacheKey);
    if (cached) return cached;

    const venue = await this.venueRepository.findById(venueId);
    if (!venue) throw new VenueNotFoundError(venueId);

    const [reviews, crowdReports, reviewCount] = await Promise.all([
      this.reviewRepository.findByVenueId(venueId, 20),
      this.crowdRepository.findRecentByVenueId(venueId, CROWD_DECAY_HOURS * 4),
      this.reviewRepository.countByVenueId(venueId),
    ]);

    const crowdLevel = this.crowdEngine.evaluate(crowdReports);

    let aiSummary: string | null = null;
    if (reviews.length > 0) {
      try {
        aiSummary = await this.aiProvider.summarizeReviews(
          reviews.map((r) => r.review)
        );
      } catch {
        // AI summary is non-critical — degrade gracefully
      }
    }

    const result: VenueDetailsOutput = { venue, reviewCount, crowdLevel, aiSummary };
    await this.cache.set(cacheKey, result, CACHE_TTL_SECONDS);
    return result;
  }
}
