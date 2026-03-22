import { getWindsorClient } from "@/lib/data-sources/windsor";
import { domains } from "@/lib/db/schema";

export interface GSCPageMetrics {
  page: string;
  primaryQuery: string;
  totalClicks: number;
  totalImpressions: number;
  avgCtr: number;
  avgPosition: number;
}

interface GSCPullResult {
  pages: GSCPageMetrics[];
  dailyPages: Map<string, GSCPageMetrics[]>; // keyed by YYYY-MM-DD
  skipped: boolean;
  error?: string;
}

function formatDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

/**
 * Aggregate an array of query rows into page-level metrics.
 * Shared by both the overall aggregation and the per-day aggregation.
 */
function aggregateToPages(
  rows: Array<{ page: string; query: string; clicks: number; impressions: number; ctr: number; position: number }>
): GSCPageMetrics[] {
  const pageMap = new Map<string, {
    queries: Array<{ query: string; clicks: number; impressions: number; ctr: number; position: number }>;
    totalClicks: number;
    totalImpressions: number;
  }>();

  for (const row of rows) {
    if (!row.page) continue;
    const existing = pageMap.get(row.page) ?? { queries: [], totalClicks: 0, totalImpressions: 0 };
    existing.queries.push(row);
    existing.totalClicks += row.clicks;
    existing.totalImpressions += row.impressions;
    pageMap.set(row.page, existing);
  }

  const pages: GSCPageMetrics[] = [];
  for (const [page, data] of pageMap) {
    const primaryQuery = data.queries.sort((a, b) => {
      if (b.clicks !== a.clicks) return b.clicks - a.clicks;
      return b.impressions - a.impressions;
    })[0];
    const totalQueries = data.queries.length;
    const avgCtr = totalQueries > 0
      ? data.queries.reduce((sum, q) => sum + q.ctr, 0) / totalQueries
      : 0;
    const avgPosition = data.totalImpressions > 0
      ? data.queries.reduce((sum, q) => sum + (q.position * q.impressions), 0) / data.totalImpressions
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

  return pages;
}

/**
 * Pull GSC data for a domain via Windsor.ai.
 * Returns both aggregated page-level metrics AND daily breakdown.
 */
export async function pullGSCData(
  orgId: string,
  domain: typeof domains.$inferSelect,
  dateFrom: Date,
  dateTo: Date
): Promise<GSCPullResult> {
  if (!domain.gscProperty) {
    return { pages: [], dailyPages: new Map(), skipped: true, error: "GSC property not configured" };
  }

  const client = await getWindsorClient(orgId);
  if (!client) {
    return { pages: [], dailyPages: new Map(), skipped: true, error: "Windsor not configured" };
  }

  const result = await client.getGSCData(
    domain.gscProperty,
    formatDate(dateFrom),
    formatDate(dateTo)
  );

  if (!result.success || !result.data) {
    return { pages: [], dailyPages: new Map(), skipped: false, error: result.error ?? "Failed to fetch GSC data" };
  }

  // Overall aggregation (backward compatible)
  const allRows = result.data.map((row) => ({
    page: row.page,
    query: row.query,
    clicks: row.clicks,
    impressions: row.impressions,
    ctr: row.ctr,
    position: row.position,
  }));
  const pages = aggregateToPages(allRows);

  // Daily breakdown: group raw rows by date, then aggregate per day
  const dailyRaw = new Map<string, Array<{ page: string; query: string; clicks: number; impressions: number; ctr: number; position: number }>>();
  for (const row of result.data) {
    if (!row.page || !row.date) continue;
    // Normalize date to YYYY-MM-DD
    const dateKey = row.date.slice(0, 10);
    const dayRows = dailyRaw.get(dateKey) ?? [];
    dayRows.push({
      page: row.page,
      query: row.query,
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: row.ctr,
      position: row.position,
    });
    dailyRaw.set(dateKey, dayRows);
  }

  const dailyPages = new Map<string, GSCPageMetrics[]>();
  for (const [dateKey, dayRows] of dailyRaw) {
    dailyPages.set(dateKey, aggregateToPages(dayRows));
  }

  return { pages, dailyPages, skipped: false };
}
