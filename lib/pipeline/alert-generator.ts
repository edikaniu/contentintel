import { eq, and, desc, lte, gte } from "drizzle-orm";
import { db } from "@/lib/db";
import { contentInventory, contentSnapshots, contentAlerts, domains } from "@/lib/db/schema";

interface AlertGenResult {
  generated: number;
  error?: string;
}

/**
 * Generate content alerts by comparing current snapshot vs previous snapshots.
 * Implements all 6 alert types from PRD Section 5.2.
 */
export async function generateAlerts(
  domain: typeof domains.$inferSelect,
  batchDate: Date
): Promise<AlertGenResult> {
  const inventory = await db
    .select()
    .from(contentInventory)
    .where(eq(contentInventory.domainId, domain.id));

  if (inventory.length === 0) {
    return { generated: 0 };
  }

  let generated = 0;
  const oneWeekAgo = new Date(batchDate);
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const fourWeeksAgo = new Date(batchDate);
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

  for (const content of inventory) {
    // Get current snapshot (this batch)
    const currentSnap = await db
      .select()
      .from(contentSnapshots)
      .where(
        and(
          eq(contentSnapshots.contentId, content.id),
          eq(contentSnapshots.snapshotDate, batchDate)
        )
      )
      .then((rows) => rows[0] ?? null);

    if (!currentSnap) continue;

    // Get previous week snapshot
    const prevSnap = await db
      .select()
      .from(contentSnapshots)
      .where(
        and(
          eq(contentSnapshots.contentId, content.id),
          lte(contentSnapshots.snapshotDate, oneWeekAgo)
        )
      )
      .orderBy(desc(contentSnapshots.snapshotDate))
      .limit(1)
      .then((rows) => rows[0] ?? null);

    // Get 4-weeks-ago snapshot
    const oldSnap = await db
      .select()
      .from(contentSnapshots)
      .where(
        and(
          eq(contentSnapshots.contentId, content.id),
          lte(contentSnapshots.snapshotDate, fourWeeksAgo)
        )
      )
      .orderBy(desc(contentSnapshots.snapshotDate))
      .limit(1)
      .then((rows) => rows[0] ?? null);

    // 1. Declining traffic: >20% drop in organic sessions over 4-week window
    if (oldSnap && currentSnap.sessions != null && oldSnap.sessions != null && oldSnap.sessions > 0) {
      const dropPct = ((oldSnap.sessions - currentSnap.sessions) / oldSnap.sessions) * 100;
      if (dropPct > 20) {
        const priority = calculatePriority(oldSnap.sessions, dropPct, currentSnap.avgPosition, currentSnap.conversionsJson);
        await insertAlert(content.id, batchDate, "declining_traffic", priority, currentSnap, oldSnap,
          `Organic sessions dropped ${dropPct.toFixed(0)}% over 4 weeks (${oldSnap.sessions} → ${currentSnap.sessions}). Review and update content.`
        );
        generated++;
      }
    }

    // 2. Position slipping: Average position dropped by 3+ places for primary keyword
    if (prevSnap && currentSnap.avgPosition != null && prevSnap.avgPosition != null) {
      const positionDrop = currentSnap.avgPosition - prevSnap.avgPosition;
      if (positionDrop >= 3) {
        const priority = calculatePriority(currentSnap.sessions ?? 0, positionDrop * 10, currentSnap.avgPosition, currentSnap.conversionsJson);
        await insertAlert(content.id, batchDate, "position_drop", priority, currentSnap, prevSnap,
          `Average position dropped by ${positionDrop.toFixed(1)} places (${prevSnap.avgPosition.toFixed(1)} → ${currentSnap.avgPosition.toFixed(1)}) for "${currentSnap.primaryQuery}". Refresh content to recover ranking.`
        );
        generated++;
      }
    }

    // 3. Striking distance: Ranking positions 4-15 for keywords with >500 monthly volume
    if (currentSnap.avgPosition != null && currentSnap.avgPosition >= 4 && currentSnap.avgPosition <= 15) {
      if (currentSnap.organicImpressions != null && currentSnap.organicImpressions > 500) {
        const priority = calculatePriority(currentSnap.sessions ?? 0, 0, currentSnap.avgPosition, currentSnap.conversionsJson);
        await insertAlert(content.id, batchDate, "striking_distance", priority, currentSnap, null,
          `Ranking at position ${currentSnap.avgPosition.toFixed(1)} for "${currentSnap.primaryQuery}" with ${currentSnap.organicImpressions} impressions/week. Optimize to push into top 3.`
        );
        generated++;
      }
    }

    // 4. Stale content: Published >12 months ago, never updated, still getting traffic
    if (content.publishDate) {
      const twelveMonthsAgo = new Date(batchDate);
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
      const neverUpdated = !content.lastUpdated || content.lastUpdated.getTime() === content.publishDate.getTime();
      const hasTraffic = (currentSnap.sessions ?? 0) > 0;

      if (content.publishDate < twelveMonthsAgo && neverUpdated && hasTraffic) {
        const priority = calculatePriority(currentSnap.sessions ?? 0, 0, currentSnap.avgPosition, currentSnap.conversionsJson);
        await insertAlert(content.id, batchDate, "stale_content", priority, currentSnap, null,
          `Published ${formatMonthsAgo(content.publishDate, batchDate)} months ago and never updated, but still receiving ${currentSnap.sessions} sessions/week. Refresh to maintain or improve performance.`
        );
        generated++;
      }
    }

    // 5. High impressions, low CTR: Impressions >1000/week but CTR <2%
    if (currentSnap.organicImpressions != null && currentSnap.organicImpressions > 1000) {
      if (currentSnap.ctr != null && currentSnap.ctr < 0.02) {
        const priority = calculatePriority(currentSnap.sessions ?? 0, 0, currentSnap.avgPosition, currentSnap.conversionsJson);
        await insertAlert(content.id, batchDate, "low_ctr", priority, currentSnap, null,
          `${currentSnap.organicImpressions} impressions/week but only ${(currentSnap.ctr * 100).toFixed(1)}% CTR for "${currentSnap.primaryQuery}". Rewrite title and meta description.`
        );
        generated++;
      }
    }

    // 6. Conversion drop: Content that previously drove conversions but has stopped
    if (oldSnap) {
      const oldConversions = sumConversions(oldSnap.conversionsJson);
      const currentConversions = sumConversions(currentSnap.conversionsJson);

      if (oldConversions > 0 && currentConversions === 0) {
        const priority = calculatePriority(currentSnap.sessions ?? 0, 100, currentSnap.avgPosition, currentSnap.conversionsJson);
        // Boost priority since conversions are business-critical
        await insertAlert(content.id, batchDate, "conversion_drop", Math.min(priority * 1.5, 100), currentSnap, oldSnap,
          `Content was driving ${oldConversions} conversions 4 weeks ago but has dropped to zero. Investigate conversion path and CTA placement.`
        );
        generated++;
      }
    }
  }

  return { generated };
}

