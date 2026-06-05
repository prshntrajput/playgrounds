import { Amenity, CACHE_TTL_SECONDS, SportType, VenueStatus } from "@playgrounds/shared";
import { VenueEntity } from "../../../domain/venue/venue.entity";
import { CachePort } from "../../ports/cache.port";
import { FindNearbyParams, VenueRepository } from "../../ports/venue.repository";

export interface SearchVenuesInput {
  lat: number;
  lng: number;
  radiusKm: number;
  sport?: SportType;
  status?: VenueStatus;
  amenities?: Amenity[];
  limit: number;
  offset: number;
}

export interface SearchVenuesOutput {
  venues: VenueEntity[];
  total: number;
}

export class SearchVenuesUseCase {
  constructor(
    private readonly venueRepository: VenueRepository,
    private readonly cache: CachePort
  ) {}

  async execute(input: SearchVenuesInput): Promise<SearchVenuesOutput> {
    const cacheKey = `search:${JSON.stringify(input)}`;
    const cached = await this.cache.get<SearchVenuesOutput>(cacheKey);
    if (cached) return cached;

    const params: FindNearbyParams = {
      lat: input.lat,
      lng: input.lng,
      radiusKm: input.radiusKm,
      sport: input.sport,
      status: input.status,
      amenities: input.amenities,
      limit: input.limit,
      offset: input.offset,
    };

    const result = await this.venueRepository.findNearby(params);

    await this.cache.set(cacheKey, result, CACHE_TTL_SECONDS);
    return result;
  }
}
