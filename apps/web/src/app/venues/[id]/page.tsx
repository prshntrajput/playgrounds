import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { apiClient } from "../../../lib/api-client";
import { StatusVoteBar } from "../../../features/venues/components/StatusVoteBar";
import { VenueQA } from "../../../features/venues/components/VenueQA";
import { ReviewForm } from "../../../features/reviews";
import { ReportButtons } from "../../../features/reports";
import { CrowdReportWidget } from "../../../features/crowd";
import type { CrowdLevel, Venue } from "@playgrounds/shared";

interface Props { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const { venue } = await apiClient.venues.getById(id);
    const v = venue as unknown as Venue;
    return {
      title: `${v.name} — Playgrounds AI`,
      description: v.description ?? `${v.type} venue in ${v.city}`,
    };
  } catch {
    return { title: "Venue — Playgrounds AI" };
  }
}

const SPORT_META: Record<string, { icon: string; color: string }> = {
  BASKETBALL:   { icon: "🏀", color: "#f97316" },
  FOOTBALL:     { icon: "⚽", color: "#22c55e" },
  CRICKET:      { icon: "🏏", color: "#3b82f6" },
  TENNIS:       { icon: "🎾", color: "#eab308" },
  BADMINTON:    { icon: "🏸", color: "#8b5cf6" },
  VOLLEYBALL:   { icon: "🏐", color: "#ec4899" },
  SWIMMING:     { icon: "🏊", color: "#06b6d4" },
  ATHLETICS:    { icon: "🏃", color: "#ef4444" },
  TABLE_TENNIS: { icon: "🏓", color: "#f59e0b" },
  MULTI:        { icon: "🏟", color: "#6366f1" },
};

const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
  OPEN:       { label: "Open",       color: "#22c55e", bg: "#22c55e15" },
  CLOSED:     { label: "Closed",     color: "#ef4444", bg: "#ef444415" },
  RENOVATION: { label: "Renovation", color: "#f59e0b", bg: "#f59e0b15" },
  UNKNOWN:    { label: "Unknown",    color: "#94a3b8", bg: "#94a3b815" },
};

const AMENITY_META: Record<string, { icon: string; label: string }> = {
  PARKING:          { icon: "🅿️", label: "Parking" },
  WASHROOM:         { icon: "🚻", label: "Washroom" },
  WATER:            { icon: "💧", label: "Water" },
  FLOODLIGHTS:      { icon: "💡", label: "Floodlights" },
  LOCKER_ROOM:      { icon: "🔐", label: "Locker Room" },
  SEATING:          { icon: "💺", label: "Seating" },
  CANTEEN:          { icon: "🍽️", label: "Canteen" },
  FIRST_AID:        { icon: "🩺", label: "First Aid" },
  WHEELCHAIR_ACCESS:{ icon: "♿", label: "Accessible" },
  WIFI:             { icon: "📶", label: "Wi-Fi" },
};

