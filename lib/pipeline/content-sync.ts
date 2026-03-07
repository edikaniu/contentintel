import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { contentInventory, domains } from "@/lib/db/schema";
import { getHubSpotClient } from "@/lib/data-sources/hubspot";

interface SyncResult {
  synced: number;
  created: number;
  updated: number;
  skipped: boolean;
  error?: string;
}

/**
 * Sync content inventory from HubSpot for a specific domain.
 * Upserts blog posts matched by hubspot_id or URL.
 */
export async function syncContentInventory(
  orgId: string,
  domain: typeof domains.$inferSelect
): Promise<SyncResult> {
  const client = await getHubSpotClient(orgId);
  if (!client) {
    return { synced: 0, created: 0, updated: 0, skipped: true, error: "HubSpot not configured" };
  }

  const result = await client.listBlogPosts(domain.hubspotBlogId ?? undefined);
  if (!result.success || !result.data) {
    return { synced: 0, created: 0, updated: 0, skipped: false, error: result.error ?? "Failed to fetch blog posts" };
  }

  const posts = result.data;
  let created = 0;
  let updated = 0;

  for (const post of posts) {
    // Estimate word count from post body (strip HTML tags)
    const plainText = post.postBody?.replace(/<[^>]*>/g, " ") ?? "";
    const wordCount = plainText.split(/\s+/).filter(Boolean).length;

    // Try to find existing by hubspot_id first, then by URL
    const existing = await db
      .select({ id: contentInventory.id })
      .from(contentInventory)
      .where(
        and(
          eq(contentInventory.domainId, domain.id),
          eq(contentInventory.hubspotId, post.id)
        )
      )
      .then((rows) => rows[0] ?? null);

    const existingByUrl = existing
      ? null
      : await db
          .select({ id: contentInventory.id })
          .from(contentInventory)
          .where(
            and(
              eq(contentInventory.domainId, domain.id),
              eq(contentInventory.url, post.url)
            )
          )
          .then((rows) => rows[0] ?? null);

    const match = existing ?? existingByUrl;
    const now = new Date();

    if (match) {
      await db
        .update(contentInventory)
        .set({
          hubspotId: post.id,
          title: post.title,
          url: post.url,
          slug: post.slug,
          publishDate: post.publishDate ? new Date(post.publishDate) : null,
          lastUpdated: post.updated ? new Date(post.updated) : null,
          category: post.categoryId || null,
          author: post.authorName || null,
          wordCount,
          syncedAt: now,
        })
        .where(eq(contentInventory.id, match.id));
      updated++;
    } else {
      await db.insert(contentInventory).values({
        domainId: domain.id,
        hubspotId: post.id,
        url: post.url,
        title: post.title,
        slug: post.slug,
        publishDate: post.publishDate ? new Date(post.publishDate) : null,
        lastUpdated: post.updated ? new Date(post.updated) : null,
        category: post.categoryId || null,
        author: post.authorName || null,
        wordCount,
        syncedAt: now,
      });
      created++;
    }
  }

  return { synced: posts.length, created, updated, skipped: false };
}
