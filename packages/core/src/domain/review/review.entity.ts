export interface ReviewProps {
  id: string;
  venueId: string;
  userId: string;
  rating: number;
  review: string;
  sentiment?: "positive" | "negative" | "neutral";
  issues?: string[];
  createdAt: Date;
}

export class ReviewEntity {
  private constructor(private readonly props: ReviewProps) {}

  static create(props: ReviewProps): ReviewEntity {
    return new ReviewEntity(props);
  }

  get id() { return this.props.id; }
  get venueId() { return this.props.venueId; }
  get userId() { return this.props.userId; }
  get rating() { return this.props.rating; }
  get review() { return this.props.review; }
  get sentiment() { return this.props.sentiment; }
  get issues() { return this.props.issues; }
  get createdAt() { return this.props.createdAt; }
}
