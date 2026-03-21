import { eq, and, desc, lte, gte, inArray } from "drizzle-orm";
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
  const fourWeeksAgoStart = new Date(batchDate);
  fourWeeksAgoStart.setDate(fourWeeksAgoStart.getDate() - 35);
  const fourWeeksAgoEnd = new Date(batchDate);
  fourWeeksAgoEnd.setDate(fourWeeksAgoEnd.getDate() - 21);

  // Batch-fetch all snapshots in 3 parallel queries instead of 3 per content item
  // Also fetch open/acknowledged alerts for deduplication
  const contentIds = inventory.map((c) => c.id);
  const [currentSnaps, prevSnaps, oldSnaps, openAlerts] = await Promise.all([
    db.select().from(contentSnapshots)
      .where(and(inArray(contentSnapshots.contentId, contentIds), eq(contentSnapshots.snapshotDate, batchDate))),
    db.select().from(contentSnapshots)
      .where(and(inArray(contentSnapshots.contentId, contentIds), lte(contentSnapshots.snapshotDate, oneWeekAgo)))
      .orderBy(desc(contentSnapshots.snapshotDate)),
    db.select().from(contentSnapshots)
      .where(and(
        inArray(contentSnapshots.contentId, contentIds), 
        gte(contentSnapshots.snapshotDate, fourWeeksAgoStart),
        lte(contentSnapshots.snapshotDate, fourWeeksAgoEnd)
      ))
      .orderBy(desc(contentSnapshots.snapshotDate)),
    db.select().from(contentAlerts)
      .where(and(inArray(contentAlerts.contentId, contentIds), inArray(contentAlerts.status, ['open', 'acknowledged'])))
  ]);

  // Index by content ID (take latest per content for prev/old)
  const currentMap = new Map<string, typeof contentSnapshots.$inferSelect>();
  for (const s of currentSnaps) currentMap.set(s.contentId, s);
  const prevMap = new Map<string, typeof contentSnapshots.$inferSelect>();
  for (const s of prevSnaps) { if (!prevMap.has(s.contentId)) prevMap.set(s.contentId, s); }
  const oldMap = new Map<string, typeof contentSnapshots.$inferSelect>();
  for (const s of oldSnaps) { if (!oldMap.has(s.contentId)) oldMap.set(s.contentId, s); }
  
  // Index existing alerts for deduplication
  const alertMap = new Map<string, typeof contentAlerts.$inferSelect>();
  for (const a of openAlerts) alertMap.set(`${a.contentId}-${a.alertType}`, a);

  for (const content of inventory) {
    const currentSnap = currentMap.get(content.id) ?? null;
    if (!currentSnap) continue;

    const prevSnap = prevMap.get(content.id) ?? null;
    const oldSnap = oldMap.get(content.id) ?? null;

    // Pre-compute keyword relevance for alert messages (null-safe)
    const primaryQuery = currentSnap.primaryQuery ?? "";
    const isQueryRelevant = primaryQuery.length > 0 && (
      (content.title ?? "").toLowerCase().includes(primaryQuery.toLowerCase()) ||
      content.url.toLowerCase().includes(primaryQuery.toLowerCase())
    );
    const queryContext = isQueryRelevant ? ` for "${primaryQuery}"` : "";

    // 1. Declining traffic: >20% drop over 4-week window
    // Use sessions (GA4) if available, otherwise fall back to organicClicks (GSC)
    if (oldSnap) {
      const currentTraffic = currentSnap.sessions ?? currentSnap.organicClicks ?? null;
      const oldTraffic = oldSnap.sessions ?? oldSnap.organicClicks ?? null;
      const trafficMetric = currentSnap.sessions != null ? "sessions" : "clicks";

      // Enforce a minimum threshold to avoid 100% drop noise on insignificant numbers
      if (currentTraffic != null && oldTraffic != null && oldTraffic > 10) {
        const dropPct = ((oldTraffic - currentTraffic) / oldTraffic) * 100;
        if (dropPct > 20) {
          const priority = calculatePriority(currentTraffic, dropPct, currentSnap.avgPosition, currentSnap.conversionsJson);
          if (await upsertAlert(content.id, batchDate, "declining_traffic", priority, currentSnap, oldSnap,
            `Organic ${trafficMetric} dropped ${dropPct.toFixed(0)}% over 4 weeks (${oldTraffic} → ${currentTraffic}). Review and update content.`, alertMap
          )) generated++;
        }
      }
    }

    // 2. Position slipping: Average position dropped by 3+ places for primary keyword
    if (prevSnap && currentSnap.avgPosition != null && prevSnap.avgPosition != null) {
      const positionDrop = currentSnap.avgPosition - prevSnap.avgPosition;
      if (positionDrop >= 3) {
        const priority = calculatePriority(currentSnap.sessions ?? 0, positionDrop * 10, currentSnap.avgPosition, currentSnap.conversionsJson);
        const posQueryContext = isQueryRelevant ? ` (relevant to "${primaryQuery}")` : "";
        if (await upsertAlert(content.id, batchDate, "position_drop", priority, currentSnap, prevSnap,
          `Average position for the page dropped by ${positionDrop.toFixed(1)} places (${prevSnap.avgPosition.toFixed(1)} → ${currentSnap.avgPosition.toFixed(1)})${posQueryContext}. Refresh content to recover ranking.`, alertMap
        )) generated++;
      }
    }

    // 3. Striking distance: Ranking positions 4-15 for keywords with >500 monthly volume
    if (currentSnap.avgPosition != null && currentSnap.avgPosition >= 4 && currentSnap.avgPosition <= 15) {
      if (currentSnap.organicImpressions != null && currentSnap.organicImpressions > 500) {
        const priority = calculatePriority(currentSnap.sessions ?? 0, 0, currentSnap.avgPosition, currentSnap.conversionsJson);
        if (await upsertAlert(content.id, batchDate, "striking_distance", priority, currentSnap, null,
          `Ranking at position ${currentSnap.avgPosition.toFixed(1)}${queryContext} with ${currentSnap.organicImpressions} impressions/week. Optimize to push into top 3.`, alertMap
        )) generated++;
      }
    }

    // 4. Stale content: Published >12 months ago, never updated, still getting traffic
    const pubDate = content.publishDate;
    if (pubDate) {
      const twelveMonthsAgo = new Date(batchDate);
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
      const neverUpdated = !content.lastUpdated || (content.publishDate && content.lastUpdated.getTime() === content.publishDate.getTime());
      const hasTraffic = (currentSnap.sessions ?? currentSnap.organicClicks ?? 0) > 0;

      if (pubDate < twelveMonthsAgo && neverUpdated && hasTraffic) {
        const traffic = currentSnap.sessions ?? currentSnap.organicClicks ?? 0;
        const priority = calculatePriority(traffic, 0, currentSnap.avgPosition, currentSnap.conversionsJson);
        if (await upsertAlert(content.id, batchDate, "stale_content", priority, currentSnap, null,
          `Published ${formatMonthsAgo(pubDate, batchDate)} months ago and never updated, but still receiving ${traffic} ${currentSnap.sessions != null ? "sessions" : "clicks"}/week. Refresh to maintain or improve performance.`, alertMap
        )) generated++;
      }
    }

    // 5. High impressions, low CTR: Impressions >1000/week but CTR <2%
    if (currentSnap.organicImpressions != null && currentSnap.organicImpressions > 1000) {
      if (currentSnap.ctr != null && currentSnap.ctr < 0.02) {
        const priority = calculatePriority(currentSnap.sessions ?? 0, 0, currentSnap.avgPosition, currentSnap.conversionsJson);
        if (await upsertAlert(content.id, batchDate, "low_ctr", priority, currentSnap, null,
          `${currentSnap.organicImpressions} impressions/week but only ${(currentSnap.ctr * 100).toFixed(1)}% CTR${queryContext}. Rewrite title and meta description.`, alertMap
        )) generated++;
      }
    }

    // 6. Conversion drop: Content that previously drove conversions but has stopped
    // Fallback: If conversions never happened, check a massive drop in engagement (sessions by >50%)
    if (oldSnap) {
      const oldConversions = sumConversions(oldSnap.conversionsJson);
      const currentConversions = sumConversions(currentSnap.conversionsJson);

      if (oldConversions > 0 && currentConversions === 0) {
        const priority = calculatePriority(currentSnap.sessions ?? 0, 100, currentSnap.avgPosition, currentSnap.conversionsJson);
        // Boost priority since conversions are business-critical
        if (await upsertAlert(content.id, batchDate, "conversion_drop", Math.min(priority * 1.5, 100), currentSnap, oldSnap,
          `Content was driving ${oldConversions} conversions 4 weeks ago but has dropped to zero. Investigate conversion path and CTA placement.`, alertMap
        )) generated++;
      } else if (oldConversions === 0 && currentConversions === 0) {
        // Fallback to engagement drop if conversions were never populated
        const currentSessions = currentSnap.sessions ?? null;
        const oldSessions = oldSnap.sessions ?? null;
        if (currentSessions != null && oldSessions != null && oldSessions > 10) {
          const sessionDrop = ((oldSessions - currentSessions) / oldSessions) * 100;
          if (sessionDrop >= 50) {
             const priority = calculatePriority(currentSnap.sessions ?? 0, 100, currentSnap.avgPosition, currentSnap.conversionsJson);
             if (await upsertAlert(content.id, batchDate, "conversion_drop", Math.min(priority * 1.2, 100), currentSnap, oldSnap,
              `Sessions dropped by ${sessionDrop.toFixed(0)}% (${oldSessions} → ${currentSessions}) over 4 weeks, indicating a severe engagement risk. Investigate traffic quality and user experience.`, alertMap
            )) generated++;
          }
        }
      }
    }
  }

  return { generated };
}

