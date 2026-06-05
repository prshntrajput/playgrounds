import { DataSourcePort } from "../../ports/data-source.port";
import { VenueRepository } from "../../ports/venue.repository";

export interface ImportFromSourceInput {
  lat: number;
  lng: number;
  radiusKm: number;
}

export interface ImportFromSourceOutput {
  imported: number;
  updated: number;
  skipped: number;
}

export class ImportFromSourceUseCase {
  constructor(
    private readonly venueRepository: VenueRepository,
    private readonly source: DataSourcePort
  ) {}

  async execute(input: ImportFromSourceInput): Promise<ImportFromSourceOutput> {
    const venues = await this.source.fetchVenues(input);
    if (venues.length === 0) return { imported: 0, updated: 0, skipped: 0 };

    // Batch duplicate check — one query instead of N
    const withRef = venues.filter((v) => v.externalRef);
    const refs = withRef.map((v) => v.externalRef!);
    const existing = refs.length > 0
      ? await this.venueRepository.findByExternalRefs(refs)
      : new Map();

    let imported = 0;
    let updated = 0;
    let skipped = 0;

    for (const venue of venues) {
      try {
        if (venue.externalRef && existing.has(venue.externalRef)) {
          await this.venueRepository.update(venue);
          updated++;
        } else {
          await this.venueRepository.save(venue);
          imported++;
        }
      } catch {
        skipped++;
      }
    }

    return { imported, updated, skipped };
  }
}
