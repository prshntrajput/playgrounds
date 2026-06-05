import { z } from "zod";
import { SPORT_TYPE } from "../constants/sport-type";
import type { SportType } from "../constants/sport-type";
import { AMENITY } from "../constants/amenity";
import type { Amenity } from "../constants/amenity";

const sportValues  = Object.values(SPORT_TYPE)  as [SportType,  ...SportType[]];
const amenityValues = Object.values(AMENITY) as [Amenity, ...Amenity[]];

export const VenueSubmitSchema = z.object({
  // Who is submitting
  ownerName:       z.string().min(2).max(100),
  ownerEmail:      z.string().email(),
  contactPhone:    z.string().max(20).optional(),
  contactWhatsapp: z.string().max(20).optional(),

  // Claiming an existing venue? Set venueId. Otherwise null.
  venueId: z.string().uuid().optional(),

  // New venue details (required when venueId is absent)
  name:          z.string().min(2).max(200).optional(),
  type:          z.enum(sportValues).optional(),
  address:       z.string().max(400).optional(),
  city:          z.string().max(100).optional(),
  country:       z.string().max(100).optional(),
  latitude:      z.number().min(-90).max(90).optional(),
  longitude:     z.number().min(-180).max(180).optional(),
  description:   z.string().max(2000).optional(),
  openingHours:  z.string().max(300).optional(),
  pricePerHour:  z.number().min(0).max(100000).optional(),
  amenities:     z.array(z.enum(amenityValues)).default([]),

  // Proof of ownership text (for claims)
  proofText: z.string().max(2000).optional(),
}).refine(
  (d) => d.venueId || (d.name && d.type && (d.address || d.city)),
  { message: "Provide either venueId (to claim) or name + type + location (to list new venue)" }
);

export const VenueSubmitResponseSchema = z.object({
  id:      z.string().uuid(),
  status:  z.literal("PENDING"),
  message: z.string(),
});

export type VenueSubmitRequest  = z.infer<typeof VenueSubmitSchema>;
export type VenueSubmitResponse = z.infer<typeof VenueSubmitResponseSchema>;
