import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { competitors, domains } from "@/lib/db/schema";
import { getDataForSEOClient } from "@/lib/data-sources/dataforseo";

export interface GapKeyword {
  keyword: string;
  searchVolume: number;
  keywordDifficulty: number;
  cpc: number;
  trendData: Array<{ month: number; year: number; search_volume: number }>;
  competitorData: Array<{ domain: string; position: number }>;
}

interface GapAnalysisResult {
  keywords: GapKeyword[];
  skipped: boolean;
  error?: string;
}

/**
 * Find keywords that competitors rank for (top 20) but the domain doesn't.
 * Uses DataforSEO domain_intersection endpoint.
 */
export async function analyzeCompetitorGap(
  orgId: string,
  domain: typeof domains.$inferSelect
): Promise<GapAnalysisResult> {
  const dfClient = await getDataForSEOClient(orgId);
  if (!dfClient) {
    return { keywords: [], skipped: true, error: "DataforSEO not configured" };
  }

  // Get competitors for this domain
  const comps = await db
    .select({ competitorDomain: competitors.competitorDomain })
    .from(competitors)
    .where(eq(competitors.domainId, domain.id));

  if (comps.length === 0) {
    return { keywords: [], skipped: true, error: "No competitors configured" };
  }

  const locationCode = domain.dataforseoLocation ?? 2566;
  const languageCode = domain.dataforseoLanguage ?? 1000;

  // Map: keyword -> gap data
  const gapMap = new Map<string, GapKeyword>();

  for (const comp of comps) {
    const result = await dfClient.getDomainIntersection(
      domain.domain,
      comp.competitorDomain,
      locationCode,
      languageCode,
      100
    );

    if (!result.success || !result.data) continue;

    for (const item of result.data) {
      if (!item.keyword || item.searchVolume < 100) continue;

      const existing = gapMap.get(item.keyword);
      if (existing) {
        // Add this competitor's data
        existing.competitorData.push({
          domain: comp.competitorDomain,
          position: item.competitorPosition,
        });
      } else {
        gapMap.set(item.keyword, {
          keyword: item.keyword,
          searchVolume: item.searchVolume,
          keywordDifficulty: item.keywordDifficulty,
          cpc: 0,
          trendData: [],
          competitorData: [{
            domain: comp.competitorDomain,
            position: item.competitorPosition,
          }],
        });
      }
    }
  }

  return {
    keywords: Array.from(gapMap.values()),
    skipped: false,
  };
}
