"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import type { Venue, SportType } from "@playgrounds/shared";
import { SPORT_TYPE } from "@playgrounds/shared";
import { useSearchVenues } from "../features/search";
import { UserMenu } from "../features/auth";

const VenueMap = dynamic(
  () => import("../features/map/components/VenueMap").then((m) => m.VenueMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full animate-pulse" style={{ background: "oklch(0.10 0.008 265)" }} />
    ),
  }
);

const DEFAULT_CENTER = { lat: 28.6139, lng: 77.209 };
const DEFAULT_RADIUS = 10;

const SPORT_PILLS = [
  { type: SPORT_TYPE.BASKETBALL,   label: "Basketball", icon: "🏀", accent: "#f97316" },
  { type: SPORT_TYPE.CRICKET,      label: "Cricket",    icon: "🏏", accent: "#3b82f6" },
  { type: SPORT_TYPE.FOOTBALL,     label: "Football",   icon: "⚽", accent: "#22c55e" },
  { type: SPORT_TYPE.TENNIS,       label: "Tennis",     icon: "🎾", accent: "#eab308" },
  { type: SPORT_TYPE.BADMINTON,    label: "Badminton",  icon: "🏸", accent: "#8b5cf6" },
  { type: SPORT_TYPE.VOLLEYBALL,   label: "Volleyball", icon: "🏐", accent: "#ec4899" },
  { type: SPORT_TYPE.SWIMMING,     label: "Swimming",   icon: "🏊", accent: "#06b6d4" },
  { type: SPORT_TYPE.MULTI,        label: "All Sports", icon: "🏟", accent: "#6366f1" },
] as const;

const STATUS_CFG: Record<string, { label: string; dot: string; text: string; bg: string }> = {
  OPEN:       { label: "Open",       dot: "#22c55e", text: "#22c55e", bg: "#22c55e18" },
  CLOSED:     { label: "Closed",     dot: "#ef4444", text: "#ef4444", bg: "#ef444418" },
  RENOVATION: { label: "Renovation", dot: "#f59e0b", text: "#f59e0b", bg: "#f59e0b18" },
  UNKNOWN:    { label: "Unknown",    dot: "#64748b", text: "#94a3b8", bg: "#64748b18" },
};

const AMENITY_ICON: Record<string, string> = {
  FLOODLIGHTS: "💡", PARKING: "🅿️", WASHROOM: "🚻", WATER: "💧",
  LOCKER_ROOM: "🔐", SEATING: "💺", CANTEEN: "🍽️", WIFI: "📶",
};

