import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/middleware";
import { db } from "@/lib/db";
import { topicRecommendations, domains } from "@/lib/db/schema";
import { eq, inArray, desc } from "drizzle-orm";

/**
 * POST /api/topics/cleanup
 * One-time cleanup: deduplicate topic recommendations by keeping the
 * highest-scoring version of each keyword and deleting the rest.
 */
export async function POST(req: NextRequest) {
  const { session, error } = await requireRole("admin");
  if (error) return error;

  try {
    const orgId = session!.user.orgId;

    // Get all domains for this org
    const orgDomains = await db
      .select({ id: domains.id })
      .from(domains)
      .where(eq(domains.orgId, orgId));

    const domainIds = orgDomains.map((d) => d.id);

    if (domainIds.length === 0) {
      return NextResponse.json({ deleted: 0, kept: 0, message: "No domains found" });
    }

    // Fetch ALL topic recommendations for this org
    const allTopics = await db
      .select()
      .from(topicRecommendations)
      .where(inArray(topicRecommendations.domainId, domainIds))
      .orderBy(desc(topicRecommendations.opportunityScore));

    // Group by normalized keyword (lowercase, trimmed) within each domain
    const groups = new Map<string, typeof allTopics>();
    for (const topic of allTopics) {
      const key = `${topic.domainId}-${topic.primaryKeyword.toLowerCase().trim()}`;
      const group = groups.get(key) ?? [];
      group.push(topic);
      groups.set(key, group);
    }

    const idsToDelete: string[] = [];
    let kept = 0;

    for (const [, group] of groups) {
      if (group.length <= 1) {
        kept += group.length;
        continue;
      }

      // Sort: approved > pending > rejected, then highest score, then most recent
      group.sort((a, b) => {
        const statusOrder: Record<string, number> = { approved: 0, in_progress: 1, pending: 2, assigned: 3, rejected: 4, published: 5 };
        const statusDiff = (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9);
        if (statusDiff !== 0) return statusDiff;
        const scoreDiff = (b.opportunityScore ?? 0) - (a.opportunityScore ?? 0);
        if (scoreDiff !== 0) return scoreDiff;
        return (b.updatedAt?.getTime() ?? 0) - (a.updatedAt?.getTime() ?? 0);
      });

      // Keep the first (best), mark rest for deletion
      kept++;
      for (let i = 1; i < group.length; i++) {
        idsToDelete.push(group[i].id);
      }
    }

    // Delete duplicates in batches of 100
    let deleted = 0;
    for (let i = 0; i < idsToDelete.length; i += 100) {
      const batch = idsToDelete.slice(i, i + 100);
      await db.delete(topicRecommendations).where(inArray(topicRecommendations.id, batch));
      deleted += batch.length;
    }

    console.log(`[Topic Cleanup] Org ${orgId}: deleted ${deleted} duplicate topics, kept ${kept}`);

    return NextResponse.json({
      deleted,
      kept,
      message: `Cleaned up ${deleted} duplicate topics. ${kept} unique topics retained.`,
    });
  } catch (err) {
    console.error("Topic cleanup error:", err);
    return NextResponse.json(
      { error: "Cleanup failed", details: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
