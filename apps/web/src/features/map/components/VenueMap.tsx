"use client";

import { useEffect, useRef } from "react";
import type { Venue } from "@playgrounds/shared";

const SPORT_META: Record<string, { color: string; icon: string }> = {
  BASKETBALL:   { color: "#f97316", icon: "🏀" },
  FOOTBALL:     { color: "#22c55e", icon: "⚽" },
  CRICKET:      { color: "#3b82f6", icon: "🏏" },
  TENNIS:       { color: "#eab308", icon: "🎾" },
  BADMINTON:    { color: "#8b5cf6", icon: "🏸" },
  VOLLEYBALL:   { color: "#ec4899", icon: "🏐" },
  SWIMMING:     { color: "#06b6d4", icon: "🏊" },
  ATHLETICS:    { color: "#ef4444", icon: "🏃" },
  TABLE_TENNIS: { color: "#f59e0b", icon: "🏓" },
  MULTI:        { color: "#6366f1", icon: "🏟" },
};

interface VenueMapProps {
  venues: Venue[];
  center: { lat: number; lng: number };
  selectedId?: string | null;
  onMarkerClick?: (venue: Venue) => void;
}

function makePin(color: string, icon: string, selected = false): string {
  const size   = selected ? 40 : 32;
  const border = selected ? 3 : 2;
  const shadow = selected
    ? "0 4px 16px rgba(0,0,0,0.45)"
    : "0 2px 8px rgba(0,0,0,0.28)";
  return `<div style="
    background:${color};
    width:${size}px;height:${size}px;
    border-radius:50% 50% 50% 0;
    transform:rotate(-45deg);
    border:${border}px solid white;
    box-shadow:${shadow};
    display:flex;align-items:center;justify-content:center;
  ">
    <span style="transform:rotate(45deg);font-size:${selected ? 18 : 14}px;display:block;text-align:center;line-height:${size - border * 2}px;">${icon}</span>
  </div>`;
}

export function VenueMap({ venues, center, selectedId, onMarkerClick }: VenueMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<import("leaflet").Map | null>(null);
  const markersRef   = useRef<Map<string, import("leaflet").Marker>>(new Map());
  const leafletRef   = useRef<typeof import("leaflet") | null>(null);

  // ── init map once ──────────────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // cancelled is a local closure flag — set synchronously in cleanup
    // so the async init bails out if Strict Mode fires the effect twice
    let cancelled = false;

    (async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");

      // By the time imports finish, Strict-Mode cleanup may have run
      if (cancelled) return;

      leafletRef.current = L;
      const map = L.map(el, { zoomControl: true }).setView([center.lat, center.lng], 13);
      mapRef.current = map;

      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        {
          attribution:
            '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: "abcd",
          maxZoom: 20,
        }
      ).addTo(map);
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      leafletRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── update markers when venues change ─────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    const L   = leafletRef.current;
    if (!map || !L) {
      // Map not ready yet — retry once it is
      const timer = setTimeout(() => {
        const m = mapRef.current, l = leafletRef.current;
        if (m && l) renderMarkers(m, l);
      }, 500);
      return () => clearTimeout(timer);
    }
    renderMarkers(map, L);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [venues, selectedId]);

  function renderMarkers(map: import("leaflet").Map, L: typeof import("leaflet")) {
    // Remove old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current.clear();

    if (!venues.length) return;

    for (const venue of venues) {
      const meta   = SPORT_META[venue.type] ?? { color: "#6366f1", icon: "📍" };
      const isSelected = venue.id === selectedId;
      const size   = isSelected ? 40 : 32;

      const marker = L.marker([venue.latitude, venue.longitude], {
        icon: L.divIcon({
          className: "",
          html:       makePin(meta.color, meta.icon, isSelected),
          iconSize:   [size, size],
          iconAnchor: [size / 2, size],
          popupAnchor:[0, -(size + 4)],
        }),
        zIndexOffset: isSelected ? 1000 : 0,
      }).addTo(map);

      const statusColor =
        venue.status === "OPEN"       ? "#16a34a" :
        venue.status === "CLOSED"     ? "#dc2626" :
        venue.status === "RENOVATION" ? "#d97706" : "#6b7280";

      marker.bindPopup(`
        <div style="padding:14px 16px;min-width:190px;font-family:var(--font-sans,'Open Sans',system-ui,sans-serif)">
          <div style="font-weight:700;font-size:13px;color:#e2e8f0;margin-bottom:3px;line-height:1.3">${venue.name}</div>
          <div style="color:#64748b;font-size:11px;margin-bottom:8px">${meta.icon} ${venue.type.replace(/_/g, " ")}${venue.city ? " · " + venue.city : ""}</div>
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:10px">
            <span style="background:${statusColor}22;color:${statusColor};font-size:10px;font-weight:600;padding:2px 8px;border-radius:999px;border:1px solid ${statusColor}44">${venue.status}</span>
          </div>
          <a href="/venues/${venue.id}"
             style="display:block;text-align:center;padding:7px 12px;background:oklch(0.6692 0.1607 245);color:white;border-radius:10px;font-size:11px;font-weight:600;text-decoration:none;letter-spacing:0.01em">
            View details →
          </a>
        </div>
      `, { maxWidth: 260 });

      marker.on("click", () => {
        marker.openPopup();
        onMarkerClick?.(venue);
      });

      markersRef.current.set(venue.id, marker);
    }

    // Fit map to show all pins
    if (venues.length === 1) {
      map.setView([venues[0].latitude, venues[0].longitude], 15);
    } else if (venues.length > 1) {
      const bounds = L.latLngBounds(venues.map((v) => [v.latitude, v.longitude]));
      map.fitBounds(bounds, { padding: [48, 48], maxZoom: 15 });
    }
  }

  // ── pan to selected venue ──────────────────────────────────────
  useEffect(() => {
    if (!selectedId || !mapRef.current) return;
    const marker = markersRef.current.get(selectedId);
    if (marker) {
      mapRef.current.panTo(marker.getLatLng(), { animate: true });
      marker.openPopup();
    }
  }, [selectedId]);

  // ── pan to center when no venues ──────────────────────────────
  useEffect(() => {
    if (!mapRef.current || venues.length > 0) return;
    mapRef.current.setView([center.lat, center.lng], 13, { animate: true });
  }, [center.lat, center.lng, venues.length]);

  return <div ref={containerRef} className="w-full h-full min-h-[400px]" />;
}
