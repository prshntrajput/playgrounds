export interface FavoriteRepository {
  findByUserId(userId: string): Promise<string[]>;
  isFavorite(userId: string, venueId: string): Promise<boolean>;
  add(userId: string, venueId: string): Promise<void>;
  remove(userId: string, venueId: string): Promise<void>;
}