export default async function VenuePage({ params }: Props) {
  const { id } = await params;

  let data: Awaited<ReturnType<typeof apiClient.venues.getById>>;
  try { data = await apiClient.venues.getById(id); }
  catch { notFound(); }

  const venue = data.venue as unknown as Venue;
  const sport = SPORT_META[venue.type] ?? { icon: "📍", color: "#6366f1" };
  const status = STATUS_CFG[venue.status] ?? STATUS_CFG.UNKNOWN;
  const score = Math.round(venue.reliabilityScore * 100);
  const scoreColor = score >= 70 ? "#22c55e" : score >= 45 ? "#f59e0b" : "#ef4444";

  return (
    <div className="min-h-screen" style={{ background: "oklch(0.07 0.008 265)" }}>

      {/* ── Sticky header ────────────────────────────────────────── */}
      <div
        className="sticky top-0 z-20 px-4 py-3 border-b glass"
        style={{ borderColor: "oklch(0.22 0.010 248)", background: "oklch(0.09 0.009 266 / 0.92)" }}
      >
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs font-semibold rounded-full px-3 py-1.5 border transition-colors shrink-0"
            style={{ borderColor: "oklch(0.22 0.010 248)", color: "oklch(0.52 0.008 248)", background: "oklch(0.13 0.010 268)" }}
          >
            ← Map
          </Link>
          <div className="flex-1 min-w-0 text-center">
            <p className="text-sm font-bold text-foreground truncate">{venue.name}</p>
          </div>
          <div className="w-16 shrink-0" />
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">

        {/* ── Venue hero card ───────────────────────────────────── */}
        <div
          className="rounded-3xl border overflow-hidden"
          style={{ borderColor: "oklch(0.22 0.010 248)", background: "oklch(0.11 0.010 266)" }}
        >
          {/* Color accent strip */}
          <div className="h-1" style={{ background: `linear-gradient(90deg, ${sport.color}, ${sport.color}44)` }} />

          <div className="p-5">
            <div className="flex items-start gap-4">
              {/* Sport icon bubble */}
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 text-2xl"
                style={{ background: sport.color + "20", border: `1px solid ${sport.color}40` }}
              >
                {sport.icon}
              </div>

              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-extrabold text-foreground leading-tight">{venue.name}</h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {venue.type.replace(/_/g, " ")}
                  {venue.city && ` · ${venue.city}`}
                  {venue.country && `, ${venue.country}`}
                </p>
                {venue.address && (
                  <p className="text-xs mt-0.5" style={{ color: "oklch(0.40 0.008 248)" }}>{venue.address}</p>
                )}
              </div>
            </div>

            {/* Status + score row */}
            <div className="flex items-center gap-3 mt-4 pt-4" style={{ borderTop: "1px solid oklch(0.18 0.008 265)" }}>
              <span
                className="text-xs font-bold px-3 py-1 rounded-full border"
                style={{ color: status.color, background: status.bg, borderColor: status.color + "30" }}
              >
                {status.label}
              </span>

              {/* Reliability score */}
              <div className="flex-1 flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "oklch(0.18 0.008 265)" }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${score}%`, background: scoreColor }}
                  />
                </div>
                <span className="text-xs font-bold shrink-0" style={{ color: scoreColor }}>{score}%</span>
              </div>

              <span className="text-xs text-muted-foreground shrink-0">
                {data.reviewCount} review{data.reviewCount !== 1 ? "s" : ""}
              </span>
            </div>

            {venue.description && (
              <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{venue.description}</p>
            )}
          </div>
        </div>

        {/* ── Is it open? ───────────────────────────────────────── */}
        <StatusVoteBar venueId={venue.id} />

        {/* ── Crowd level ───────────────────────────────────────── */}
        <section
          className="rounded-3xl border p-5"
          style={{ borderColor: "oklch(0.22 0.010 248)", background: "oklch(0.11 0.010 266)" }}
        >
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
            Current crowd
          </h2>
          <CrowdReportWidget venueId={venue.id} currentLevel={data.crowdLevel as CrowdLevel | null} />
        </section>

        {/* ── Amenities ────────────────────────────────────────── */}
        {venue.amenities.length > 0 && (
          <section
            className="rounded-3xl border p-5"
            style={{ borderColor: "oklch(0.22 0.010 248)", background: "oklch(0.11 0.010 266)" }}
          >
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
              Amenities
            </h2>
            <div className="flex flex-wrap gap-2">
              {venue.amenities.map((a) => {
                const meta = AMENITY_META[a];
                return (
                  <span
                    key={a}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border"
                    style={{
                      background: "oklch(0.16 0.012 265)",
                      borderColor: "oklch(0.25 0.012 248)",
                      color: "oklch(0.75 0.010 248)",
                    }}
                  >
                    {meta?.icon ?? "•"} {meta?.label ?? a.replace(/_/g, " ")}
                  </span>
                );
              })}
            </div>
          </section>
        )}

        {/* ── AI Summary ───────────────────────────────────────── */}
        {data.aiSummary && (
          <section
            className="rounded-3xl border p-5"
            style={{
              background: "oklch(0.14 0.025 255)",
              borderColor: "oklch(0.6692 0.1607 245 / 0.2)",
            }}
          >
            <p
              className="text-xs font-bold uppercase tracking-widest mb-2"
              style={{ color: "oklch(0.6692 0.1607 245)" }}
            >
              ✨ AI Summary
            </p>
            <p className="text-sm text-foreground/80 leading-relaxed italic">{data.aiSummary}</p>
          </section>
        )}

        {/* ── Q&A ──────────────────────────────────────────────── */}
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 px-1">
            Community Q&amp;A
          </h2>
          <VenueQA venueId={venue.id} />
        </section>

        {/* ── Report ───────────────────────────────────────────── */}
        <section
          className="rounded-3xl border p-5"
          style={{ borderColor: "oklch(0.22 0.010 248)", background: "oklch(0.11 0.010 266)" }}
        >
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
            Report an issue
          </h2>
          <ReportButtons venueId={venue.id} />
        </section>

        {/* ── Review ───────────────────────────────────────────── */}
        <section
          className="rounded-3xl border p-5"
          style={{ borderColor: "oklch(0.22 0.010 248)", background: "oklch(0.11 0.010 266)" }}
        >
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
            Write a review
          </h2>
          <ReviewForm venueId={venue.id} />
        </section>

        <div className="h-6" />
      </div>
    </div>
  );
}
