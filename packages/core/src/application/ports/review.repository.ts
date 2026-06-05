import { ReviewEntity } from "../../domain/review/review.entity";

export interface ReviewRepository {
  findByVenueId(venueId: string, limit?: number): Promise<ReviewEntity[]>;
  findById(id: string): Promise<ReviewEntity | null>;
  save(review: ReviewEntity): Promise<ReviewEntity>;
  countByVenueId(venueId: string): Promise<number>;
}
