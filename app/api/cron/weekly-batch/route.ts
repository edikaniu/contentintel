import { NextRequest, NextResponse } from "next/server";
import { runWeeklyBatchAllOrgs } from "@/lib/pipeline/batch-runner";

/**
 * Weekly batch job endpoint.
 * Triggered by Vercel Cron, secured with CRON_SECRET header check.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log("[Weekly Batch] Starting batch for all organisations...");
    const results = await runWeeklyBatchAllOrgs();

    const summary = results.map((r) => ({
      org: r.orgName,
      domains: r.domainResults.map((d) => ({
        domain: d.domain,
        contentSynced: d.contentSynced,
        snapshots: d.snapshotsCreated,
        alerts: d.alertsGenerated,
        topics: d.topicsGenerated,
        errors: d.errors,
        skipped: d.skippedSources,
      })),
    }));

    console.log("[Weekly Batch] Completed:", JSON.stringify(summary, null, 2));

    return NextResponse.json({
      message: "Weekly batch completed",
      orgsProcessed: results.length,
      summary,
    });
  } catch (err) {
    console.error("[Weekly Batch] Fatal error:", err);
    return NextResponse.json(
      { error: "Batch job failed", details: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
