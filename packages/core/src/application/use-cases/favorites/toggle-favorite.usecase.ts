import { VenueNotFoundError } from "../../../domain/errors";
import { FavoriteRepository } from "../../ports/favorite.repository";
import { VenueRepository } from "../../ports/venue.repository";

export interface ToggleFavoriteOutput {
  isFavorite: boolean;
}

export class ToggleFavoriteUseCase {
  constructor(
    private readonly venueRepository: VenueRepository,
    private readonly favoriteRepository: FavoriteRepository
  ) {}

  async execute(userId: string, venueId: string): Promise<ToggleFavoriteOutput> {
    const venue = await this.venueRepository.findById(venueId);
    if (!venue) throw new VenueNotFoundError(venueId);

    const already = await this.favoriteRepository.isFavorite(userId, venueId);

    if (already) {
      await this.favoriteRepository.remove(userId, venueId);
      return { isFavorite: false };
    } else {
      await this.favoriteRepository.add(userId, venueId);
      return { isFavorite: true };
    }
  }
}
