import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/middleware";
import { runOrgBatch } from "@/lib/pipeline/batch-runner";

/**
 * Manual batch re-run for the authenticated user's organisation.
 * Requires Admin or Owner role.
 */
export async function POST(req: NextRequest) {
  const { session, error } = await requireRole("admin");
  if (error) return error;

  try {
    console.log(`[Manual Batch] Triggered by ${session!.user.email} for org ${session!.user.orgId}`);
    const result = await runOrgBatch(session!.user.orgId);

    return NextResponse.json({
      message: "Batch completed",
      domains: result.domainResults.map((d) => ({
        domain: d.domain,
        contentSynced: d.contentSynced,
        snapshots: d.snapshotsCreated,
        alerts: d.alertsGenerated,
        topics: d.topicsGenerated,
        errors: d.errors,
        skipped: d.skippedSources,
      })),
    });
  } catch (err) {
    console.error("[Manual Batch] Error:", err);
    return NextResponse.json(
      { error: "Batch failed", details: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
