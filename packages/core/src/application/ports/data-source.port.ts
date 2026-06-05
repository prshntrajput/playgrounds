import { VenueEntity } from "../../domain/venue/venue.entity";

export interface DataSourcePort {
  readonly name: string;
  fetchVenues(region: { lat: number; lng: number; radiusKm: number }): Promise<VenueEntity[]>;
}
