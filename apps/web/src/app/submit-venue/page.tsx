"use client";

import { useState, useCallback, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { SPORT_TYPE, AMENITY } from "@playgrounds/shared";
import { createSupabaseBrowserClient } from "../../lib/supabase-browser";

/* ── Constants ──────────────────────────────────────────────────── */
const SPORT_OPTIONS = [
  { value: SPORT_TYPE.CRICKET,      label: "Cricket",       icon: "🏏" },
  { value: SPORT_TYPE.FOOTBALL,     label: "Football",      icon: "⚽" },
  { value: SPORT_TYPE.BASKETBALL,   label: "Basketball",    icon: "🏀" },
  { value: SPORT_TYPE.BADMINTON,    label: "Badminton",     icon: "🏸" },
  { value: SPORT_TYPE.TENNIS,       label: "Tennis",        icon: "🎾" },
  { value: SPORT_TYPE.VOLLEYBALL,   label: "Volleyball",    icon: "🏐" },
  { value: SPORT_TYPE.TABLE_TENNIS, label: "Table Tennis",  icon: "🏓" },
  { value: SPORT_TYPE.SWIMMING,     label: "Swimming",      icon: "🏊" },
  { value: SPORT_TYPE.ATHLETICS,    label: "Athletics",     icon: "🏃" },
  { value: SPORT_TYPE.MULTI,        label: "Multi-Sport",   icon: "🏟" },
];

const AMENITY_OPTIONS = [
  { value: AMENITY.FLOODLIGHTS, label: "Floodlights",   icon: "💡" },
  { value: AMENITY.PARKING,     label: "Parking",        icon: "🅿️" },
  { value: AMENITY.WASHROOM,    label: "Washroom",       icon: "🚻" },
  { value: AMENITY.WATER,       label: "Water",          icon: "💧" },
  { value: AMENITY.LOCKER_ROOM, label: "Locker Room",    icon: "🔐" },
  { value: AMENITY.SEATING,     label: "Seating",        icon: "💺" },
  { value: AMENITY.CANTEEN,     label: "Canteen",        icon: "🍽️" },
  { value: AMENITY.WIFI,        label: "WiFi",           icon: "📶" },
];

const SPORT_ICON: Record<string, string> = Object.fromEntries(SPORT_OPTIONS.map(s => [s.value, s.icon]));

type Mode = "new" | "claim";

interface ClaimedVenue { id: string; name: string; type: string; city?: string | null }

/* ── Shared styles ──────────────────────────────────────────────── */
const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  background: "oklch(0.14 0.010 265)",
  border: "1px solid oklch(0.24 0.010 248)",
  borderRadius: "12px",
  color: "oklch(0.92 0.004 247)",
  fontSize: "14px",
  outline: "none",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "11px",
  fontWeight: 700,
  color: "oklch(0.60 0.008 248)",
  marginBottom: "6px",
  letterSpacing: "0.05em",
  textTransform: "uppercase",
};

