"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "../../lib/supabase-browser";
import { apiClient } from "../../lib/api-client";

/* ── Types ──────────────────────────────────────────────────────── */
interface Submission {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  owner_name: string;
  owner_email: string;
  contact_phone: string | null;
  contact_whatsapp: string | null;
  venue_id: string | null;      // null = new venue, set = claim
  name: string | null;
  type: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  description: string | null;
  opening_hours: string | null;
  price_per_hour: number | null;
  amenities: string[];
  proof_text: string | null;
  admin_notes: string | null;
  created_at: string;
}

const SPORT_ICON: Record<string, string> = {
  BASKETBALL: "🏀", FOOTBALL: "⚽", CRICKET: "🏏", TENNIS: "🎾",
  BADMINTON: "🏸", VOLLEYBALL: "🏐", SWIMMING: "🏊", ATHLETICS: "🏃",
  TABLE_TENNIS: "🏓", MULTI: "🏟",
};

const AMENITY_LABEL: Record<string, string> = {
  FLOODLIGHTS: "💡 Lights", PARKING: "🅿️ Parking", WASHROOM: "🚻 Washroom",
  WATER: "💧 Water", LOCKER_ROOM: "🔐 Locker", SEATING: "💺 Seating",
  CANTEEN: "🍽️ Canteen", WIFI: "📶 WiFi",
};

type Tab = "PENDING" | "APPROVED" | "REJECTED";

