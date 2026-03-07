import { db } from "@/lib/db";
import { domains, topicRecommendations } from "@/lib/db/schema";
import { getDataForSEOClient } from "@/lib/data-sources/dataforseo";
import { extractSeedKeywords, groupSeedsByClusters } from "@/lib/analysis/seed-extractor";
import { scoreKeywords } from "@/lib/analysis/topic-scorer";
import { clusterKeywords } from "@/lib/analysis/keyword-clusterer";
import { analyzeCompetitorGap } from "@/lib/analysis/gap-analyzer";
import { generateTopicAngles } from "@/lib/ai/topic-generator";

interface TopicDiscoveryResult {
  topicsGenerated: number;
  skipped: boolean;
  error?: string;
}

/**
 * Full topic discovery pipeline for a single domain.
 * Steps: seed extraction -> keyword expansion -> competitor gap -> scoring -> clustering -> SERP -> AI angles -> save
 */
export async function runTopicDiscovery(
  orgId: string,
  domain: typeof domains.$inferSelect,
  batchDate: Date
): Promise<TopicDiscoveryResult> {
  const locationCode = domain.dataforseoLocation ?? 2566;
  const languageCode = domain.dataforseoLanguage ?? 1000;
  const categories = Array.isArray(domain.contentCategoriesJson)
    ? (domain.contentCategoriesJson as string[])
    : [];

  // Step 1: Extract seed keywords
  const seedResult = await extractSeedKeywords(orgId, domain);
  if (seedResult.skipped || seedResult.seeds.length === 0) {
    return { topicsGenerated: 0, skipped: true, error: seedResult.error ?? "No seed keywords" };
  }

  // Step 2: Keyword expansion via DataforSEO
  const dfClient = await getDataForSEOClient(orgId);
  if (!dfClient) {
    return { topicsGenerated: 0, skipped: true, error: "DataforSEO not configured" };
  }

  const seedClusters = groupSeedsByClusters(seedResult.seeds, categories);
  const allExpandedKeywords: Array<{
    keyword: string;
    searchVolume: number;
    keywordDifficulty: number;
    cpc: number;
    trendData: Array<{ month: number; year: number; search_volume: number }>;
    isCompetitorGap?: boolean;
    competitorData?: Array<{ domain: string; position: number }>;
  }> = [];

  const seenKeywords = new Set<string>();
  const minVolume = 100;

  // Expand each seed cluster (pick top seeds per cluster to limit API calls)
  for (const [, clusterSeeds] of seedClusters) {
    const topSeeds = clusterSeeds
      .sort((a, b) => b.searchVolume - a.searchVolume)
      .slice(0, 3);

    for (const seed of topSeeds) {
      // Get keyword suggestions
      const suggestions = await dfClient.getKeywordSuggestions(
        seed.keyword, locationCode, languageCode, 30
      );
      if (suggestions.success && suggestions.data) {
        for (const kw of suggestions.data) {
          if (kw.searchVolume >= minVolume && !seenKeywords.has(kw.keyword.toLowerCase())) {
            seenKeywords.add(kw.keyword.toLowerCase());
            allExpandedKeywords.push(kw);
          }
        }
      }

      // Get related keywords
      const related = await dfClient.getRelatedKeywords(
        seed.keyword, locationCode, languageCode, 30
      );
      if (related.success && related.data) {
        for (const kw of related.data) {
          if (kw.searchVolume >= minVolume && !seenKeywords.has(kw.keyword.toLowerCase())) {
            seenKeywords.add(kw.keyword.toLowerCase());
            allExpandedKeywords.push(kw);
          }
        }
      }
    }
  }

  // Step 3: Competitor gap analysis
  const gapResult = await analyzeCompetitorGap(orgId, domain);
  if (!gapResult.skipped && gapResult.keywords.length > 0) {
    for (const gapKw of gapResult.keywords) {
      if (!seenKeywords.has(gapKw.keyword.toLowerCase())) {
        seenKeywords.add(gapKw.keyword.toLowerCase());
        allExpandedKeywords.push({
          ...gapKw,
          isCompetitorGap: true,
        });
      } else {
        // Mark existing keyword as competitor gap
        const existing = allExpandedKeywords.find(
          (k) => k.keyword.toLowerCase() === gapKw.keyword.toLowerCase()
        );
        if (existing) {
          existing.isCompetitorGap = true;
          existing.competitorData = gapKw.competitorData;
        }
      }
    }
  }

  // Step 4: Score all keywords
  const scored = await scoreKeywords(allExpandedKeywords, domain.id, categories);

  // Step 5: Cluster into topics
  const clusters = clusterKeywords(scored, 30);

  if (clusters.length === 0) {
    return { topicsGenerated: 0, skipped: false, error: "No topic clusters generated" };
  }

  // Step 6: SERP analysis for top clusters
  const serpDataMap = new Map<string, { topResults: Array<{ title: string; url: string; domain: string; position: number }>; serpFeatures: string[] }>();
  for (const cluster of clusters.slice(0, 30)) {
    const serpResult = await dfClient.getSerpResults(
      cluster.primaryKeyword, locationCode, languageCode
    );
    if (serpResult.success && serpResult.data) {
      serpDataMap.set(cluster.primaryKeyword, serpResult.data);
    }
  }

  // Step 7: AI angle generation for top clusters
  const vertical = domain.vertical ?? "general";
  const aiResult = await generateTopicAngles(
    orgId,
    clusters.slice(0, 30).map((c) => ({
      primaryKeyword: c.primaryKeyword,
      supportingKeywords: c.supportingKeywords.map((s) => s.keyword),
      vertical,
      competitorData: c.competitorData,
    }))
  );

  // Step 8: Save topic recommendations
  let topicsGenerated = 0;
  for (const cluster of clusters) {
    const aiData = aiResult.results.get(cluster.primaryKeyword);
    const serpData = serpDataMap.get(cluster.primaryKeyword);

    await db.insert(topicRecommendations).values({
      domainId: domain.id,
      batchDate,
      primaryKeyword: cluster.primaryKeyword,
      supportingKeywordsJson: cluster.supportingKeywords,
      searchVolume: cluster.primarySearchVolume,
      keywordDifficulty: cluster.primaryKeywordDifficulty,
      opportunityScore: cluster.opportunityScore,
      scoreBreakdownJson: cluster.scoreBreakdown,
      competitorDataJson: cluster.competitorData.length > 0 ? cluster.competitorData : null,
      serpFeaturesJson: serpData ?? null,
      suggestedContentType: aiData?.contentType ?? null,
      aiAngle: aiData?.angle ?? null,
      aiOutline: aiData?.outline ?? null,
      source: "discovery",
      status: "pending",
    });
    topicsGenerated++;
  }

  return { topicsGenerated, skipped: false };
}
