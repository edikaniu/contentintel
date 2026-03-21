import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/middleware";
import { db } from "@/lib/db";
import {
  topicRecommendations,
  contentAlerts,
  contentInventory,
  contentSnapshots,
  domains,
  users,
  weeklyBatches,
} from "@/lib/db/schema";
import { eq, and, gte, desc, sql, count, avg } from "drizzle-orm";
import { listCredentials } from "@/lib/credentials/credential-store";

export async function GET(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    const { searchParams } = new URL(req.url);
    const domainId = searchParams.get("domainId");

    if (!domainId) {
      return NextResponse.json(
        { error: "domainId is required" },
        { status: 400 }
      );
    }

    // Verify domain belongs to user's org
    const domain = await db
      .select()
      .from(domains)
      .where(
        and(eq(domains.id, domainId), eq(domains.orgId, session!.user.orgId))
      )
      .then((rows) => rows[0] ?? null);

    if (!domain) {
      return NextResponse.json(
        { error: "Domain not found" },
        { status: 404 }
      );
    }

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Configurable trend range: 7d, 30d, 90d (default 56 days / 8 weeks)
    const trendRange = searchParams.get("trendRange") ?? "56";
    const trendDays = Math.min(Math.max(parseInt(trendRange) || 56, 7), 365);
    const trendStartDate = new Date(now.getTime() - trendDays * 24 * 60 * 60 * 1000);

    // Run all queries in parallel
    const [
      newTopicsResult,
      openAlertsResult,
      avgScoreResult,
      approvedThisMonthResult,
      topRecommendations,
      recentActivity,
      alertsByTypeResult,
      organicTrendResult,
    ] = await Promise.all([
      // 1. New topics this week
      db
        .select({ count: count() })
        .from(topicRecommendations)
        .where(
          and(
            eq(topicRecommendations.domainId, domainId),
            gte(topicRecommendations.createdAt, sevenDaysAgo)
          )
        ),

      // 2. Open content alerts count
      db
        .select({ count: count() })
        .from(contentAlerts)
        .innerJoin(
          contentInventory,
          eq(contentAlerts.contentId, contentInventory.id)
        )
        .where(
          and(
            eq(contentInventory.domainId, domainId),
            eq(contentAlerts.status, "open")
          )
        ),

      // 3. Average opportunity score of recent topics (last 30 days)
      db
        .select({ avg: avg(topicRecommendations.opportunityScore) })
        .from(topicRecommendations)
        .where(
          and(
            eq(topicRecommendations.domainId, domainId),
            gte(topicRecommendations.createdAt, thirtyDaysAgo)
          )
        ),

      // 4. Topics approved this month
      db
        .select({ count: count() })
        .from(topicRecommendations)
        .where(
          and(
            eq(topicRecommendations.domainId, domainId),
            eq(topicRecommendations.status, "approved"),
            gte(topicRecommendations.updatedAt, thirtyDaysAgo)
          )
        ),

      // 5. Top 5 recommendations by opportunity score
      db
        .select()
        .from(topicRecommendations)
        .where(eq(topicRecommendations.domainId, domainId))
        .orderBy(desc(topicRecommendations.opportunityScore))
        .limit(5),

      // 6. Recent activity: last 5 status changes (join users for name)
      db
        .select({
          id: topicRecommendations.id,
          primaryKeyword: topicRecommendations.primaryKeyword,
          status: topicRecommendations.status,
          statusChangedBy: users.name,
          updatedAt: topicRecommendations.updatedAt,
        })
        .from(topicRecommendations)
        .leftJoin(users, eq(topicRecommendations.statusChangedBy, users.id))
        .where(
          and(
            eq(topicRecommendations.domainId, domainId),
            sql`${topicRecommendations.statusChangedBy} IS NOT NULL`
          )
        )
        .orderBy(desc(topicRecommendations.updatedAt))
        .limit(5),

      // 7. Alerts by type
      db
        .select({
          alertType: contentAlerts.alertType,
          count: count(),
        })
        .from(contentAlerts)
        .innerJoin(
          contentInventory,
          eq(contentAlerts.contentId, contentInventory.id)
        )
        .where(eq(contentInventory.domainId, domainId))
        .groupBy(contentAlerts.alertType),

      // 8. Organic trend: aggregate clicks/impressions by day over last 8 weeks
      db
        .select({
          week: sql<string>`to_char(date_trunc('day', ${contentSnapshots.snapshotDate}), 'YYYY-MM-DD')`.as(
            "week"
          ),
          totalClicks: sql<number>`COALESCE(SUM(${contentSnapshots.organicClicks}), 0)`.as(
            "total_clicks"
          ),
          totalImpressions:
            sql<number>`COALESCE(SUM(${contentSnapshots.organicImpressions}), 0)`.as(
              "total_impressions"
            ),
        })
        .from(contentSnapshots)
        .innerJoin(
          contentInventory,
          eq(contentSnapshots.contentId, contentInventory.id)
        )
        .where(
          and(
            eq(contentInventory.domainId, domainId),
            gte(contentSnapshots.snapshotDate, trendStartDate)
          )
        )
        .groupBy(
          sql`to_char(date_trunc('day', ${contentSnapshots.snapshotDate}), 'YYYY-MM-DD')`
        )
        .orderBy(
          sql`date_trunc('day', ${contentSnapshots.snapshotDate})`
        ),
    ]);

    // Format alerts by type as an object
    const alertsByType: Record<string, number> = {};
    for (const row of alertsByTypeResult) {
      alertsByType[row.alertType] = row.count;
    }

    // Diagnostic metadata: helps frontend explain why data might be empty
    const [credentials, lastBatch] = await Promise.all([
      listCredentials(session!.user.orgId),
      db.select()
        .from(weeklyBatches)
        .where(eq(weeklyBatches.domainId, domainId))
        .orderBy(desc(weeklyBatches.batchDate))
        .limit(1)
        .then((rows) => rows[0] ?? null),
    ]);

    const windsorCred = credentials.find((c) => c.provider === "windsor");
    const dataStatus = {
      windsorConfigured: !!windsorCred?.isConnected,
      hasSnapshots: organicTrendResult.length > 0,
      lastBatchDate: lastBatch?.batchDate ?? null,
      lastBatchStatus: lastBatch?.status ?? null,
    };

    return NextResponse.json({
      newTopicsThisWeek: newTopicsResult[0]?.count ?? 0,
      contentAlertsCount: openAlertsResult[0]?.count ?? 0,
      avgOpportunityScore: avgScoreResult[0]?.avg
        ? parseFloat(String(avgScoreResult[0].avg))
        : 0,
      topicsApprovedThisMonth: approvedThisMonthResult[0]?.count ?? 0,
      topRecommendations,
      recentActivity,
      alertsByType,
      organicTrend: organicTrendResult,
      dataStatus,
    });
  } catch (err) {
    console.error("Dashboard stats error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
