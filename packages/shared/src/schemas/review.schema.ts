import { z } from "zod";

export const ReviewSchema = z.object({
  id: z.string().uuid(),
  venueId: z.string().uuid(),
  userId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  review: z.string().min(1).max(2000),
  sentiment: z.enum(["positive", "negative", "neutral"]).optional(),
  issues: z.array(z.string()).optional(),
  createdAt: z.string().datetime(),
});

export const SubmitReviewRequestSchema = z.object({
  rating: z.number().int().min(1).max(5),
  review: z.string().min(10).max(2000),
});

export const ReviewListResponseSchema = z.object({
  reviews: z.array(ReviewSchema),
  total: z.number(),
});

export type Review = z.infer<typeof ReviewSchema>;
export type SubmitReviewRequest = z.infer<typeof SubmitReviewRequestSchema>;
export type ReviewListResponse = z.infer<typeof ReviewListResponseSchema>;
