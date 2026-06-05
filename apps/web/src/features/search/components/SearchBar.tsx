"use client";

import { useState } from "react";
import { SPORT_TYPE } from "@playgrounds/shared";

interface SearchBarProps {
  onSearch: (query: { sport?: string; radiusKm: number }) => void;
  loading?: boolean;
}

export function SearchBar({ onSearch, loading }: SearchBarProps) {
  const [sport, setSport] = useState<string>("");
  const [radius, setRadius] = useState(5);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({ sport: sport || undefined, radiusKm: radius });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
      <select
        value={sport}
        onChange={(e) => setSport(e.target.value)}
        className="rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      >
        <option value="">All sports</option>
        {Object.values(SPORT_TYPE).map((s) => (
          <option key={s} value={s}>
            {s.replace(/_/g, " ")}
          </option>
        ))}
      </select>

      <select
        value={radius}
        onChange={(e) => setRadius(Number(e.target.value))}
        className="rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      >
        {[1, 2, 5, 10, 20].map((r) => (
          <option key={r} value={r}>
            {r} km
          </option>
        ))}
      </select>

      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
      >
        {loading ? "Searching..." : "Search nearby"}
      </button>
    </form>
  );
}