/* ── Submission card ────────────────────────────────────────────── */
function SubmissionCard({
  sub,
  token,
  onReviewed,
}: {
  sub: Submission;
  token: string;
  onReviewed: (id: string, status: "APPROVED" | "REJECTED") => void;
}) {
  const [notes,      setNotes]      = useState("");
  const [loading,    setLoading]    = useState<"approve" | "reject" | null>(null);
  const [showNotes,  setShowNotes]  = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  const isClaim    = !!sub.venue_id;
  const typeLabel  = sub.type?.replace(/_/g, " ") ?? "";

  const review = useCallback(async (status: "APPROVED" | "REJECTED") => {
    setLoading(status === "APPROVED" ? "approve" : "reject");
    setError(null);
    try {
      await apiClient.admin.review(sub.id, status, notes, token);
      onReviewed(sub.id, status);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
      setLoading(null);
    }
  }, [sub.id, notes, token, onReviewed]);

  return (
    <div className="rounded-3xl border overflow-hidden"
         style={{ background: "oklch(0.13 0.010 268)", borderColor: "oklch(0.22 0.010 248)" }}>

      {/* Type stripe */}
      <div className="h-0.5" style={{ background: isClaim ? "#8b5cf6" : "oklch(0.6692 0.1607 245)" }} />

      <div className="p-5 space-y-4">

        {/* Header row */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
               style={{ background: isClaim ? "#8b5cf620" : "oklch(0.6692 0.1607 245 / 0.15)" }}>
            {isClaim ? "🔑" : (SPORT_ICON[sub.type ?? ""] ?? "🏟")}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={isClaim
                      ? { background: "#8b5cf620", color: "#8b5cf6" }
                      : { background: "oklch(0.6692 0.1607 245 / 0.15)", color: "oklch(0.6692 0.1607 245)" }}>
                {isClaim ? "CLAIM" : "NEW VENUE"}
              </span>
              <span className="text-[10px]" style={{ color: "oklch(0.45 0.008 248)" }}>
                {new Date(sub.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </span>
            </div>
            {isClaim ? (
              <div className="mt-1">
                <p className="text-sm font-bold" style={{ color: "oklch(0.92 0.004 247)" }}>
                  Claiming venue
                </p>
                <Link href={`/venues/${sub.venue_id}`} target="_blank"
                  className="text-xs underline" style={{ color: "oklch(0.6692 0.1607 245)" }}>
                  View venue page →
                </Link>
              </div>
            ) : (
              <p className="text-base font-bold mt-1 truncate" style={{ color: "oklch(0.92 0.004 247)" }}>
                {SPORT_ICON[sub.type ?? ""] ?? ""} {sub.name}
              </p>
            )}
          </div>
        </div>

        {/* Venue details (new venues only) */}
        {!isClaim && (
          <div className="grid grid-cols-2 gap-3 text-xs">
            {sub.type && (
              <div>
                <span style={{ color: "oklch(0.50 0.008 248)" }}>Sport</span>
                <p className="font-semibold mt-0.5" style={{ color: "oklch(0.80 0.004 247)" }}>{typeLabel}</p>
              </div>
            )}
            {(sub.city || sub.address) && (
              <div>
                <span style={{ color: "oklch(0.50 0.008 248)" }}>Location</span>
                <p className="font-semibold mt-0.5" style={{ color: "oklch(0.80 0.004 247)" }}>
                  {[sub.city, sub.country].filter(Boolean).join(", ")}
                </p>
                {sub.address && <p style={{ color: "oklch(0.55 0.008 248)" }}>{sub.address}</p>}
              </div>
            )}
            {sub.opening_hours && (
              <div>
                <span style={{ color: "oklch(0.50 0.008 248)" }}>Hours</span>
                <p className="font-semibold mt-0.5" style={{ color: "oklch(0.80 0.004 247)" }}>{sub.opening_hours}</p>
              </div>
            )}
            {sub.price_per_hour && (
              <div>
                <span style={{ color: "oklch(0.50 0.008 248)" }}>Price/hr</span>
                <p className="font-semibold mt-0.5" style={{ color: "oklch(0.80 0.004 247)" }}>₹{sub.price_per_hour}</p>
              </div>
            )}
          </div>
        )}

        {sub.description && (
          <p className="text-xs leading-relaxed" style={{ color: "oklch(0.60 0.008 248)" }}>
            {sub.description}
          </p>
        )}

        {sub.amenities?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {sub.amenities.map((a) => (
              <span key={a} className="text-[10px] px-2 py-0.5 rounded-full"
                    style={{ background: "oklch(0.18 0.008 265)", color: "oklch(0.65 0.008 248)" }}>
                {AMENITY_LABEL[a] ?? a}
              </span>
            ))}
          </div>
        )}

        {/* Proof text (claims) */}
        {sub.proof_text && (
          <div className="rounded-xl px-3 py-2.5 text-xs leading-relaxed"
               style={{ background: "oklch(0.10 0.008 265)", color: "oklch(0.65 0.008 248)", borderLeft: "3px solid #8b5cf6" }}>
            <p className="text-[10px] font-bold mb-1 uppercase" style={{ color: "#8b5cf6" }}>Proof of Ownership</p>
            {sub.proof_text}
          </div>
        )}

        {/* Owner contact */}
        <div className="flex items-center gap-4 pt-2 border-t text-xs"
             style={{ borderColor: "oklch(0.20 0.008 265)" }}>
          <div>
            <span style={{ color: "oklch(0.50 0.008 248)" }}>Owner</span>
            <p className="font-semibold" style={{ color: "oklch(0.80 0.004 247)" }}>{sub.owner_name}</p>
          </div>
          <div>
            <span style={{ color: "oklch(0.50 0.008 248)" }}>Email</span>
            <p className="font-semibold" style={{ color: "oklch(0.6692 0.1607 245)" }}>{sub.owner_email}</p>
          </div>
          {sub.contact_phone && (
            <div>
              <span style={{ color: "oklch(0.50 0.008 248)" }}>Phone</span>
              <p className="font-semibold" style={{ color: "oklch(0.80 0.004 247)" }}>{sub.contact_phone}</p>
            </div>
          )}
          {sub.contact_whatsapp && (
            <a href={`https://wa.me/${sub.contact_whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener"
               className="flex items-center gap-1 font-semibold"
               style={{ color: "#22c55e" }}>
              <span>📱</span> WhatsApp
            </a>
          )}
        </div>

        {/* Admin notes input */}
        {sub.status === "PENDING" && showNotes && (
          <textarea
            className="w-full text-xs rounded-xl px-3 py-2.5 resize-none"
            style={{
              background: "oklch(0.10 0.008 265)",
              border: "1px solid oklch(0.24 0.010 248)",
              color: "oklch(0.85 0.004 247)",
              minHeight: "60px",
              outline: "none",
            }}
            placeholder="Optional note to attach to this decision…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        )}

        {/* Previous admin notes */}
        {sub.admin_notes && sub.status !== "PENDING" && (
          <div className="rounded-xl px-3 py-2.5 text-xs"
               style={{ background: "oklch(0.10 0.008 265)", color: "oklch(0.60 0.008 248)" }}>
            <p className="font-bold mb-1" style={{ color: "oklch(0.50 0.008 248)" }}>Admin note:</p>
            {sub.admin_notes}
          </div>
        )}

        {error && <p className="text-xs" style={{ color: "#ef4444" }}>{error}</p>}

        {/* Action buttons (only for PENDING) */}
        {sub.status === "PENDING" && (
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => review("APPROVED")}
              disabled={!!loading}
              className="flex-1 py-2.5 rounded-2xl text-sm font-bold transition-all disabled:opacity-50"
              style={{ background: "#22c55e18", color: "#22c55e", border: "1px solid #22c55e44" }}>
              {loading === "approve" ? "Approving…" : "✓ Approve"}
            </button>
            <button
              onClick={() => setShowNotes((v) => !v)}
              className="px-3 py-2.5 rounded-2xl text-sm transition-all"
              style={{ background: "oklch(0.18 0.008 265)", color: "oklch(0.60 0.008 248)" }}>
              📝
            </button>
            <button
              onClick={() => review("REJECTED")}
              disabled={!!loading}
              className="flex-1 py-2.5 rounded-2xl text-sm font-bold transition-all disabled:opacity-50"
              style={{ background: "#ef444415", color: "#ef4444", border: "1px solid #ef444440" }}>
              {loading === "reject" ? "Rejecting…" : "✕ Reject"}
            </button>
          </div>
        )}

        {/* Status badge for reviewed */}
        {sub.status !== "PENDING" && (
          <div className="flex items-center gap-2 pt-1">
            <span className="text-xs font-bold px-3 py-1 rounded-full"
                  style={sub.status === "APPROVED"
                    ? { background: "#22c55e18", color: "#22c55e" }
                    : { background: "#ef444415", color: "#ef4444" }}>
              {sub.status === "APPROVED" ? "✓ Approved" : "✕ Rejected"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Admin page ─────────────────────────────────────────────────── */
export default function AdminPage() {
  const [authState, setAuthState] = useState<"loading" | "denied" | "ok">("loading");
  const [token,    setToken]      = useState<string | null>(null);
  const [tab,      setTab]        = useState<Tab>("PENDING");
  const [subs,     setSubs]       = useState<Submission[]>([]);
  const [fetching, setFetching]   = useState(false);

  // Auth check on mount
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getSession().then(async ({ data }) => {
      const sess = data.session;
      if (!sess) { setAuthState("denied"); return; }

      const accessToken = sess.access_token;
      try {
        const me = await apiClient.me(accessToken);
        if (me.role !== "ADMIN") { setAuthState("denied"); return; }
        setToken(accessToken);
        setAuthState("ok");
      } catch {
        setAuthState("denied");
      }
    });
  }, []);

  // Fetch submissions whenever tab or auth changes
  useEffect(() => {
    if (authState !== "ok" || !token) return;
    setFetching(true);
    setSubs([]);
    apiClient.admin.submissions(tab, token)
      .then((res) => setSubs(res.submissions as unknown as Submission[]))
      .catch(console.error)
      .finally(() => setFetching(false));
  }, [tab, authState, token]);

  const handleReviewed = useCallback((id: string) => {
    setSubs((prev) => prev.filter((s) => s.id !== id));
  }, []);

  /* ── States ─────────────────────────────────────────────────── */
  if (authState === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "oklch(0.07 0.008 265)" }}>
        <div className="text-sm" style={{ color: "oklch(0.50 0.008 248)" }}>Verifying access…</div>
      </div>
    );
  }

  if (authState === "denied") {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "oklch(0.07 0.008 265)" }}>
        <div className="text-center space-y-4">
          <div className="text-5xl">🔒</div>
          <h1 className="text-xl font-bold" style={{ color: "oklch(0.92 0.004 247)" }}>Admin Access Required</h1>
          <p className="text-sm" style={{ color: "oklch(0.55 0.008 248)" }}>
            This page is only accessible to administrators.
          </p>
          <Link href="/" className="inline-block mt-4 px-5 py-2.5 rounded-2xl text-sm font-semibold text-white"
                style={{ background: "oklch(0.6692 0.1607 245)" }}>
            Back to map
          </Link>
        </div>
      </div>
    );
  }

  const TABS: Tab[] = ["PENDING", "APPROVED", "REJECTED"];
  const TAB_CFG = {
    PENDING:  { label: "Pending Review", color: "#f59e0b" },
    APPROVED: { label: "Approved",       color: "#22c55e" },
    REJECTED: { label: "Rejected",       color: "#ef4444" },
  };

  return (
    <div className="min-h-screen" style={{ background: "oklch(0.07 0.008 265)" }}>

      {/* Header */}
      <header className="border-b px-4 py-3 flex items-center justify-between"
              style={{ borderColor: "oklch(0.22 0.010 248)", background: "oklch(0.09 0.009 266 / 0.95)" }}>
        <div className="flex items-center gap-3">
          <Link href="/" className="text-xl">🏟</Link>
          <span className="font-extrabold text-base" style={{ color: "oklch(0.92 0.004 247)" }}>
            Playgrounds <span style={{ color: "oklch(0.6692 0.1607 245)" }}>AI</span>
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full font-bold ml-1"
                style={{ background: "oklch(0.6692 0.1607 245 / 0.15)", color: "oklch(0.6692 0.1607 245)" }}>
            Admin
          </span>
        </div>
        <Link href="/" className="text-xs font-semibold" style={{ color: "oklch(0.55 0.008 248)" }}>
          ← Map
        </Link>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        <div>
          <h1 className="text-xl font-extrabold" style={{ color: "oklch(0.92 0.004 247)" }}>
            Venue Submissions
          </h1>
          <p className="text-xs mt-1" style={{ color: "oklch(0.50 0.008 248)" }}>
            Review owner listings and venue claims. Approving a new venue publishes it on the map.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex rounded-2xl overflow-hidden border"
             style={{ borderColor: "oklch(0.22 0.010 248)" }}>
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className="flex-1 py-2.5 text-xs font-bold transition-all"
              style={tab === t
                ? { background: TAB_CFG[t].color + "20", color: TAB_CFG[t].color, borderBottom: `2px solid ${TAB_CFG[t].color}` }
                : { background: "oklch(0.13 0.010 268)", color: "oklch(0.50 0.008 248)" }}>
              {TAB_CFG[t].label}
            </button>
          ))}
        </div>

        {/* List */}
        {fetching && (
          <div className="space-y-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-48 rounded-3xl animate-pulse"
                   style={{ background: "oklch(0.13 0.010 268)" }} />
            ))}
          </div>
        )}

        {!fetching && subs.length === 0 && (
          <div className="text-center py-16">
            <div className="text-4xl mb-3 opacity-40">📭</div>
            <p className="text-sm" style={{ color: "oklch(0.50 0.008 248)" }}>
              No {tab.toLowerCase()} submissions
            </p>
          </div>
        )}

        {!fetching && subs.length > 0 && (
          <div className="space-y-4">
            {subs.map((sub) => (
              <SubmissionCard
                key={sub.id}
                sub={sub}
                token={token!}
                onReviewed={handleReviewed}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
