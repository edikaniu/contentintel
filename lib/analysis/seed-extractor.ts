import { eq, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { contentSnapshots, contentInventory, domains } from "@/lib/db/schema";
import { getDataForSEOClient } from "@/lib/data-sources/dataforseo";

export interface SeedKeyword {
  keyword: string;
  source: "gsc" | "dataforseo" | "category";
  searchVolume: number;
  category?: string;
}

interface SeedExtractionResult {
  seeds: SeedKeyword[];
  skipped: boolean;
  error?: string;
}

/**
 * Extract seed keywords from three sources:
 * 1. Top-performing GSC queries from content_snapshots (top 200 by clicks)
 * 2. Ranked keywords from DataforSEO for the domain
 * 3. Content categories from domain configuration
 */
export async function extractSeedKeywords(
  orgId: string,
  domain: typeof domains.$inferSelect
): Promise<SeedExtractionResult> {
  const seeds: SeedKeyword[] = [];
  const seen = new Set<string>();

  function addSeed(seed: SeedKeyword) {
    const key = seed.keyword.toLowerCase().trim();
    if (!key || seen.has(key)) return;
    seen.add(key);
    seeds.push({ ...seed, keyword: key });
  }

  // 1. Pull top GSC queries from recent snapshots
  const inventoryItems = await db
    .select({ id: contentInventory.id })
    .from(contentInventory)
    .where(eq(contentInventory.domainId, domain.id));

  if (inventoryItems.length > 0) {
    const contentIds = inventoryItems.map((i) => i.id);
    // Get recent snapshots with primary queries, ordered by clicks
    const snapshots = await db
      .select({
        primaryQuery: contentSnapshots.primaryQuery,
        organicClicks: contentSnapshots.organicClicks,
      })
      .from(contentSnapshots)
      .where(eq(contentSnapshots.contentId, contentIds[0]))
      .orderBy(desc(contentSnapshots.organicClicks))
      .limit(200);

    // For all content items, get their latest snapshots
    for (const item of inventoryItems) {
      const snap = await db
        .select({
          primaryQuery: contentSnapshots.primaryQuery,
          organicClicks: contentSnapshots.organicClicks,
        })
        .from(contentSnapshots)
        .where(eq(contentSnapshots.contentId, item.id))
        .orderBy(desc(contentSnapshots.snapshotDate))
        .limit(1)
        .then((rows) => rows[0] ?? null);

      if (snap?.primaryQuery) {
        addSeed({
          keyword: snap.primaryQuery,
          source: "gsc",
          searchVolume: snap.organicClicks ?? 0,
        });
      }
    }
  }

  // 2. Pull ranked keywords from DataforSEO
  const dfClient = await getDataForSEOClient(orgId);
  if (dfClient) {
    const rankedResult = await dfClient.getRankedKeywords(
      domain.domain,
      domain.dataforseoLocation ?? 2566,
      domain.dataforseoLanguage ?? 1000,
      200
    );

    if (rankedResult.success && rankedResult.data) {
      for (const kw of rankedResult.data) {
        addSeed({
          keyword: kw.keyword,
          source: "dataforseo",
          searchVolume: kw.searchVolume,
        });
      }
    }
  }

  // 3. Extract content categories from domain config
  const categories = domain.contentCategoriesJson;
  if (Array.isArray(categories)) {
    for (const cat of categories) {
      if (typeof cat === "string") {
        addSeed({
          keyword: cat,
          source: "category",
          searchVolume: 0,
          category: cat,
        });
      }
    }
  }

  if (seeds.length === 0) {
    return { seeds: [], skipped: true, error: "No seed keywords found from any source" };
  }

  return { seeds, skipped: false };
}

/**
 * Group seeds into clusters by category or shared terms.
 * Returns clusters with representative category labels.
 */
export function groupSeedsByClusters(
  seeds: SeedKeyword[],
  categories: string[]
): Map<string, SeedKeyword[]> {
  const clusters = new Map<string, SeedKeyword[]>();

  // Initialize with domain categories
  for (const cat of categories) {
    clusters.set(cat.toLowerCase(), []);
  }

  // If no categories, create a "general" cluster
  if (categories.length === 0) {
    clusters.set("general", []);
  }

  for (const seed of seeds) {
    let assigned = false;

    // Try to match to a category
    if (seed.category) {
      const key = seed.category.toLowerCase();
      if (!clusters.has(key)) clusters.set(key, []);
      clusters.get(key)!.push(seed);
      assigned = true;
    } else {
      // Try matching keyword text to category names
      for (const cat of categories) {
        if (seed.keyword.includes(cat.toLowerCase())) {
          const key = cat.toLowerCase();
          clusters.get(key)!.push(seed);
          assigned = true;
          break;
        }
      }
    }

    if (!assigned) {
      // Put in "general" or first available cluster
      const generalKey = clusters.has("general") ? "general" : categories[0]?.toLowerCase() ?? "general";
      if (!clusters.has(generalKey)) clusters.set(generalKey, []);
      clusters.get(generalKey)!.push(seed);
    }
  }

  // Remove empty clusters
  for (const [key, value] of clusters) {
    if (value.length === 0) clusters.delete(key);
  }

  return clusters;
}
