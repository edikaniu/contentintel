import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/middleware";
import { db } from "@/lib/db";
import { contentAlerts, contentInventory, domains } from "@/lib/db/schema";
import { eq, and, inArray, desc } from "drizzle-orm";

/**
 * POST /api/content/alerts/cleanup
 * One-time cleanup: deduplicate alerts by keeping the highest-priority
 * alert per contentId+alertType and deleting the rest.
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

    if (orgDomains.length === 0) {
      return NextResponse.json({ deleted: 0, kept: 0, message: "No domains found" });
    }

    const domainIds = orgDomains.map((d) => d.id);

    // Get all content IDs for these domains
    const contentItems = await db
      .select({ id: contentInventory.id })
      .from(contentInventory)
      .where(inArray(contentInventory.domainId, domainIds));

    const contentIds = contentItems.map((c) => c.id);

    if (contentIds.length === 0) {
      return NextResponse.json({ deleted: 0, kept: 0, message: "No content found" });
    }

    // Fetch ALL alerts for this org's content
    const allAlerts = await db
      .select()
      .from(contentAlerts)
      .where(inArray(contentAlerts.contentId, contentIds))
      .orderBy(desc(contentAlerts.priorityScore));

    // Group by contentId + alertType
    const groups = new Map<string, typeof allAlerts>();
    for (const alert of allAlerts) {
      const key = `${alert.contentId}-${alert.alertType}`;
      const group = groups.get(key) ?? [];
      group.push(alert);
      groups.set(key, group);
    }

    const idsToDelete: string[] = [];
    let kept = 0;

    for (const [, group] of groups) {
      if (group.length <= 1) {
        kept += group.length;
        continue;
      }

      // Sort: highest priority first, then most recent batchDate
      group.sort((a, b) => {
        const scoreDiff = (b.priorityScore ?? 0) - (a.priorityScore ?? 0);
        if (scoreDiff !== 0) return scoreDiff;
        return (b.batchDate?.getTime() ?? 0) - (a.batchDate?.getTime() ?? 0);
      });

      // Keep the first (best), mark the rest for deletion
      kept++;
      for (let i = 1; i < group.length; i++) {
        idsToDelete.push(group[i].id);
      }
    }

    // Delete duplicates in batches of 100
    let deleted = 0;
    for (let i = 0; i < idsToDelete.length; i += 100) {
      const batch = idsToDelete.slice(i, i + 100);
      await db.delete(contentAlerts).where(inArray(contentAlerts.id, batch));
      deleted += batch.length;
    }

    console.log(`[Alert Cleanup] Org ${orgId}: deleted ${deleted} duplicate alerts, kept ${kept}`);

    return NextResponse.json({
      deleted,
      kept,
      message: `Cleaned up ${deleted} duplicate alerts. ${kept} unique alerts retained.`,
    });
  } catch (err) {
    console.error("Alert cleanup error:", err);
    return NextResponse.json(
      { error: "Cleanup failed", details: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