async function upsertAlert(
  contentId: string,
  batchDate: Date,
  alertType: string,
  priorityScore: number,
  currentSnap: typeof contentSnapshots.$inferSelect,
  previousSnap: typeof contentSnapshots.$inferSelect | null,
  suggestedAction: string,
  alertMap: Map<string, typeof contentAlerts.$inferSelect>
): Promise<boolean> {
  const severity = priorityScore >= 70 ? "high" : priorityScore >= 40 ? "medium" : "low";

  const currentMetricsJson = {
    sessions: currentSnap.sessions,
    organicClicks: currentSnap.organicClicks,
    organicImpressions: currentSnap.organicImpressions,
    avgPosition: currentSnap.avgPosition,
    ctr: currentSnap.ctr,
    primaryQuery: currentSnap.primaryQuery,
    conversions: currentSnap.conversionsJson,
  };

  const previousMetricsJson = previousSnap ? {
    sessions: previousSnap.sessions,
    organicClicks: previousSnap.organicClicks,
    organicImpressions: previousSnap.organicImpressions,
    avgPosition: previousSnap.avgPosition,
    ctr: previousSnap.ctr,
    primaryQuery: previousSnap.primaryQuery,
    conversions: previousSnap.conversionsJson,
  } : null;

  const existing = alertMap.get(`${contentId}-${alertType}`);

  if (existing) {
    await db.update(contentAlerts).set({
      batchDate,
      severity,
      currentMetricsJson,
      previousMetricsJson,
      suggestedAction,
      priorityScore,
    }).where(eq(contentAlerts.id, existing.id));
    return false; // updated existing alert
  } else {
    await db.insert(contentAlerts).values({
      contentId,
      batchDate,
      alertType,
      severity,
      currentMetricsJson,
      previousMetricsJson,
      suggestedAction,
      priorityScore,
      status: "open",
    });
    return true; // new alert created
  }
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
