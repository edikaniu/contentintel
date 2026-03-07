import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { organisations, domains, weeklyBatches } from "@/lib/db/schema";
import { syncContentInventory } from "./content-sync";
import { pullGSCData } from "./gsc-pull";
import { pullGA4Data } from "./ga4-pull";
import { buildSnapshots } from "./snapshot-builder";
import { generateAlerts } from "./alert-generator";
import { runTopicDiscovery } from "./topic-discovery";

interface BatchResult {
  orgId: string;
  orgName: string;
  domainResults: DomainBatchResult[];
}

interface DomainBatchResult {
  domainId: string;
  domain: string;
  contentSynced: number;
  snapshotsCreated: number;
  alertsGenerated: number;
  topicsGenerated: number;
  errors: string[];
  skippedSources: string[];
}

/**
 * Run the full weekly batch pipeline for a single organisation.
 */
export async function runOrgBatch(orgId: string): Promise<BatchResult> {
  const org = await db
    .select()
    .from(organisations)
    .where(eq(organisations.id, orgId))
    .then((rows) => rows[0] ?? null);

  if (!org) {
    throw new Error(`Organisation ${orgId} not found`);
  }

  const orgDomains = await db
    .select()
    .from(domains)
    .where(eq(domains.orgId, orgId));

  const activeDomains = orgDomains.filter((d) => d.isActive);
  const domainResults: DomainBatchResult[] = [];

  for (const domain of activeDomains) {
    const result = await runDomainBatch(orgId, domain);
    domainResults.push(result);
  }

  return {
    orgId,
    orgName: org.name,
    domainResults,
  };
}

/**
 * Run the batch pipeline for a single domain.
 */
async function runDomainBatch(
  orgId: string,
  domain: typeof domains.$inferSelect
): Promise<DomainBatchResult> {
  const batchDate = new Date();
  const errors: string[] = [];
  const skippedSources: string[] = [];

  // Create batch record
  const batchRecord = await db
    .insert(weeklyBatches)
    .values({
      domainId: domain.id,
      batchDate,
      status: "running",
      startedAt: batchDate,
    })
    .returning({ id: weeklyBatches.id })
    .then((rows) => rows[0]);

  try {
    // Step 1: Content inventory sync from HubSpot
    const syncResult = await syncContentInventory(orgId, domain);
    if (syncResult.skipped) {
      skippedSources.push(`HubSpot: ${syncResult.error}`);
    } else if (syncResult.error) {
      errors.push(`HubSpot sync error: ${syncResult.error}`);
    }

    // Step 2: GSC data pull (last 7 days for current week, plus 4 weeks back for trends)
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 7);
    const fourWeeksStart = new Date(now);
    fourWeeksStart.setDate(fourWeeksStart.getDate() - 28);

    const gscResult = await pullGSCData(orgId, domain, weekStart, now);
    if (gscResult.skipped) {
      skippedSources.push(`GSC: ${gscResult.error}`);
    } else if (gscResult.error) {
      errors.push(`GSC pull error: ${gscResult.error}`);
    }

    // Step 3: GA4 data pull
    const ga4Result = await pullGA4Data(orgId, domain, weekStart, now);
    if (ga4Result.skipped) {
      skippedSources.push(`GA4: ${ga4Result.error}`);
    } else if (ga4Result.error) {
      errors.push(`GA4 pull error: ${ga4Result.error}`);
    }

    // Step 4: Build snapshots combining GSC + GA4 data
    const gscMap = new Map(
      gscResult.pages.map((p) => [
        p.page,
        {
          primaryQuery: p.primaryQuery,
          totalClicks: p.totalClicks,
          totalImpressions: p.totalImpressions,
          avgCtr: p.avgCtr,
          avgPosition: p.avgPosition,
        },
      ])
    );

    const ga4Map = new Map(
      ga4Result.pages.map((p) => [
        p.page,
        {
          sessions: p.sessions,
          users: p.users,
          engagementRate: p.engagementRate,
          bounceRate: p.bounceRate,
          conversions: p.conversions,
        },
      ])
    );

    const snapshotResult = await buildSnapshots(domain, batchDate, gscMap, ga4Map);
    if (snapshotResult.error) {
      errors.push(`Snapshot build error: ${snapshotResult.error}`);
    }

    // Step 5: Generate alerts
    const alertResult = await generateAlerts(domain, batchDate);
    if (alertResult.error) {
      errors.push(`Alert generation error: ${alertResult.error}`);
    }

    // Step 6: Topic discovery pipeline
    const topicResult = await runTopicDiscovery(orgId, domain, batchDate);
    if (topicResult.skipped) {
      skippedSources.push(`Topic Discovery: ${topicResult.error}`);
    } else if (topicResult.error) {
      errors.push(`Topic discovery error: ${topicResult.error}`);
    }

    // Update batch record
    await db
      .update(weeklyBatches)
      .set({
        status: "completed",
        topicsGenerated: topicResult.topicsGenerated,
        alertsGenerated: alertResult.generated,
        completedAt: new Date(),
        errorLog: errors.length > 0 ? errors.join("\n") : null,
      })
      .where(eq(weeklyBatches.id, batchRecord.id));

    return {
      domainId: domain.id,
      domain: domain.domain,
      contentSynced: syncResult.synced,
      snapshotsCreated: snapshotResult.created,
      alertsGenerated: alertResult.generated,
      topicsGenerated: topicResult.topicsGenerated,
      errors,
      skippedSources,
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    errors.push(errorMsg);

    await db
      .update(weeklyBatches)
      .set({
        status: "failed",
        completedAt: new Date(),
        errorLog: errors.join("\n"),
      })
      .where(eq(weeklyBatches.id, batchRecord.id));

    return {
      domainId: domain.id,
      domain: domain.domain,
      contentSynced: 0,
      snapshotsCreated: 0,
      alertsGenerated: 0,
      topicsGenerated: 0,
      errors,
      skippedSources,
    };
  }
}

/**
 * Run the weekly batch for ALL active organisations.
 * Used by the cron job.
 */
export async function runWeeklyBatchAllOrgs(): Promise<BatchResult[]> {
  const allOrgs = await db
    .select({ id: organisations.id })
    .from(organisations);

  const results: BatchResult[] = [];

  for (const org of allOrgs) {
    try {
      const result = await runOrgBatch(org.id);
      results.push(result);
    } catch (err) {
      console.error(`Batch failed for org ${org.id}:`, err);
      results.push({
        orgId: org.id,
        orgName: "Unknown",
        domainResults: [{
          domainId: "",
          domain: "",
          contentSynced: 0,
          snapshotsCreated: 0,
          alertsGenerated: 0,
          topicsGenerated: 0,
          errors: [err instanceof Error ? err.message : "Unknown error"],
          skippedSources: [],
        }],
      });
    }
  }

  return results;
}
