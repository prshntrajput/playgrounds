import { OsmDataSource } from "@playgrounds/db";
import { ImportFromSourceUseCase } from "@playgrounds/core";
import type { VenueRepository, CachePort } from "@playgrounds/core";

// Indian cities — tier-1 metros + tier-2 UP/regional cities
const INDIA_CITIES = [
  // ── Tier-1 metros ─────────────────────────────────────────────
  { name: "Delhi",        lat: 28.6139, lng: 77.2090, radiusKm: 35 },
  { name: "Mumbai",       lat: 19.0760, lng: 72.8777, radiusKm: 30 },
  { name: "Bangalore",    lat: 12.9716, lng: 77.5946, radiusKm: 30 },
  { name: "Hyderabad",    lat: 17.3850, lng: 78.4867, radiusKm: 30 },
  { name: "Chennai",      lat: 13.0827, lng: 80.2707, radiusKm: 30 },
  { name: "Kolkata",      lat: 22.5726, lng: 88.3639, radiusKm: 30 },
  { name: "Pune",         lat: 18.5204, lng: 73.8567, radiusKm: 25 },
  { name: "Ahmedabad",    lat: 23.0225, lng: 72.5714, radiusKm: 25 },
  { name: "Jaipur",       lat: 26.9124, lng: 75.7873, radiusKm: 25 },
  { name: "Surat",        lat: 21.1702, lng: 72.8311, radiusKm: 20 },
  { name: "Nagpur",       lat: 21.1458, lng: 79.0882, radiusKm: 20 },
  { name: "Indore",       lat: 22.7196, lng: 75.8577, radiusKm: 20 },
  { name: "Thane",        lat: 19.2183, lng: 72.9781, radiusKm: 20 },
  { name: "Bhopal",       lat: 23.2599, lng: 77.4126, radiusKm: 20 },
  { name: "Patna",        lat: 25.5941, lng: 85.1376, radiusKm: 20 },
  { name: "Vadodara",     lat: 22.3072, lng: 73.1812, radiusKm: 20 },
  { name: "Coimbatore",   lat: 11.0168, lng: 76.9558, radiusKm: 20 },
  { name: "Kochi",        lat:  9.9312, lng: 76.2673, radiusKm: 20 },

  // ── Uttar Pradesh (full coverage) ─────────────────────────────
  { name: "Lucknow",      lat: 26.8467, lng: 80.9462, radiusKm: 25 },
  { name: "Kanpur",       lat: 26.4499, lng: 80.3319, radiusKm: 20 },
  { name: "Agra",         lat: 27.1767, lng: 78.0081, radiusKm: 20 },
  { name: "Varanasi",     lat: 25.3176, lng: 82.9739, radiusKm: 20 },
  { name: "Prayagraj",    lat: 25.4358, lng: 81.8463, radiusKm: 20 },
  { name: "Meerut",       lat: 28.9845, lng: 77.7064, radiusKm: 20 },
  { name: "Bareilly",     lat: 28.3670, lng: 79.4304, radiusKm: 20 },
  { name: "Aligarh",      lat: 27.8974, lng: 78.0880, radiusKm: 15 },
  { name: "Moradabad",    lat: 28.8386, lng: 78.7733, radiusKm: 15 },
  { name: "Saharanpur",   lat: 29.9680, lng: 77.5510, radiusKm: 15 },
  { name: "Gorakhpur",    lat: 26.7606, lng: 83.3732, radiusKm: 15 },
  { name: "Noida",        lat: 28.5355, lng: 77.3910, radiusKm: 20 },
  { name: "Ghaziabad",    lat: 28.6692, lng: 77.4538, radiusKm: 15 },
  { name: "Mathura",      lat: 27.4924, lng: 77.6737, radiusKm: 15 },
  { name: "Budaun",       lat: 28.0375, lng: 79.1270, radiusKm: 15 },
  { name: "Shahjahanpur", lat: 27.8815, lng: 79.9130, radiusKm: 15 },
  { name: "Rampur",       lat: 28.8012, lng: 79.0268, radiusKm: 12 },
  { name: "Amroha",       lat: 28.9038, lng: 78.4678, radiusKm: 12 },

  // ── Other major state capitals ─────────────────────────────────
  { name: "Chandigarh",   lat: 30.7333, lng: 76.7794, radiusKm: 20 },
  { name: "Guwahati",     lat: 26.1445, lng: 91.7362, radiusKm: 20 },
  { name: "Bhubaneswar",  lat: 20.2961, lng: 85.8245, radiusKm: 20 },
  { name: "Ranchi",       lat: 23.3441, lng: 85.3096, radiusKm: 15 },
  { name: "Dehradun",     lat: 30.3165, lng: 78.0322, radiusKm: 15 },
  { name: "Jodhpur",      lat: 26.2389, lng: 73.0243, radiusKm: 15 },
  { name: "Ludhiana",     lat: 30.9010, lng: 75.8573, radiusKm: 15 },
  { name: "Amritsar",     lat: 31.6340, lng: 74.8723, radiusKm: 15 },
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
