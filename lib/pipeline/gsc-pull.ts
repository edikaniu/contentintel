import { getWindsorClient } from "@/lib/data-sources/windsor";
import { domains } from "@/lib/db/schema";

interface GSCPageMetrics {
  page: string;
  primaryQuery: string;
  totalClicks: number;
  totalImpressions: number;
  avgCtr: number;
  avgPosition: number;
}

interface GSCPullResult {
  pages: GSCPageMetrics[];
  skipped: boolean;
  error?: string;
}

function formatDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

/**
 * Pull GSC data for a domain via Windsor.ai.
 * Returns aggregated page-level metrics for the specified date range.
 */
export async function pullGSCData(
  orgId: string,
  domain: typeof domains.$inferSelect,
  dateFrom: Date,
  dateTo: Date
): Promise<GSCPullResult> {
  if (!domain.gscProperty) {
    return { pages: [], skipped: true, error: "GSC property not configured" };
  }

  const client = await getWindsorClient(orgId);
  if (!client) {
    return { pages: [], skipped: true, error: "Windsor not configured" };
  }

  const result = await client.getGSCData(
    domain.gscProperty,
    formatDate(dateFrom),
    formatDate(dateTo)
  );

  if (!result.success || !result.data) {
    return { pages: [], skipped: false, error: result.error ?? "Failed to fetch GSC data" };
  }

  // Aggregate by page: sum clicks/impressions, find primary query (highest clicks)
  const pageMap = new Map<string, {
    queries: Array<{ query: string; clicks: number; impressions: number; ctr: number; position: number }>;
    totalClicks: number;
    totalImpressions: number;
  }>();

  for (const row of result.data) {
    if (!row.page) continue;
    const existing = pageMap.get(row.page) ?? { queries: [], totalClicks: 0, totalImpressions: 0 };
    existing.queries.push({
      query: row.query,
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: row.ctr,
      position: row.position,
    });
    existing.totalClicks += row.clicks;
    existing.totalImpressions += row.impressions;
    pageMap.set(row.page, existing);
  }

  const pages: GSCPageMetrics[] = [];
  for (const [page, data] of pageMap) {
    // Primary query = the one with the most clicks
    const primaryQuery = data.queries.sort((a, b) => b.clicks - a.clicks)[0];
    const totalQueries = data.queries.length;
    const avgCtr = totalQueries > 0
      ? data.queries.reduce((sum, q) => sum + q.ctr, 0) / totalQueries
      : 0;
    const avgPosition = totalQueries > 0
      ? data.queries.reduce((sum, q) => sum + q.position, 0) / totalQueries
      : 0;

    pages.push({
      page,
      primaryQuery: primaryQuery?.query ?? "",
      totalClicks: data.totalClicks,
      totalImpressions: data.totalImpressions,
      avgCtr,
      avgPosition,
    });
  }

  return { pages, skipped: false };
}
