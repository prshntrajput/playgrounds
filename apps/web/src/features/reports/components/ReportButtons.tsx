"use client";

import { useState } from "react";
import { REPORT_TYPE, ReportType } from "@playgrounds/shared";
import { apiClient } from "../../../lib/api-client";
import { useSession } from "../../auth/hooks/useSession";

interface ReportButtonsProps {
  venueId: string;
  onReported?: () => void;
}

const REPORT_LABELS: Record<ReportType, string> = {
  CLOSED: "Closed",
  FLOODED: "Flooded",
  UNSAFE: "Unsafe",
  BROKEN_LIGHTS: "Broken lights",
  RENOVATION: "Renovation",
  NO_WATER: "No water",
  OVERCROWDED: "Overcrowded",
  DAMAGED_SURFACE: "Damaged surface",
};

export function ReportButtons({ venueId, onReported }: ReportButtonsProps) {
  const { session } = useSession();
  const [submitting, setSubmitting] = useState<ReportType | null>(null);
  const [submitted, setSubmitted] = useState<ReportType | null>(null);

  if (!session) {
    return (
      <p className="text-sm text-muted-foreground">Sign in to report an issue.</p>
    );
  }

  const handleReport = async (type: ReportType) => {
    setSubmitting(type);
    try {
      await apiClient.reports.submit(
        venueId,
        { reportType: type },
        session.access_token
      );
      setSubmitted(type);
      onReported?.();
    } catch {
      // user sees no feedback — keep it silent for now
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {Object.values(REPORT_TYPE).map((type) => (
        <button
          key={type}
          onClick={() => handleReport(type as ReportType)}
          disabled={!!submitting || submitted === type}
          className="rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors disabled:opacity-50"
        >
          {submitted === type ? "Reported ✓" : REPORT_LABELS[type as ReportType]}
        </button>
      ))}
    </div>
  );
}
