import { z } from "zod";
import { SPORT_TYPE } from "../constants/sport-type";
import type { SportType } from "../constants/sport-type";
import { VENUE_STATUS } from "../constants/venue-status";
import type { VenueStatus } from "../constants/venue-status";
import { VENUE_SOURCE } from "../constants/venue-source";
import { AMENITY } from "../constants/amenity";
import type { Amenity } from "../constants/amenity";

const sportValues = Object.values(SPORT_TYPE) as [SportType, ...SportType[]];
const statusValues = Object.values(VENUE_STATUS) as [VenueStatus, ...VenueStatus[]];
const sourceValues = Object.values(VENUE_SOURCE) as [string, ...string[]];
const amenityValues = Object.values(AMENITY) as [Amenity, ...Amenity[]];

export const VenueSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200),
  type: z.enum(sportValues),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(statusValues),
  reliabilityScore: z.number().min(0).max(1),
  lastVerifiedAt: z.string().datetime().optional(),
  source: z.enum(sourceValues),
  externalRef: z.string().optional(),
  amenities: z.array(z.enum(amenityValues)),
  createdAt: z.string().datetime(),
});

export const VenueSearchRequestSchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radiusKm: z.coerce.number().min(0.1).max(50).default(5),
  sport: z.enum(sportValues).optional(),
  status: z.enum(statusValues).optional(),
  amenities: z.array(z.enum(amenityValues)).optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
});

export const VenueSearchResponseSchema = z.object({
  venues: z.array(VenueSchema),
  total: z.number(),
});

export type Venue = z.infer<typeof VenueSchema>;
export type VenueSearchRequest = z.infer<typeof VenueSearchRequestSchema>;
export type VenueSearchResponse = z.infer<typeof VenueSearchResponseSchema>;
