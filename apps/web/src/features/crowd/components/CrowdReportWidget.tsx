"use client";

import { useState } from "react";
import { CROWD_LEVEL, CrowdLevel } from "@playgrounds/shared";
import { apiClient } from "../../../lib/api-client";
import { useSession } from "../../auth/hooks/useSession";
import { CrowdLevelBadge } from "../../venues/components/CrowdLevelBadge";

interface CrowdReportWidgetProps {
  venueId: string;
  currentLevel: CrowdLevel | null;
}

const LEVEL_LABELS: Record<CrowdLevel, string> = {
  LOW: "Not crowded",
  MEDIUM: "Moderate",
  HIGH: "Very crowded",
};

export function CrowdReportWidget({ venueId, currentLevel }: CrowdReportWidgetProps) {
  const { session } = useSession();
  const [loading, setLoading] = useState(false);
  const [optimisticLevel, setOptimisticLevel] = useState(currentLevel);

  const handleReport = async (level: CrowdLevel) => {
    if (!session) return;
    setLoading(true);
    setOptimisticLevel(level);
    try {
      await apiClient.crowd.report(venueId, { level }, session.access_token);
    } catch {
      setOptimisticLevel(currentLevel);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Current crowd:</span>
        <CrowdLevelBadge level={optimisticLevel} />
      </div>

      {session && (
        <div className="flex gap-2">
          <span className="text-sm text-muted-foreground self-center">Report now:</span>
          {Object.values(CROWD_LEVEL).map((level) => (
            <button
              key={level}
              onClick={() => handleReport(level as CrowdLevel)}
              disabled={loading}
              className="rounded-md border border-border px-3 py-1 text-xs hover:bg-muted transition-colors disabled:opacity-50"
            >
              {LEVEL_LABELS[level as CrowdLevel]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
