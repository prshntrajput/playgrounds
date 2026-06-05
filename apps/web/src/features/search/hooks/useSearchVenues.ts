"use client";

import { useState, useCallback } from "react";
import type { Venue, VenueSearchRequest } from "@playgrounds/shared";
import { searchVenues } from "../api/searchVenues";

export function useSearchVenues() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (params: VenueSearchRequest) => {
    setLoading(true);
    setError(null);
    try {
      const result = await searchVenues(params);
      setVenues(result.venues as unknown as Venue[]);
      setTotal(result.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }, []);

  return { venues, total, loading, error, search };
}
