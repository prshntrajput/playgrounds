"use client";

import { useState, useEffect, useCallback } from "react";
import { apiClient } from "../../../lib/api-client";

interface StatusVotes {
  openCount: number;
  closedCount: number;
  total: number;
  consensus: "OPEN" | "CLOSED" | null;
  lastVote: string | null;
}

interface StatusVoteBarProps { venueId: string }

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1)  return "just now";
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

export function StatusVoteBar({ venueId }: StatusVoteBarProps) {
  const [votes, setVotes]     = useState<StatusVotes | null>(null);
  const [voting, setVoting]   = useState<"OPEN" | "CLOSED" | null>(null);
  const [myVote, setMyVote]   = useState<"OPEN" | "CLOSED" | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchVotes = useCallback(async () => {
    try {
      const data = await apiClient.statusVotes.get(venueId);
      setVotes(data);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [venueId]);

  useEffect(() => { fetchVotes(); }, [fetchVotes]);

  const handleVote = async (vote: "OPEN" | "CLOSED") => {
    if (voting || myVote) return;
    setVoting(vote);
    try {
      await apiClient.statusVotes.submit(venueId, vote);
      setMyVote(vote);
      setVotes((prev) => prev ? {
        ...prev,
        openCount:   vote === "OPEN"   ? prev.openCount + 1   : prev.openCount,
        closedCount: vote === "CLOSED" ? prev.closedCount + 1 : prev.closedCount,
        total:       prev.total + 1,
        consensus:   vote,
        lastVote:    new Date().toISOString(),
      } : prev);
    } catch { /* silent */ }
    finally { setVoting(null); }
  };

  if (loading) {
    return (
      <div
        className="h-28 rounded-3xl animate-pulse border"
        style={{ background: "oklch(0.13 0.010 268)", borderColor: "oklch(0.22 0.010 248)" }}
      />
    );
  }

  const total   = votes?.total ?? 0;
  const openPct = total > 0 ? Math.round(((votes?.openCount ?? 0) / total) * 100) : 0;
  const consensus = votes?.consensus;

  return (
    <div
      className="rounded-3xl border p-5 space-y-4"
      style={{ borderColor: "oklch(0.22 0.010 248)", background: "oklch(0.11 0.010 266)" }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-foreground">Is it open right now?</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {total === 0
              ? "No votes yet — be the first!"
              : `${total} vote${total !== 1 ? "s" : ""} · last ${timeAgo(votes!.lastVote!)}`}
          </p>
        </div>
        {consensus && (
          <span
            className="text-xs font-bold px-3 py-1 rounded-full border shrink-0"
            style={
              consensus === "OPEN"
                ? { color: "#22c55e", background: "#22c55e15", borderColor: "#22c55e30" }
                : { color: "#ef4444", background: "#ef444415", borderColor: "#ef444430" }
            }
          >
            {consensus === "OPEN" ? "✅ Likely open" : "🔴 Likely closed"}
          </span>
        )}
      </div>

      {/* Progress bar */}
      {total > 0 && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Open · {votes?.openCount ?? 0}</span>
            <span>Closed · {votes?.closedCount ?? 0}</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: "#ef444422" }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${openPct}%`, background: "#22c55e" }}
            />
          </div>
        </div>
      )}

      {/* Vote buttons */}
      {myVote ? (
        <p className="text-xs text-muted-foreground text-center py-1">
          ✓ You voted{" "}
          <strong style={{ color: myVote === "OPEN" ? "#22c55e" : "#ef4444" }}>
            {myVote === "OPEN" ? "Open" : "Closed"}
          </strong>{" "}
          — thanks!
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => handleVote("OPEN")}
            disabled={!!voting}
            className="py-2.5 rounded-2xl text-sm font-bold border transition-all disabled:opacity-50"
            style={{
              background: "#22c55e18",
              borderColor: "#22c55e44",
              color: "#22c55e",
            }}
          >
            {voting === "OPEN" ? "Voting…" : "✅ Open now"}
          </button>
          <button
            onClick={() => handleVote("CLOSED")}
            disabled={!!voting}
            className="py-2.5 rounded-2xl text-sm font-bold border transition-all disabled:opacity-50"
            style={{
              background: "oklch(0.16 0.010 265)",
              borderColor: "oklch(0.25 0.010 248)",
              color: "oklch(0.52 0.008 248)",
            }}
          >
            {voting === "CLOSED" ? "Voting…" : "🔴 Closed"}
          </button>
        </div>
      )}
    </div>
  );
}
