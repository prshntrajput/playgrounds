import { apiClient } from "../../../lib/api-client";
import type { VenueSearchRequest, VenueSearchResponse } from "@playgrounds/shared";

export async function searchVenues(params: VenueSearchRequest): Promise<VenueSearchResponse> {
  return apiClient.venues.search(params);
}
