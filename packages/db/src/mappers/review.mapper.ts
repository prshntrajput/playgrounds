import { ReviewEntity } from "@playgrounds/core";

export interface ReviewRow {
  id: string;
  venue_id: string;
  user_id: string;
  rating: number;
  review: string;
  sentiment: string | null;
  issues: string[] | null;
  created_at: string;
}

export function rowToReview(row: ReviewRow): ReviewEntity {
  return ReviewEntity.create({
    id: row.id,
    venueId: row.venue_id,
    userId: row.user_id,
    rating: row.rating,
    review: row.review,
    sentiment: (row.sentiment as "positive" | "negative" | "neutral") ?? undefined,
    issues: row.issues ?? undefined,
    createdAt: new Date(row.created_at),
  });
}

export function reviewToRow(review: ReviewEntity): ReviewRow {
  return {
    id: review.id,
    venue_id: review.venueId,
    user_id: review.userId,
    rating: review.rating,
    review: review.review,
    sentiment: review.sentiment ?? null,
    issues: review.issues ?? null,
    created_at: review.createdAt.toISOString(),
  };
}
