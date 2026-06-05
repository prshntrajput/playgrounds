import { Amenity, SportType, VenueSource, VenueStatus } from "@playgrounds/shared";

export interface VenueProps {
  id: string;
  name: string;
  type: SportType;
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  country?: string;
  description?: string;
  status: VenueStatus;
  reliabilityScore: number;
  lastVerifiedAt?: Date;
  source: VenueSource;
  externalRef?: string;
  amenities: Amenity[];
  createdAt: Date;
}

export class VenueEntity {
  private constructor(private readonly props: VenueProps) {}

  static create(props: VenueProps): VenueEntity {
    return new VenueEntity(props);
  }

  get id() { return this.props.id; }
  get name() { return this.props.name; }
  get type() { return this.props.type; }
  get latitude() { return this.props.latitude; }
  get longitude() { return this.props.longitude; }
  get address() { return this.props.address; }
  get city() { return this.props.city; }
  get country() { return this.props.country; }
  get description() { return this.props.description; }
  get status() { return this.props.status; }
  get reliabilityScore() { return this.props.reliabilityScore; }
  get lastVerifiedAt() { return this.props.lastVerifiedAt; }
  get source() { return this.props.source; }
  get externalRef() { return this.props.externalRef; }
  get amenities() { return this.props.amenities; }
  get createdAt() { return this.props.createdAt; }

  withReliabilityScore(score: number): VenueEntity {
    return new VenueEntity({ ...this.props, reliabilityScore: score });
  }

  withStatus(status: VenueStatus): VenueEntity {
    return new VenueEntity({ ...this.props, status });
  }

  toJSON() {
    return {
      id: this.props.id,
      name: this.props.name,
      type: this.props.type,
      latitude: this.props.latitude,
      longitude: this.props.longitude,
      address: this.props.address,
      city: this.props.city,
      country: this.props.country,
      description: this.props.description,
      status: this.props.status,
      reliabilityScore: this.props.reliabilityScore,
      lastVerifiedAt: this.props.lastVerifiedAt?.toISOString() ?? null,
      source: this.props.source,
      externalRef: this.props.externalRef,
      amenities: this.props.amenities,
      createdAt: this.props.createdAt.toISOString(),
    };
  }
}
