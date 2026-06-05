import { CrowdLevel } from "@playgrounds/shared";
import { VenueNotFoundError } from "../../../domain/errors";
import { CachePort } from "../../ports/cache.port";
import { CrowdRepository } from "../../ports/crowd.repository";
import { VenueRepository } from "../../ports/venue.repository";

export interface ReportCrowdInput {
  venueId: string;
  userId: string;
  level: CrowdLevel;
}

export class ReportCrowdUseCase {
  constructor(
    private readonly venueRepository: VenueRepository,
    private readonly crowdRepository: CrowdRepository,
    private readonly cache: CachePort
  ) {}

  async execute(input: ReportCrowdInput): Promise<void> {
    const venue = await this.venueRepository.findById(input.venueId);
    if (!venue) throw new VenueNotFoundError(input.venueId);

    await this.crowdRepository.save({
      venueId: input.venueId,
      userId: input.userId,
      level: input.level,
    });

    await this.cache.delete(`venue:${input.venueId}`);
  }
}
