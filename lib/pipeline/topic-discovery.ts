import { eq, and, ilike, ne, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { domains, topicRecommendations, contentInventory } from "@/lib/db/schema";
import { getKeywordSuggestions, getRelatedKeywords, getSerpResults, hasKeywordProvider } from "@/lib/data-sources/keyword-provider";
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
  console.log(`[Topic Discovery] ${domain.domain}: ${seedResult.seeds.length} seeds found (skipped: ${seedResult.skipped})`);
  if (seedResult.skipped || seedResult.seeds.length === 0) {
    return { topicsGenerated: 0, skipped: true, error: seedResult.error ?? "No seed keywords" };
  }

  // Step 2: Keyword expansion via DataforSEO → SEMrush failover
  const hasProvider = await hasKeywordProvider(orgId);
  if (!hasProvider) {
    return { topicsGenerated: 0, skipped: true, error: "Neither DataforSEO nor SEMrush is configured" };
  }

  const semrushDb = domain.semrushDatabase;
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
  const minVolume = 10;

  // Expand each seed cluster (pick top seeds per cluster to limit API calls)
  for (const [clusterName, clusterSeeds] of seedClusters) {
    const topSeeds = clusterSeeds
      .sort((a, b) => b.searchVolume - a.searchVolume)
      .slice(0, 3);

    for (const seed of topSeeds) {
      // Get keyword suggestions (with DataforSEO → SEMrush failover)
      const suggestions = await getKeywordSuggestions(
        orgId, seed.keyword, locationCode, languageCode, 30, semrushDb
      );
      if (suggestions.success && suggestions.data) {
        let added = 0;
        for (const kw of suggestions.data) {
          if (kw.searchVolume >= minVolume && !seenKeywords.has(kw.keyword.toLowerCase())) {
            seenKeywords.add(kw.keyword.toLowerCase());
            allExpandedKeywords.push(kw);
            added++;
          }
        }
        console.log(`[Topic Discovery] Suggestions for "${seed.keyword}" (${suggestions.source}): ${suggestions.data.length} returned, ${added} passed volume filter`);
      } else {
        console.log(`[Topic Discovery] Suggestions for "${seed.keyword}" failed: ${suggestions.error ?? "no data"}`);
      }

      // Get related keywords (with DataforSEO → SEMrush failover)
      const related = await getRelatedKeywords(
        orgId, seed.keyword, locationCode, languageCode, 30, semrushDb
      );
      if (related.success && related.data) {
        let added = 0;
        for (const kw of related.data) {
          if (kw.searchVolume >= minVolume && !seenKeywords.has(kw.keyword.toLowerCase())) {
            seenKeywords.add(kw.keyword.toLowerCase());
            allExpandedKeywords.push(kw);
            added++;
          }
        }
        console.log(`[Topic Discovery] Related for "${seed.keyword}" (${related.source}): ${related.data.length} returned, ${added} passed volume filter`);
      } else {
        console.log(`[Topic Discovery] Related for "${seed.keyword}" failed: ${related.error ?? "no data"}`);
      }
    }
  }

  // Fallback: if expansion returned nothing, use seeds directly as keywords
  if (allExpandedKeywords.length === 0 && seedResult.seeds.length > 0) {
    console.log(`[Topic Discovery] ${domain.domain}: Expansion returned 0 keywords, falling back to ${seedResult.seeds.length} seeds`);
    for (const seed of seedResult.seeds) {
      if (!seenKeywords.has(seed.keyword.toLowerCase())) {
        seenKeywords.add(seed.keyword.toLowerCase());
        allExpandedKeywords.push({
          keyword: seed.keyword,
          searchVolume: seed.searchVolume > 0 ? seed.searchVolume : 50,
          keywordDifficulty: 50,
          cpc: 0,
          trendData: [],
        });
      }
    }
  }

  console.log(`[Topic Discovery] ${domain.domain}: ${allExpandedKeywords.length} keywords after expansion (minVolume: ${minVolume})`);

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

  console.log(`[Topic Discovery] ${domain.domain}: ${scored.length} scored, ${clusters.length} clusters`);

  if (clusters.length === 0) {
    return { topicsGenerated: 0, skipped: false, error: `No topic clusters generated (${allExpandedKeywords.length} expanded, ${scored.length} scored)` };
  }

  // Step 6: SERP analysis for top clusters (with DataforSEO → SEMrush failover)
  const serpDataMap = new Map<string, { topResults: Array<{ title: string; url: string; domain: string; position: number }>; serpFeatures: string[] }>();
  for (const cluster of clusters.slice(0, 30)) {
    const serpResult = await getSerpResults(
      orgId, cluster.primaryKeyword, locationCode, languageCode, semrushDb
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

  // Step 8: Save topic recommendations (skip duplicates + cannibalization check)
  // Fetch existing topics across ALL statuses (not just pending) to avoid duplicates
  const existingTopics = await db
    .select({ primaryKeyword: topicRecommendations.primaryKeyword })
    .from(topicRecommendations)
    .where(
      and(
        eq(topicRecommendations.domainId, domain.id),
        inArray(topicRecommendations.status, ["pending", "approved", "in_progress", "assigned"])
      )
    );
  const existingKeywords = new Set(
    existingTopics.map((t) => t.primaryKeyword.toLowerCase())
  );

  // Pre-fetch content inventory for cannibalization checks
  const inventoryTitles = await db
    .select({ id: contentInventory.id, title: contentInventory.title, url: contentInventory.url })
    .from(contentInventory)
    .where(eq(contentInventory.domainId, domain.id));

  let topicsGenerated = 0;
  let skippedCannibal = 0;
  let skippedDuplicate = 0;

  for (const cluster of clusters) {
    const kw = cluster.primaryKeyword.toLowerCase();

    // Skip if this topic already exists (any active status)
    if (existingKeywords.has(kw)) {
      skippedDuplicate++;
      continue;
    }

    // Cannibalization check: do we already have content covering this keyword?
    const words = kw.split(/\s+/).filter(Boolean).slice(0, 3);
    if (words.length > 0) {
      const pattern = `%${words.join("%")}%`;
      const cannibalMatches = inventoryTitles.filter((item) => {
        const title = (item.title ?? "").toLowerCase();
        const url = item.url.toLowerCase();
        return title.includes(words.join(" ")) ||
          words.every((w) => title.includes(w)) ||
          words.every((w) => url.includes(w));
      });

      if (cannibalMatches.length > 0) {
        console.log(`[Topic Discovery] Skipping "${cluster.primaryKeyword}" — cannibalization risk with ${cannibalMatches.length} existing page(s): ${cannibalMatches[0].title}`);
        skippedCannibal++;
        continue;
      }
    }

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
    existingKeywords.add(kw); // prevent duplicates within same batch
  }

  console.log(`[Topic Discovery] ${domain.domain}: ${topicsGenerated} topics saved, ${skippedDuplicate} duplicates skipped, ${skippedCannibal} cannibalization risks skipped`);
  return { topicsGenerated, skipped: false };
}
