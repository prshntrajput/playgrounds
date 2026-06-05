import { Amenity, SportType, VenueStatus } from "@playgrounds/shared";
import { VenueEntity } from "../../domain/venue/venue.entity";

export interface FindNearbyParams {
  lat: number;
  lng: number;
  radiusKm: number;
  sport?: SportType;
  status?: VenueStatus;
  amenities?: Amenity[];
  limit: number;
  offset: number;
}

export interface VenueRepository {
  findById(id: string): Promise<VenueEntity | null>;
  findNearby(params: FindNearbyParams): Promise<{ venues: VenueEntity[]; total: number }>;
  findByExternalRef(externalRef: string): Promise<VenueEntity | null>;
  findByExternalRefs(refs: string[]): Promise<Map<string, VenueEntity>>;
  save(venue: VenueEntity): Promise<VenueEntity>;
  update(venue: VenueEntity): Promise<VenueEntity>;
  delete(id: string): Promise<void>;
  findStaleForRecompute(staleBefore: Date, limit: number): Promise<VenueEntity[]>;
}
