import { CrowdLevel, ReportType, VenueStatus } from "@playgrounds/shared";

export interface VenueSignalContext {
  venueId: string;
  status: VenueStatus;
  reviews: Array<{
    rating: number;
    sentiment?: string;
    issues?: string[];
    createdAt: Date;
  }>;
  reports: Array<{
    type: ReportType;
    createdAt: Date;
  }>;
  photos: Array<{
    createdAt: Date;
  }>;
  crowdReports: Array<{
    level: CrowdLevel;
    createdAt: Date;
  }>;
  hasOfficialData: boolean;
  aiConfidenceScore?: number;
  communityVerifications: number;
  lastVerifiedAt?: Date;
}

export interface SignalResult {
  readonly score: number;
  readonly confidence: number;
  readonly reason: string;
}

export interface ReliabilitySignal {
  readonly key: string;
  readonly weight: number;
  compute(ctx: VenueSignalContext): SignalResult;
}