async function insertAlert(
  contentId: string,
  batchDate: Date,
  alertType: string,
  priorityScore: number,
  currentSnap: typeof contentSnapshots.$inferSelect,
  previousSnap: typeof contentSnapshots.$inferSelect | null,
  suggestedAction: string
): Promise<void> {
  const severity = priorityScore >= 70 ? "high" : priorityScore >= 40 ? "medium" : "low";

  await db.insert(contentAlerts).values({
    contentId,
    batchDate,
    alertType,
    severity,
    currentMetricsJson: {
      sessions: currentSnap.sessions,
      organicClicks: currentSnap.organicClicks,
      organicImpressions: currentSnap.organicImpressions,
      avgPosition: currentSnap.avgPosition,
      ctr: currentSnap.ctr,
      primaryQuery: currentSnap.primaryQuery,
      conversions: currentSnap.conversionsJson,
    },
    previousMetricsJson: previousSnap
      ? {
          sessions: previousSnap.sessions,
          organicClicks: previousSnap.organicClicks,
          organicImpressions: previousSnap.organicImpressions,
          avgPosition: previousSnap.avgPosition,
          ctr: previousSnap.ctr,
          primaryQuery: previousSnap.primaryQuery,
          conversions: previousSnap.conversionsJson,
        }
      : null,
    suggestedAction,
    priorityScore,
    status: "open",
  });
}

/**
 * Calculate priority score (0-100) based on:
 * - Current traffic level (higher = higher priority)
 * - Decline severity
 * - Keyword difficulty of primary keyword (easier = quicker win)
 * - Conversion potential
 */
function calculatePriority(
  currentSessions: number,
  declineSeverity: number,
  avgPosition: number | null,
  conversionsJson: unknown
): number {
  // Traffic component (0-30): more traffic = higher priority to protect
  const trafficScore = Math.min(currentSessions / 100, 1) * 30;

  // Decline severity component (0-30)
  const declineScore = Math.min(declineSeverity / 100, 1) * 30;

  // Position component (0-20): lower position = easier win
  const posScore = avgPosition != null
    ? Math.max(0, (20 - avgPosition) / 20) * 20
    : 10;

  // Conversion component (0-20): has conversions = higher priority
  const convTotal = sumConversions(conversionsJson);
  const convScore = convTotal > 0 ? Math.min(convTotal / 10, 1) * 20 : 0;

  return Math.min(trafficScore + declineScore + posScore + convScore, 100);
}

function sumConversions(conversionsJson: unknown): number {
  if (!conversionsJson || typeof conversionsJson !== "object") return 0;
  return Object.values(conversionsJson as Record<string, number>).reduce(
    (sum, val) => sum + (typeof val === "number" ? val : 0),
    0
  );
}

function formatMonthsAgo(date: Date, now: Date): number {
  return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24 * 30));
}
