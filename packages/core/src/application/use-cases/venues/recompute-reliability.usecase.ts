import { VENUE_SOURCE } from "@playgrounds/shared";
import { VenueNotFoundError } from "../../../domain/errors";
import { ReliabilityEngine } from "../../../domain/venue/reliability/reliability-engine";
import { VenueSignalContext } from "../../../domain/venue/reliability/reliability-signal";
import { CachePort } from "../../ports/cache.port";
import { CrowdRepository } from "../../ports/crowd.repository";
import { ReportRepository } from "../../ports/report.repository";
import { ReviewRepository } from "../../ports/review.repository";
import { VenueRepository } from "../../ports/venue.repository";

export class RecomputeReliabilityUseCase {
  constructor(
    private readonly venueRepository: VenueRepository,
    private readonly reviewRepository: ReviewRepository,
    private readonly reportRepository: ReportRepository,
    private readonly crowdRepository: CrowdRepository,
    private readonly engine: ReliabilityEngine,
    private readonly cache: CachePort
  ) {}

  async execute(venueId: string): Promise<number> {
    const venue = await this.venueRepository.findById(venueId);
    if (!venue) throw new VenueNotFoundError(venueId);

    const [reviews, reports, crowdReports] = await Promise.all([
      this.reviewRepository.findByVenueId(venueId),
      this.reportRepository.findByVenueId(venueId),
      this.crowdRepository.findRecentByVenueId(venueId, 24),
    ]);

    const ctx: VenueSignalContext = {
      venueId,
      status: venue.status,
      reviews: reviews.map((r) => ({
        rating: r.rating,
        sentiment: r.sentiment,
        issues: r.issues,
        createdAt: r.createdAt,
      })),
      reports: reports.map((r) => ({
        type: r.reportType,
        createdAt: r.createdAt,
      })),
      photos: [],
      crowdReports: crowdReports.map((c) => ({
        level: c.level,
        createdAt: c.createdAt,
      })),
      hasOfficialData: venue.source === VENUE_SOURCE.OFFICIAL,
      communityVerifications: reviews.length + reports.length,
      lastVerifiedAt: venue.lastVerifiedAt,
    };

    const score = this.engine.evaluate(ctx);
    const updated = venue.withReliabilityScore(score.asUnit());
    await this.venueRepository.update(updated);

    await this.cache.delete(`venue:${venueId}`);

    return score.asUnit();
  }
}
