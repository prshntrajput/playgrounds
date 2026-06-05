import { SupabaseClient } from "@supabase/supabase-js";
import { ReviewEntity, ReviewRepository } from "@playgrounds/core";
import { rowToReview, reviewToRow, ReviewRow } from "../mappers/review.mapper";

export class SupabaseReviewRepository implements ReviewRepository {
  constructor(private readonly db: SupabaseClient) {}

  async findByVenueId(venueId: string, limit = 50): Promise<ReviewEntity[]> {
    const { data, error } = await this.db
      .from("venue_reviews")
      .select("*")
      .eq("venue_id", venueId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data ?? []).map((row) => rowToReview(row as ReviewRow));
  }

  async findById(id: string): Promise<ReviewEntity | null> {
    const { data, error } = await this.db
      .from("venue_reviews")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) return null;
    return rowToReview(data as ReviewRow);
  }

  async save(review: ReviewEntity): Promise<ReviewEntity> {
    const row = reviewToRow(review);
    const { data, error } = await this.db
      .from("venue_reviews")
      .insert(row)
      .select()
      .single();

    if (error) throw error;
    return rowToReview(data as ReviewRow);
  }

  async countByVenueId(venueId: string): Promise<number> {
    const { count, error } = await this.db
      .from("venue_reviews")
      .select("id", { count: "exact", head: true })
      .eq("venue_id", venueId);

    if (error) throw error;
    return count ?? 0;
  }
}
