import { eq, and, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { contentInventory, contentSnapshots, domains } from "@/lib/db/schema";

interface PageGSCData {
  primaryQuery: string;
  totalClicks: number;
  totalImpressions: number;
  avgCtr: number;
  avgPosition: number;
}

interface PageGA4Data {
  sessions: number;
  users: number;
  engagementRate: number;
  bounceRate: number;
  conversions: Record<string, number>;
}

interface SnapshotBuildResult {
  created: number;
  error?: string;
}

/**
 * Build content snapshots by combining GSC + GA4 data for each content piece.
 * Matches data to content inventory by URL/page path.
 */
export async function buildSnapshots(
  domain: typeof domains.$inferSelect,
  snapshotDate: Date,
  gscPages: Map<string, PageGSCData>,
  ga4Pages: Map<string, PageGA4Data>
): Promise<SnapshotBuildResult> {
  // Get all content inventory items for this domain
  const inventory = await db
    .select()
    .from(contentInventory)
    .where(eq(contentInventory.domainId, domain.id));

  if (inventory.length === 0) {
    return { created: 0 };
  }

  let created = 0;

  for (const content of inventory) {
    // Match by URL — try full URL and path portion
    const contentUrl = content.url;
    const contentPath = extractPath(contentUrl);

    const gsc = gscPages.get(contentUrl) ?? gscPages.get(contentPath) ?? findByPathMatch(gscPages, contentPath);
    const ga4 = ga4Pages.get(contentUrl) ?? ga4Pages.get(contentPath) ?? findByPathMatch(ga4Pages, contentPath);

    // Only create snapshot if we have data from at least one source
    if (!gsc && !ga4) continue;

    // Truncate primaryQuery to 500 chars max (varchar limit) — some GSC queries are full paragraphs
    const primaryQuery = gsc?.primaryQuery ? gsc.primaryQuery.slice(0, 500) : null;

    const snapshotValues = {
      organicClicks: gsc?.totalClicks ?? null,
      organicImpressions: gsc?.totalImpressions ?? null,
      avgPosition: gsc?.avgPosition ?? null,
      primaryQuery,
      ctr: gsc?.avgCtr ?? null,
      sessions: ga4?.sessions ?? null,
      users: ga4?.users ?? null,
      engagementRate: ga4?.engagementRate ?? null,
      bounceRate: ga4?.bounceRate ?? null,
      conversionsJson: ga4?.conversions ?? null,
    };

    // Upsert: check if snapshot exists for this content + date (prevents duplicates on re-runs)
    const existing = await db
      .select({ id: contentSnapshots.id })
      .from(contentSnapshots)
      .where(
        and(
          eq(contentSnapshots.contentId, content.id),
          sql`DATE(${contentSnapshots.snapshotDate}) = DATE(${snapshotDate})`
        )
      )
      .limit(1)
      .then((rows) => rows[0] ?? null);

    if (existing) {
      await db.update(contentSnapshots).set(snapshotValues).where(eq(contentSnapshots.id, existing.id));
    } else {
      await db.insert(contentSnapshots).values({
        contentId: content.id,
        snapshotDate,
        ...snapshotValues,
      });
    }

    created++;
  }

  return { created };
}

/**
 * Extract the path portion from a URL.
 */
function extractPath(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.pathname;
  } catch {
    // If not a valid URL, treat the whole string as a path
    return url.startsWith("/") ? url : `/${url}`;
  }
}

/**
 * Try to match a content path against the keys in a data map.
 * Handles cases where the GSC/GA4 page URL might be a full URL vs just a path.
 */
function findByPathMatch<T>(dataMap: Map<string, T>, targetPath: string): T | undefined {
  for (const [key, value] of dataMap) {
    const keyPath = extractPath(key);
    if (keyPath === targetPath) return value;
  }
  return undefined;
}
