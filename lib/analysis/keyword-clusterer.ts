import type { ScoredKeyword } from "./topic-scorer";

export interface TopicCluster {
  primaryKeyword: string;
  primarySearchVolume: number;
  primaryKeywordDifficulty: number;
  supportingKeywords: Array<{
    keyword: string;
    searchVolume: number;
    keywordDifficulty: number;
  }>;
  opportunityScore: number;
  scoreBreakdown: Record<string, number>;
  isCompetitorGap: boolean;
  competitorData: Array<{ domain: string; position: number }>;
  trendData: Array<{ month: number; year: number; search_volume: number }>;
}

/**
 * Group scored keywords into topic clusters.
 * Keywords sharing 2+ significant words are grouped together.
 * Each cluster becomes one topic recommendation.
 */
export function clusterKeywords(
  keywords: ScoredKeyword[],
  maxClusters: number = 30
): TopicCluster[] {
  if (keywords.length === 0) return [];

  // Build word index for matching
  const keywordWords = keywords.map((kw) => ({
    kw,
    words: extractSignificantWords(kw.keyword),
  }));

  const assigned = new Set<number>();
  const clusters: TopicCluster[] = [];

  // Process keywords in score order (highest first)
  for (let i = 0; i < keywordWords.length; i++) {
    if (assigned.has(i)) continue;

    const primary = keywordWords[i];
    assigned.add(i);

    const supporting: ScoredKeyword[] = [];

    // Find related keywords (share 2+ significant words)
    for (let j = i + 1; j < keywordWords.length; j++) {
      if (assigned.has(j)) continue;
      if (supporting.length >= 5) break; // Cap at 5 supporting keywords

      const candidate = keywordWords[j];
      const sharedWords = countSharedWords(primary.words, candidate.words);

      if (sharedWords >= 2 || isSubstring(primary.kw.keyword, candidate.kw.keyword)) {
        supporting.push(candidate.kw);
        assigned.add(j);
      }
    }

    // Merge competitor data from all keywords in cluster
    const allCompetitorData: Array<{ domain: string; position: number }> = [];
    const seenCompDomains = new Set<string>();

    for (const kw of [primary.kw, ...supporting]) {
      if (kw.competitorData) {
        for (const cd of kw.competitorData) {
          if (!seenCompDomains.has(cd.domain)) {
            allCompetitorData.push(cd);
            seenCompDomains.add(cd.domain);
          }
        }
      }
    }

    clusters.push({
      primaryKeyword: primary.kw.keyword,
      primarySearchVolume: primary.kw.searchVolume,
      primaryKeywordDifficulty: primary.kw.keywordDifficulty,
      supportingKeywords: supporting.map((s) => ({
        keyword: s.keyword,
        searchVolume: s.searchVolume,
        keywordDifficulty: s.keywordDifficulty,
      })),
      opportunityScore: primary.kw.opportunityScore,
      scoreBreakdown: primary.kw.scoreBreakdown as unknown as Record<string, number>,
      isCompetitorGap: primary.kw.isCompetitorGap || supporting.some((s) => s.isCompetitorGap),
      competitorData: allCompetitorData,
      trendData: primary.kw.trendData,
    });

    if (clusters.length >= maxClusters) break;
  }

  return clusters;
}

// Stop words to ignore when comparing keywords
const STOP_WORDS = new Set([
  "a", "an", "the", "in", "on", "at", "to", "for", "of", "and", "or",
  "is", "it", "by", "with", "from", "as", "be", "was", "are", "were",
  "been", "has", "have", "had", "do", "does", "did", "will", "would",
  "can", "could", "should", "may", "might", "not", "no", "vs", "how",
  "what", "when", "where", "which", "who", "why", "this", "that", "best",
  "top", "most",
]);

function extractSignificantWords(keyword: string): Set<string> {
  const words = keyword.toLowerCase().split(/\s+/);
  const significant = new Set<string>();
  for (const w of words) {
    if (w.length > 2 && !STOP_WORDS.has(w)) {
      significant.add(w);
    }
  }
  return significant;
}

function countSharedWords(a: Set<string>, b: Set<string>): number {
  let count = 0;
  for (const word of a) {
    if (b.has(word)) count++;
  }
  return count;
}

function isSubstring(a: string, b: string): boolean {
  const aLower = a.toLowerCase();
  const bLower = b.toLowerCase();
  return aLower.includes(bLower) || bLower.includes(aLower);
}
