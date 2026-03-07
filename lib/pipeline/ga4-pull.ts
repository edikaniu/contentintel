import { getWindsorClient } from "@/lib/data-sources/windsor";
import { domains } from "@/lib/db/schema";

interface GA4PageMetrics {
  page: string;
  sessions: number;
  users: number;
  engagementRate: number;
  bounceRate: number;
  conversions: Record<string, number>;
}

interface GA4PullResult {
  pages: GA4PageMetrics[];
  skipped: boolean;
  error?: string;
}

function formatDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

/**
 * Pull GA4 page-level performance data via Windsor.ai.
 */
export async function pullGA4Data(
  orgId: string,
  domain: typeof domains.$inferSelect,
  dateFrom: Date,
  dateTo: Date
): Promise<GA4PullResult> {
  if (!domain.ga4AccountId) {
    return { pages: [], skipped: true, error: "GA4 account not configured" };
  }

  const client = await getWindsorClient(orgId);
  if (!client) {
    return { pages: [], skipped: true, error: "Windsor not configured" };
  }

  const result = await client.getGA4Data(
    domain.ga4AccountId,
    formatDate(dateFrom),
    formatDate(dateTo)
  );

  if (!result.success || !result.data) {
    return { pages: [], skipped: false, error: result.error ?? "Failed to fetch GA4 data" };
  }

  // Aggregate by page (in case multiple rows per page)
  const pageMap = new Map<string, GA4PageMetrics>();

  for (const row of result.data) {
    if (!row.page) continue;
    const existing = pageMap.get(row.page);
    if (existing) {
      existing.sessions += row.sessions;
      existing.users += row.users;
      // Average the rates
      existing.engagementRate = (existing.engagementRate + row.engagementRate) / 2;
      existing.bounceRate = (existing.bounceRate + row.bounceRate) / 2;
      // Merge conversions
      for (const [key, val] of Object.entries(row.conversions)) {
        existing.conversions[key] = (existing.conversions[key] ?? 0) + val;
      }
    } else {
      pageMap.set(row.page, {
        page: row.page,
        sessions: row.sessions,
        users: row.users,
        engagementRate: row.engagementRate,
        bounceRate: row.bounceRate,
        conversions: { ...row.conversions },
      });
    }
  }

  return { pages: Array.from(pageMap.values()), skipped: false };
}