/* ── Venue search component for claim mode ──────────────────────── */
function VenueSearch({ onSelect }: { onSelect: (v: ClaimedVenue) => void }) {
  const [query, setQuery]     = useState("");
  const [results, setResults] = useState<ClaimedVenue[]>([]);
  const [loading, setLoading] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback((q: string) => {
    if (q.trim().length < 2) { setResults([]); return; }
    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    supabase
      .from("venues")
      .select("id, name, type, city")
      .ilike("name", `%${q.trim()}%`)
      .limit(8)
      .then(({ data }) => {
        setResults((data ?? []) as ClaimedVenue[]);
        setLoading(false);
      });
  }, []);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => search(val), 300);
  };

  return (
    <div className="relative">
      <input
        style={inputStyle}
        placeholder="Search your venue by name…"
        value={query}
        onChange={handleInput}
      />
      {loading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: "oklch(0.55 0.008 248)" }}>
          searching…
        </div>
      )}
      {results.length > 0 && (
        <div
          className="absolute z-20 left-0 right-0 mt-1.5 rounded-2xl border overflow-hidden"
          style={{ background: "oklch(0.15 0.010 266)", borderColor: "oklch(0.24 0.010 248)" }}
        >
          {results.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => { onSelect(v); setResults([]); setQuery(""); }}
              className="w-full text-left px-4 py-3 flex items-center gap-3 transition-colors hover:bg-white/5"
            >
              <span className="text-lg shrink-0">{SPORT_ICON[v.type] ?? "📍"}</span>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: "oklch(0.92 0.004 247)" }}>{v.name}</p>
                <p className="text-xs" style={{ color: "oklch(0.55 0.008 248)" }}>
                  {v.type.replace(/_/g, " ")}{v.city ? ` · ${v.city}` : ""}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
      {!loading && query.length >= 2 && results.length === 0 && (
        <p className="text-xs mt-2" style={{ color: "oklch(0.50 0.008 248)" }}>
          No venues found. If your venue is not listed, use "List New Venue" instead.
        </p>
      )}
    </div>
  );
}

