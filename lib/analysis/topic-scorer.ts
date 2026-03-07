import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { contentInventory } from "@/lib/db/schema";

export interface ScoredKeyword {
  keyword: string;
  searchVolume: number;
  keywordDifficulty: number;
  cpc: number;
  trendData: Array<{ month: number; year: number; search_volume: number }>;
  opportunityScore: number;
  scoreBreakdown: ScoreBreakdown;
  isCompetitorGap: boolean;
  competitorData?: Array<{ domain: string; position: number }>;
}

interface ScoreBreakdown {
  searchVolumeScore: number;
  difficultyScore: number;
  relevanceScore: number;
  contentGapScore: number;
  trendScore: number;
  competitorBoost: number;
  total: number;
}

/**
 * Score keywords 0-100 per PRD Section 5.1:
 * - Search volume (25%): higher is better
 * - Keyword difficulty (25%): lower is better (inverted)
 * - Relevance to vertical (20%): category match
 * - Content gap (15%): no existing content targeting this
 * - Trend momentum (15%): growing search interest
 */
export async function scoreKeywords(
  keywords: Array<{
    keyword: string;
    searchVolume: number;
    keywordDifficulty: number;
    cpc: number;
    trendData: Array<{ month: number; year: number; search_volume: number }>;
    isCompetitorGap?: boolean;
    competitorData?: Array<{ domain: string; position: number }>;
  }>,
  domainId: string,
  categories: string[]
): Promise<ScoredKeyword[]> {
  if (keywords.length === 0) return [];

  // Get max search volume for normalization
  const maxVolume = Math.max(...keywords.map((k) => k.searchVolume), 1);

  // Get existing content URLs/titles for content gap check
  const existingContent = await db
    .select({ title: contentInventory.title, url: contentInventory.url })
    .from(contentInventory)
    .where(eq(contentInventory.domainId, domainId));

  const existingKeywords = new Set<string>();
  for (const c of existingContent) {
    // Extract words from titles for rough keyword matching
    const words = (c.title ?? "").toLowerCase().split(/\s+/);
    for (const w of words) {
      if (w.length > 3) existingKeywords.add(w);
    }
  }

  const categorySet = new Set(categories.map((c) => c.toLowerCase()));

  const scored: ScoredKeyword[] = keywords.map((kw) => {
    // 1. Search volume score (25%): normalized 0-25
    const volumeScore = (Math.min(kw.searchVolume / maxVolume, 1)) * 25;

    // 2. Difficulty score (25%): inverted, lower difficulty = higher score
    const diffScore = ((100 - Math.min(kw.keywordDifficulty, 100)) / 100) * 25;

    // 3. Relevance score (20%): check if keyword relates to domain categories
    const relevanceScore = calculateRelevance(kw.keyword, categorySet) * 20;

    // 4. Content gap score (15%): higher if no existing content targets this
    const gapScore = calculateContentGap(kw.keyword, existingKeywords) * 15;

    // 5. Trend momentum score (15%): is search volume growing?
    const trendScore = calculateTrendMomentum(kw.trendData) * 15;

    // Competitor gap boost: +10 points if competitors rank and we don't
    const competitorBoost = kw.isCompetitorGap ? 10 : 0;

    const total = Math.min(volumeScore + diffScore + relevanceScore + gapScore + trendScore + competitorBoost, 100);

    return {
      keyword: kw.keyword,
      searchVolume: kw.searchVolume,
      keywordDifficulty: kw.keywordDifficulty,
      cpc: kw.cpc,
      trendData: kw.trendData,
      opportunityScore: Math.round(total * 10) / 10,
      scoreBreakdown: {
        searchVolumeScore: Math.round(volumeScore * 10) / 10,
        difficultyScore: Math.round(diffScore * 10) / 10,
        relevanceScore: Math.round(relevanceScore * 10) / 10,
        contentGapScore: Math.round(gapScore * 10) / 10,
        trendScore: Math.round(trendScore * 10) / 10,
        competitorBoost,
        total: Math.round(total * 10) / 10,
      },
      isCompetitorGap: kw.isCompetitorGap ?? false,
      competitorData: kw.competitorData,
    };
  });

  // Sort by opportunity score descending
  scored.sort((a, b) => b.opportunityScore - a.opportunityScore);

  return scored;
}

function calculateRelevance(keyword: string, categories: Set<string>): number {
  const kwLower = keyword.toLowerCase();
  const kwWords = kwLower.split(/\s+/);

  // Direct category match
  for (const cat of categories) {
    if (kwLower.includes(cat) || cat.includes(kwLower)) return 1.0;
  }

  // Partial word match
  let matches = 0;
  for (const word of kwWords) {
    for (const cat of categories) {
      if (cat.includes(word) || word.includes(cat)) {
        matches++;
        break;
      }
    }
  }

  if (kwWords.length > 0 && matches > 0) {
    return Math.min(matches / kwWords.length, 1.0) * 0.7;
  }

  // No match — still give base relevance of 0.3 (keywords came from domain's data)
  return 0.3;
}

function calculateContentGap(keyword: string, existingKeywords: Set<string>): number {
  const kwWords = keyword.toLowerCase().split(/\s+/).filter((w) => w.length > 3);

  if (kwWords.length === 0) return 1.0;

  // Check how many significant words already exist in content
  let overlaps = 0;
  for (const word of kwWords) {
    if (existingKeywords.has(word)) overlaps++;
  }

  const overlapRatio = overlaps / kwWords.length;

  // High overlap = low gap score (we already cover this)
  // Low overlap = high gap score (opportunity)
  return 1.0 - overlapRatio;
}

function calculateTrendMomentum(
  trendData: Array<{ month: number; year: number; search_volume: number }>
): number {
  if (!trendData || trendData.length < 3) return 0.5; // Neutral if no data

  // Sort by date (year, month)
  const sorted = [...trendData].sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return a.month - b.month;
  });

  // Compare recent 3 months vs older 3 months
  const recentMonths = sorted.slice(-3);
  const olderMonths = sorted.slice(0, Math.min(3, sorted.length - 3));

  if (olderMonths.length === 0) return 0.5;

  const recentAvg = recentMonths.reduce((s, m) => s + m.search_volume, 0) / recentMonths.length;
  const olderAvg = olderMonths.reduce((s, m) => s + m.search_volume, 0) / olderMonths.length;

  if (olderAvg === 0) return recentAvg > 0 ? 1.0 : 0.5;

  const growthRate = (recentAvg - olderAvg) / olderAvg;

  // Map growth rate to 0-1 score
  // >50% growth = 1.0, flat = 0.5, >50% decline = 0.0
  return Math.max(0, Math.min(1, 0.5 + growthRate));
}