export default function HomePage() {
  const { venues, loading, error, search } = useSearchVenues();
  const [center, setCenter]               = useState(DEFAULT_CENTER);
  const [activeSport, setActiveSport]     = useState<SportType | undefined>();
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [locating, setLocating]           = useState(false);
  const [showList, setShowList]           = useState(false);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const runSearch = useCallback(
    (opts: { lat: number; lng: number; sport?: SportType; radiusKm?: number }) => {
      search({ lat: opts.lat, lng: opts.lng, radiusKm: opts.radiusKm ?? DEFAULT_RADIUS, sport: opts.sport, limit: 50, offset: 0 });
    },
    [search]
  );

  useEffect(() => { runSearch({ lat: DEFAULT_CENTER.lat, lng: DEFAULT_CENTER.lng }); }, []); // eslint-disable-line

  const handleLocateMe = useCallback(() => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCenter(loc);
        runSearch({ ...loc, sport: activeSport });
        setLocating(false);
      },
      () => setLocating(false),
      { timeout: 8000 }
    );
  }, [activeSport, runSearch]);

  const handleSportPill = useCallback((sport: SportType) => {
    const next = activeSport === sport ? undefined : sport;
    setActiveSport(next);
    runSearch({ lat: center.lat, lng: center.lng, sport: next });
    setShowList(false);
  }, [activeSport, center, runSearch]);

  const handleMarkerClick = useCallback((venue: Venue) => {
    setSelectedVenue(venue);
    cardRefs.current[venue.id]?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, []);

  const handleCardClick = useCallback((venue: Venue) => {
    setSelectedVenue(venue);
    setShowList(false);
  }, []);

  /* ── Venue list ─────────────────────────────────────────────── */
  const VenueList = (
    <div className="flex-1 overflow-y-auto no-scrollbar">
      {/* Skeletons */}
      {loading && (
        <div className="p-3 space-y-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <div key={n} className="h-[88px] rounded-2xl animate-pulse" style={{ background: "oklch(0.18 0.008 265)" }} />
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && venues.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center h-52 gap-3">
          <span className="text-5xl opacity-40">🗺️</span>
          <p className="text-sm text-muted-foreground">Tap a sport or use "Near me"</p>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <p className="p-4 text-sm text-destructive">{error}</p>
      )}

      {/* Cards */}
      {!loading && venues.length > 0 && (
        <div className="p-3 space-y-2">
          {venues.map((v) => {
            const isSelected = selectedVenue?.id === v.id;
            const pill = SPORT_PILLS.find((p) => p.type === v.type);
            const status = STATUS_CFG[v.status] ?? STATUS_CFG.UNKNOWN;
            const score = Math.round(v.reliabilityScore * 100);
            const scoreColor = score >= 70 ? "#22c55e" : score >= 45 ? "#f59e0b" : "#ef4444";

            return (
              <div
                key={v.id}
                ref={(el) => { cardRefs.current[v.id] = el; }}
                onClick={() => handleCardClick(v)}
                className="rounded-2xl border cursor-pointer transition-all duration-200"
                style={{
                  background: isSelected ? "oklch(0.16 0.018 265)" : "oklch(0.13 0.010 268)",
                  borderColor: isSelected ? "oklch(0.6692 0.1607 245 / 0.6)" : "oklch(0.22 0.010 248)",
                  boxShadow: isSelected
                    ? "0 0 0 1px oklch(0.6692 0.1607 245 / 0.3), 0 0 20px oklch(0.6692 0.1607 245 / 0.12)"
                    : "none",
                }}
              >
                <div className="p-3">
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground truncate leading-tight">{v.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {pill?.icon} {v.type.replace(/_/g, " ")}
                        {v.city ? ` · ${v.city}` : ""}
                      </p>
                    </div>
                    <span
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 border"
                      style={{ color: status.text, background: status.bg, borderColor: status.dot + "30" }}
                    >
                      {status.label}
                    </span>
                  </div>

                  {/* Bottom row */}
                  <div className="flex items-center justify-between gap-2">
                    {/* Amenity icons */}
                    <span className="text-xs text-muted-foreground/70">
                      {v.amenities.slice(0, 3).map((a) => AMENITY_ICON[a] ?? "").filter(Boolean).join(" ")}
                    </span>
                    <Link
                      href={`/venues/${v.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs font-semibold shrink-0 transition-colors"
                      style={{ color: "oklch(0.6692 0.1607 245)" }}
                    >
                      Details →
                    </Link>
                  </div>

                  {/* Reliability bar */}
                  <div className="mt-2.5 flex items-center gap-2">
                    <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "oklch(0.18 0.008 265)" }}>
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${score}%`, background: scoreColor }}
                      />
                    </div>
                    <span className="text-[10px] font-semibold shrink-0" style={{ color: scoreColor }}>{score}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-background">

      {/* ── Header ────────────────────────────────────────────────── */}
      <header
        className="flex items-center justify-between px-4 py-3 shrink-0 z-20 border-b"
        style={{ borderColor: "oklch(0.22 0.010 248)", background: "oklch(0.09 0.009 266 / 0.95)" }}
      >
        <div className="flex items-center gap-2.5">
          <span className="text-xl leading-none">🏟</span>
          <span className="font-extrabold text-base tracking-tight text-foreground">
            Playgrounds{" "}
            <span style={{ color: "oklch(0.6692 0.1607 245)" }}>AI</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleLocateMe}
            disabled={locating}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full border transition-all disabled:opacity-50"
            style={{
              borderColor: "oklch(0.22 0.010 248)",
              background: "oklch(0.13 0.010 268)",
              color: "oklch(0.6692 0.1607 245)",
            }}
          >
            {locating ? "⏳ Locating…" : "📍 Near me"}
          </button>
          <UserMenu />
        </div>
      </header>

      {/* ── Sport pills ───────────────────────────────────────────── */}
      <div
        className="flex gap-2 px-4 py-2.5 overflow-x-auto no-scrollbar shrink-0 z-20 border-b"
        style={{ borderColor: "oklch(0.22 0.010 248)", background: "oklch(0.09 0.009 266 / 0.95)" }}
      >
        {SPORT_PILLS.map(({ type, label, icon, accent }) => {
          const active = activeSport === type;
          return (
            <button
              key={type}
              onClick={() => handleSportPill(type)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 shrink-0 border"
              style={
                active
                  ? {
                      background: accent + "22",
                      borderColor: accent + "66",
                      color: accent,
                      boxShadow: `0 0 12px ${accent}33`,
                    }
                  : {
                      background: "oklch(0.13 0.010 268)",
                      borderColor: "oklch(0.22 0.010 248)",
                      color: "oklch(0.52 0.008 248)",
                    }
              }
            >
              <span>{icon}</span>
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      {/* ══════════════════════════════════════════════════════════
          MOBILE  (< sm)
      ═══════════════════════════════════════════════════════════ */}
      <div className="sm:hidden flex-1 relative overflow-hidden">
        {/* Full-screen map */}
        <div className="absolute inset-0">
          <VenueMap
            venues={venues}
            center={center}
            selectedId={selectedVenue?.id}
            onMarkerClick={handleMarkerClick}
          />
        </div>

        {/* Loading pill */}
        {loading && (
          <div
            className="absolute top-3 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-xs font-semibold z-10 border"
            style={{
              background: "oklch(0.13 0.010 268 / 0.95)",
              borderColor: "oklch(0.6692 0.1607 245 / 0.4)",
              color: "oklch(0.6692 0.1607 245)",
            }}
          >
            Searching…
          </div>
        )}

        {/* Bottom sheet */}
        <div
          className="absolute inset-x-0 bottom-0 rounded-t-3xl transition-transform duration-300 z-10 flex flex-col border-t"
          style={{
            maxHeight: "75vh",
            transform: showList ? "translateY(0)" : "translateY(calc(100% - 60px))",
            background: "oklch(0.11 0.009 266 / 0.97)",
            borderColor: "oklch(0.22 0.010 248)",
            boxShadow: "0 -8px 40px rgba(0,0,0,0.6)",
          }}
        >
          {/* Handle */}
          <div
            className="flex items-center justify-between px-4 py-3 cursor-pointer shrink-0 border-b"
            style={{ borderColor: "oklch(0.22 0.010 248 / 0.5)" }}
            onClick={() => setShowList((v) => !v)}
          >
            <div className="w-10 h-1 rounded-full mx-auto" style={{ background: "oklch(0.30 0.010 248)" }} />
            <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1.5">
              {loading ? (
                <span className="text-xs text-muted-foreground">Searching…</span>
              ) : (
                <span className="text-xs font-bold text-foreground">
                  {venues.length > 0
                    ? `${venues.length} venue${venues.length !== 1 ? "s" : ""} ${showList ? "▼" : "▲"}`
                    : "No venues found"}
                </span>
              )}
            </div>
            {showList && (
              <button
                onClick={(e) => { e.stopPropagation(); setShowList(false); }}
                className="text-xs font-semibold ml-auto"
                style={{ color: "oklch(0.6692 0.1607 245)" }}
              >
                Map
              </button>
            )}
          </div>

          {showList && VenueList}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          DESKTOP  (≥ sm)
      ═══════════════════════════════════════════════════════════ */}
      <div className="hidden sm:flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside
          className="w-80 lg:w-96 shrink-0 flex flex-col border-r overflow-hidden"
          style={{ borderColor: "oklch(0.22 0.010 248)", background: "oklch(0.09 0.009 266)" }}
        >
          {/* Sidebar header */}
          <div
            className="px-4 py-2.5 border-b shrink-0"
            style={{ borderColor: "oklch(0.22 0.010 248 / 0.6)" }}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: "oklch(0.6692 0.1607 245)" }} />
                <p className="text-xs text-muted-foreground">Searching…</p>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                {venues.length > 0
                  ? `${venues.length} venue${venues.length !== 1 ? "s" : ""}${
                      activeSport
                        ? ` · ${SPORT_PILLS.find((p) => p.type === activeSport)?.icon} ${SPORT_PILLS.find((p) => p.type === activeSport)?.label}`
                        : ""
                    }`
                  : "No venues — try a different sport or location"}
              </p>
            )}
          </div>
          {VenueList}
        </aside>

        {/* Map */}
        <main className="flex-1 relative">
          <VenueMap
            venues={venues}
            center={center}
            selectedId={selectedVenue?.id}
            onMarkerClick={handleMarkerClick}
          />
        </main>
      </div>
    </div>
  );
}