/* ── Main form ──────────────────────────────────────────────────── */
function SubmitVenueForm() {
  const searchParams = useSearchParams();

  const [mode, setMode]               = useState<Mode>("new");
  const [claimedVenue, setClaimedVenue] = useState<ClaimedVenue | null>(null);
  const [loadingVenue, setLoadingVenue] = useState(false);

  // contact
  const [ownerName,       setOwnerName]       = useState("");
  const [ownerEmail,      setOwnerEmail]      = useState("");
  const [contactPhone,    setContactPhone]    = useState("");
  const [contactWhatsapp, setContactWhatsapp] = useState("");
  const [proofText,       setProofText]       = useState("");

  // new venue
  const [name,         setName]         = useState("");
  const [type,         setType]         = useState("");
  const [address,      setAddress]      = useState("");
  const [city,         setCity]         = useState("");
  const [country,      setCountry]      = useState("India");
  const [description,  setDescription]  = useState("");
  const [openingHours, setOpeningHours] = useState("");
  const [pricePerHour, setPricePerHour] = useState("");
  const [amenities,    setAmenities]    = useState<string[]>([]);

  const [loading,  setLoading]  = useState(false);
  const [result,   setResult]   = useState<{ id: string; message: string } | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  // Pre-fill from ?claim=<venueId> — this is the "Own this venue?" button on venue detail page
  useEffect(() => {
    const claimId = searchParams.get("claim");
    if (!claimId) return;
    setMode("claim");
    setLoadingVenue(true);
    const supabase = createSupabaseBrowserClient();
    supabase
      .from("venues")
      .select("id, name, type, city")
      .eq("id", claimId)
      .single()
      .then(({ data }) => {
        if (data) setClaimedVenue(data as ClaimedVenue);
        setLoadingVenue(false);
      });
  }, [searchParams]);

  const toggleAmenity = useCallback((val: string) => {
    setAmenities((prev) =>
      prev.includes(val) ? prev.filter((a) => a !== val) : [...prev, val]
    );
  }, []);

  const handleSubmit = useCallback(async () => {
    setLoading(true);
    setApiError(null);
    try {
      const payload: Record<string, unknown> = {
        ownerName, ownerEmail, amenities,
        ...(contactPhone    ? { contactPhone }    : {}),
        ...(contactWhatsapp ? { contactWhatsapp } : {}),
      };

      if (mode === "claim") {
        payload.venueId   = claimedVenue?.id;
        payload.proofText = proofText || undefined;
      } else {
        payload.name         = name;
        payload.type         = type;
        if (address)      payload.address      = address;
        if (city)         payload.city         = city;
        if (country)      payload.country      = country;
        if (description)  payload.description  = description;
        if (openingHours) payload.openingHours = openingHours;
        if (pricePerHour) payload.pricePerHour = Number(pricePerHour);
      }

      const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8787";
      const res  = await fetch(`${base}/venues/submit`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });
      const json = await res.json() as { data?: { id: string; message: string }; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Submission failed");
      setResult(json.data!);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [mode, claimedVenue, ownerName, ownerEmail, contactPhone, contactWhatsapp,
      proofText, name, type, address, city, country, description, openingHours, pricePerHour, amenities]);

  const canSubmit =
    ownerName && ownerEmail &&
    (mode === "new" ? (name && type) : claimedVenue?.id);

  /* ── Success ──────────────────────────────────────────────────── */
  if (result) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "oklch(0.07 0.008 265)" }}>
        <div className="max-w-md w-full text-center space-y-6">
          <div className="text-6xl">🎉</div>
          <h1 className="text-2xl font-extrabold" style={{ color: "oklch(0.92 0.004 247)" }}>Submission Received!</h1>
          <p className="text-sm leading-relaxed" style={{ color: "oklch(0.65 0.008 248)" }}>{result.message}</p>
          <div className="rounded-2xl border px-4 py-3 text-xs font-mono text-left"
               style={{ background: "oklch(0.13 0.010 268)", borderColor: "oklch(0.22 0.010 248)", color: "oklch(0.55 0.008 248)" }}>
            Ref: <span style={{ color: "oklch(0.6692 0.1607 245)" }}>{result.id}</span>
          </div>
          <Link href="/" className="inline-block px-6 py-3 rounded-2xl font-semibold text-sm text-white"
                style={{ background: "oklch(0.6692 0.1607 245)" }}>
            Back to map →
          </Link>
        </div>
      </div>
    );
  }

  /* ── Helpers ──────────────────────────────────────────────────── */
  const card = (children: React.ReactNode, heading: string, sub?: string) => (
    <div className="rounded-3xl border p-6 space-y-5"
         style={{ background: "oklch(0.13 0.010 268)", borderColor: "oklch(0.22 0.010 248)" }}>
      <div>
        <h2 className="text-sm font-bold" style={{ color: "oklch(0.92 0.004 247)" }}>{heading}</h2>
        {sub && <p className="text-xs mt-1" style={{ color: "oklch(0.50 0.008 248)" }}>{sub}</p>}
      </div>
      {children}
    </div>
  );

  const field = (label: string, input: React.ReactNode, hint?: string) => (
    <div>
      <label style={labelStyle}>{label}</label>
      {input}
      {hint && <p className="text-[11px] mt-1.5" style={{ color: "oklch(0.50 0.008 248)" }}>{hint}</p>}
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: "oklch(0.07 0.008 265)" }}>

      {/* Header */}
      <header className="border-b px-4 py-3 flex items-center gap-3"
              style={{ borderColor: "oklch(0.22 0.010 248)", background: "oklch(0.09 0.009 266 / 0.95)" }}>
        <Link href="/" className="text-xl">🏟</Link>
        <span className="font-extrabold text-base" style={{ color: "oklch(0.92 0.004 247)" }}>
          Playgrounds <span style={{ color: "oklch(0.6692 0.1607 245)" }}>AI</span>
        </span>
        <span className="ml-2 text-xs" style={{ color: "oklch(0.50 0.008 248)" }}>/ List your venue</span>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">

        {/* Hero */}
        <div className="text-center space-y-2 pb-2">
          <div className="text-5xl mb-3">🏆</div>
          <h1 className="text-2xl font-extrabold" style={{ color: "oklch(0.92 0.004 247)" }}>List Your Venue</h1>
          <p className="text-sm max-w-md mx-auto leading-relaxed" style={{ color: "oklch(0.55 0.008 248)" }}>
            Reach thousands of players. Free to list — get a{" "}
            <span style={{ color: "#22c55e" }}>Verified Owner</span> badge after review.
          </p>
        </div>

        {/* Mode toggle */}
        <div className="flex rounded-2xl overflow-hidden border"
             style={{ borderColor: "oklch(0.22 0.010 248)" }}>
          {(["new", "claim"] as Mode[]).map((m) => (
            <button key={m} onClick={() => { setMode(m); setClaimedVenue(null); }}
              className="flex-1 py-3 text-sm font-semibold transition-all"
              style={mode === m
                ? { background: "oklch(0.6692 0.1607 245)", color: "white" }
                : { background: "oklch(0.13 0.010 268)", color: "oklch(0.50 0.008 248)" }}>
              {m === "new" ? "➕ List New Venue" : "🔑 Claim Existing Venue"}
            </button>
          ))}
        </div>

        {/* ── Claim mode ─────────────────────────────────────────── */}
        {mode === "claim" && card(
          <>
            {loadingVenue ? (
              <div className="h-14 rounded-2xl animate-pulse" style={{ background: "oklch(0.18 0.008 265)" }} />
            ) : claimedVenue ? (
              /* Pre-filled from venue detail page */
              <div className="flex items-center gap-3 p-4 rounded-2xl border"
                   style={{ background: "oklch(0.14 0.010 265)", borderColor: "#22c55e44" }}>
                <span className="text-2xl">{SPORT_ICON[claimedVenue.type] ?? "📍"}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate" style={{ color: "oklch(0.92 0.004 247)" }}>{claimedVenue.name}</p>
                  <p className="text-xs" style={{ color: "oklch(0.55 0.008 248)" }}>
                    {claimedVenue.type.replace(/_/g, " ")}{claimedVenue.city ? ` · ${claimedVenue.city}` : ""}
                  </p>
                </div>
                <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ background: "#22c55e18", color: "#22c55e" }}>✓ Selected</span>
                <button onClick={() => setClaimedVenue(null)}
                  className="text-xs font-semibold ml-1"
                  style={{ color: "oklch(0.50 0.008 248)" }}>
                  ✕
                </button>
              </div>
            ) : (
              /* Manual search */
              field("Search for your venue",
                <VenueSearch onSelect={setClaimedVenue} />,
                "Start typing the name of the venue you own"
              )
            )}

            {claimedVenue && field("Proof of Ownership (optional but speeds up review)",
              <textarea style={{ ...inputStyle, minHeight: "80px", resize: "vertical" }}
                placeholder="e.g. Registration docs, GST number, a photo of your signboard, Facebook/Instagram page link…"
                value={proofText} onChange={(e) => setProofText(e.target.value)} />
            )}
          </>,
          "Which venue do you own?",
          "Search for your venue by name"
        )}

        {/* ── New venue mode ─────────────────────────────────────── */}
        {mode === "new" && <>
          {card(
            <>
              {field("Venue Name *",
                <input style={inputStyle} placeholder="e.g. Green Valley Cricket Turf"
                  value={name} onChange={(e) => setName(e.target.value)} />
              )}
              <div>
                <label style={labelStyle}>Sport Type *</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {SPORT_OPTIONS.map(({ value, label, icon }) => (
                    <button key={value} type="button" onClick={() => setType(value)}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all text-left"
                      style={type === value
                        ? { background: "oklch(0.6692 0.1607 245 / 0.15)", borderColor: "oklch(0.6692 0.1607 245)", color: "oklch(0.6692 0.1607 245)" }
                        : { background: "oklch(0.14 0.010 265)", borderColor: "oklch(0.24 0.010 248)", color: "oklch(0.60 0.008 248)" }}>
                      <span>{icon}</span><span>{label}</span>
                    </button>
                  ))}
                </div>
              </div>
              {field("Description",
                <textarea style={{ ...inputStyle, minHeight: "80px", resize: "vertical" }}
                  placeholder="Surface type, capacity, special features…"
                  value={description} onChange={(e) => setDescription(e.target.value)} />
              )}
            </>,
            "Venue Details"
          )}

          {card(
            <>
              {field("Street Address",
                <input style={inputStyle} placeholder="123 Stadium Road, Sector 45"
                  value={address} onChange={(e) => setAddress(e.target.value)} />
              )}
              <div className="grid grid-cols-2 gap-4">
                {field("City *",
                  <input style={inputStyle} placeholder="Delhi"
                    value={city} onChange={(e) => setCity(e.target.value)} />
                )}
                {field("Country",
                  <input style={inputStyle} placeholder="India"
                    value={country} onChange={(e) => setCountry(e.target.value)} />
                )}
              </div>
            </>,
            "Location"
          )}

          {card(
            <>
              <div className="grid grid-cols-2 gap-4">
                {field("Opening Hours",
                  <input style={inputStyle} placeholder="Mon–Sat 6am–10pm"
                    value={openingHours} onChange={(e) => setOpeningHours(e.target.value)} />
                )}
                {field("Price / Hour (₹)",
                  <input style={inputStyle} type="number" min="0" placeholder="500"
                    value={pricePerHour} onChange={(e) => setPricePerHour(e.target.value)} />
                )}
              </div>
              <div>
                <label style={labelStyle}>Amenities</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {AMENITY_OPTIONS.map(({ value, label, icon }) => {
                    const active = amenities.includes(value);
                    return (
                      <button key={value} type="button" onClick={() => toggleAmenity(value)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all"
                        style={active
                          ? { background: "#22c55e18", borderColor: "#22c55e44", color: "#22c55e" }
                          : { background: "oklch(0.14 0.010 265)", borderColor: "oklch(0.24 0.010 248)", color: "oklch(0.50 0.008 248)" }}>
                        <span>{icon}</span><span>{label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>,
            "Operations"
          )}
        </>}

        {/* ── Contact ────────────────────────────────────────────── */}
        {card(
          <>
            <div className="grid grid-cols-2 gap-4">
              {field("Your Name *",
                <input style={inputStyle} placeholder="Rahul Sharma"
                  value={ownerName} onChange={(e) => setOwnerName(e.target.value)} />
              )}
              {field("Email *",
                <input style={inputStyle} type="email" placeholder="rahul@example.com"
                  value={ownerEmail} onChange={(e) => setOwnerEmail(e.target.value)} />
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {field("Phone",
                <input style={inputStyle} type="tel" placeholder="+91 98765 43210"
                  value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
              )}
              {field("WhatsApp",
                <input style={inputStyle} type="tel" placeholder="+91 98765 43210"
                  value={contactWhatsapp} onChange={(e) => setContactWhatsapp(e.target.value)} />
              )}
            </div>
          </>,
          "Your Contact Details",
          "We'll send updates to these — not shown publicly"
        )}

        {apiError && (
          <div className="rounded-2xl px-4 py-3 text-sm border"
               style={{ background: "#ef444415", borderColor: "#ef444440", color: "#ef4444" }}>
            {apiError}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading || !canSubmit}
          className="w-full py-4 rounded-2xl font-bold text-base text-white transition-all disabled:opacity-40"
          style={{ background: "oklch(0.6692 0.1607 245)" }}>
          {loading
            ? "Submitting…"
            : mode === "claim"
              ? "Submit Claim for Review →"
              : "Submit Venue for Review →"}
        </button>

        <p className="text-center text-xs pb-8" style={{ color: "oklch(0.40 0.008 248)" }}>
          All submissions are reviewed within 2–3 business days.
        </p>
      </div>
    </div>
  );
}

/* ── Page export (Suspense required for useSearchParams) ────────── */
export default function SubmitVenuePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: "oklch(0.07 0.008 265)" }}>
        <div className="text-sm" style={{ color: "oklch(0.50 0.008 248)" }}>Loading…</div>
      </div>
    }>
      <SubmitVenueForm />
    </Suspense>
  );
}
