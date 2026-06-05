import { OsmDataSource } from "@playgrounds/db";
import { ImportFromSourceUseCase } from "@playgrounds/core";
import type { VenueRepository, CachePort } from "@playgrounds/core";

// 20 major Indian cities — ordered by population so the most useful data comes first
const INDIA_CITIES = [
  { name: "Delhi",       lat: 28.6139, lng: 77.2090, radiusKm: 35 },
  { name: "Mumbai",      lat: 19.0760, lng: 72.8777, radiusKm: 30 },
  { name: "Bangalore",   lat: 12.9716, lng: 77.5946, radiusKm: 30 },
  { name: "Hyderabad",   lat: 17.3850, lng: 78.4867, radiusKm: 30 },
  { name: "Chennai",     lat: 13.0827, lng: 80.2707, radiusKm: 30 },
  { name: "Kolkata",     lat: 22.5726, lng: 88.3639, radiusKm: 30 },
  { name: "Pune",        lat: 18.5204, lng: 73.8567, radiusKm: 25 },
  { name: "Ahmedabad",   lat: 23.0225, lng: 72.5714, radiusKm: 25 },
  { name: "Jaipur",      lat: 26.9124, lng: 75.7873, radiusKm: 25 },
  { name: "Lucknow",     lat: 26.8467, lng: 80.9462, radiusKm: 25 },
  { name: "Surat",       lat: 21.1702, lng: 72.8311, radiusKm: 20 },
  { name: "Kanpur",      lat: 26.4499, lng: 80.3319, radiusKm: 20 },
  { name: "Nagpur",      lat: 21.1458, lng: 79.0882, radiusKm: 20 },
  { name: "Indore",      lat: 22.7196, lng: 75.8577, radiusKm: 20 },
  { name: "Thane",       lat: 19.2183, lng: 72.9781, radiusKm: 20 },
  { name: "Bhopal",      lat: 23.2599, lng: 77.4126, radiusKm: 20 },
  { name: "Patna",       lat: 25.5941, lng: 85.1376, radiusKm: 20 },
  { name: "Vadodara",    lat: 22.3072, lng: 73.1812, radiusKm: 20 },
  { name: "Coimbatore",  lat: 11.0168, lng: 76.9558, radiusKm: 20 },
  { name: "Kochi",       lat: 9.9312,  lng: 76.2673, radiusKm: 20 },
] as const;

const CITIES_PER_RUN = 2;
const PROGRESS_KEY = "osm:import:next_index";

export interface OsmImportResult {
  cities: string[];
  imported: number;
  updated: number;
  skipped: number;
}

/**
 * Imports CITIES_PER_RUN cities per call, rotating through INDIA_CITIES.
 * Progress is stored in KV so each cron invocation picks up where the last left off.
 */
export async function runOsmImport(
  venueRepository: VenueRepository,
  cache: CachePort
): Promise<OsmImportResult> {
  const osmSource = new OsmDataSource();
  const useCase = new ImportFromSourceUseCase(venueRepository, osmSource);

  const startIdx = (await cache.get<number>(PROGRESS_KEY)) ?? 0;
  const slice = INDIA_CITIES.slice(startIdx, startIdx + CITIES_PER_RUN);

  // If we've passed the end, reset to 0 and take from the top
  const citiesToRun = slice.length > 0
    ? slice
    : INDIA_CITIES.slice(0, CITIES_PER_RUN);

  const nextIdx = slice.length > 0
    ? (startIdx + CITIES_PER_RUN) % INDIA_CITIES.length
    : CITIES_PER_RUN % INDIA_CITIES.length;

  let totalImported = 0;
  let totalUpdated = 0;
  let totalSkipped = 0;
  const processedCities: string[] = [];

  for (const city of citiesToRun) {
    console.log(`[OSM] Importing ${city.name} (r=${city.radiusKm}km)…`);
    try {
      const result = await useCase.execute({ lat: city.lat, lng: city.lng, radiusKm: city.radiusKm });
      totalImported += result.imported;
      totalUpdated  += result.updated;
      totalSkipped  += result.skipped;
      processedCities.push(city.name);
      console.log(`[OSM] ${city.name}: +${result.imported} new, ${result.updated} updated, ${result.skipped} skipped`);
    } catch (err) {
      console.error(`[OSM] ${city.name} failed:`, err);
      processedCities.push(`${city.name} (failed)`);
    }
  }

  await cache.set(PROGRESS_KEY, nextIdx, 60 * 60 * 24 * 7); // keep for 7 days

  return {
    cities: processedCities,
    imported: totalImported,
    updated: totalUpdated,
    skipped: totalSkipped,
  };
}
