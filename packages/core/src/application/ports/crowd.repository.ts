import { CrowdLevel } from "@playgrounds/shared";

export interface CrowdReportData {
  id: string;
  venueId: string;
  userId: string;
  level: CrowdLevel;
  createdAt: Date;
}

export interface CrowdRepository {
  findRecentByVenueId(venueId: string, hours: number): Promise<CrowdReportData[]>;
  save(data: Omit<CrowdReportData, "id" | "createdAt">): Promise<CrowdReportData>;
}
