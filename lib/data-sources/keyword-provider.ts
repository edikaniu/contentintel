/**
 * Keyword Provider — failover wrapper for DataforSEO → SEMrush.
 *
 * Tries DataforSEO first. On 402 (insufficient credits) or failure,
 * falls back to SEMrush. If both fail, returns a clear error.
 */

import { getDataForSEOClient } from "@/lib/data-sources/dataforseo";
import { getSemrushClient } from "@/lib/data-sources/semrush";

export interface KeywordData {
  keyword: string;
  searchVolume: number;
  keywordDifficulty: number;
  cpc: number;
  trendData: Array<{ month: number; year: number; search_volume: number }>;
}

interface ProviderResult {
  success: boolean;
  data?: KeywordData[];
  error?: string;
  source?: "dataforseo" | "semrush" | "none";
}

// DataforSEO location codes → SEMrush database codes
const LOCATION_TO_DB: Record<number, string> = {
  2566: "ng", // Nigeria
  2840: "us", // United States
  2826: "uk", // United Kingdom
  2124: "ca", // Canada
  2356: "in", // India
  2036: "au", // Australia
  2276: "de", // Germany
  2250: "fr", // France
  2076: "br", // Brazil
  2710: "za", // South Africa
  2288: "gh", // Ghana
  2404: "ke", // Kenya
  2682: "sa", // Saudi Arabia
  2784: "ae", // UAE
  2702: "sg", // Singapore
  2458: "my", // Malaysia
  2360: "id", // Indonesia
  2608: "ph", // Philippines
  2380: "it", // Italy
  2724: "es", // Spain
};

function getSemrushDatabase(locationCode: number, domainSemrushDb?: string | null): string {
  if (domainSemrushDb) return domainSemrushDb;
  return LOCATION_TO_DB[locationCode] ?? "us";
}

function is402Error(error?: string): boolean {
  if (!error) return false;
  const lower = error.toLowerCase();
  return lower.includes("402") || lower.includes("insufficient") || lower.includes("balance") || lower.includes("credits");
}

/**
 * Get keyword suggestions with DataforSEO → SEMrush failover.
 */
export async function getKeywordSuggestions(
  orgId: string,
  keyword: string,
  locationCode: number,
  languageCode: number,
  limit: number = 30,
  semrushDatabase?: string | null
): Promise<ProviderResult> {
  // Try DataforSEO first
  const dfClient = await getDataForSEOClient(orgId);
  if (dfClient) {
    const result = await dfClient.getKeywordSuggestions(keyword, locationCode, languageCode, limit);
    if (result.success && result.data) {
      return { success: true, data: result.data, source: "dataforseo" };
    }
    // If not a 402, still try SEMrush as fallback
    console.log(`[KeywordProvider] DataforSEO suggestions failed for "${keyword}": ${result.error}`);
  }

  // Fallback to SEMrush
  const srClient = await getSemrushClient(orgId);
  if (srClient) {
    const db = getSemrushDatabase(locationCode, semrushDatabase);
    const result = await srClient.getKeywordSuggestions(keyword, db, limit);
    if (result.success && result.data) {
      return { success: true, data: result.data, source: "semrush" };
    }
    console.log(`[KeywordProvider] SEMrush suggestions also failed for "${keyword}": ${result.error}`);
    return {
      success: false,
      error: `Both providers failed for "${keyword}". DataforSEO: ${dfClient ? "402/error" : "not configured"}. SEMrush: ${result.error}`,
      source: "none",
    };
  }

  // Neither available
  if (!dfClient) {
    return { success: false, error: "Neither DataforSEO nor SEMrush is configured", source: "none" };
  }
  return { success: false, error: "DataforSEO failed and SEMrush is not configured", source: "none" };
}

/**
 * Get related keywords with DataforSEO → SEMrush failover.
 */
export async function getRelatedKeywords(
  orgId: string,
  keyword: string,
  locationCode: number,
  languageCode: number,
  limit: number = 30,
  semrushDatabase?: string | null
): Promise<ProviderResult> {
  // Try DataforSEO first
  const dfClient = await getDataForSEOClient(orgId);
  if (dfClient) {
    const result = await dfClient.getRelatedKeywords(keyword, locationCode, languageCode, limit);
    if (result.success && result.data) {
      return { success: true, data: result.data, source: "dataforseo" };
    }
    console.log(`[KeywordProvider] DataforSEO related failed for "${keyword}": ${result.error}`);
  }

  // Fallback to SEMrush
  const srClient = await getSemrushClient(orgId);
  if (srClient) {
    const db = getSemrushDatabase(locationCode, semrushDatabase);
    const result = await srClient.getRelatedKeywords(keyword, db, limit);
    if (result.success && result.data) {
      return { success: true, data: result.data, source: "semrush" };
    }
    console.log(`[KeywordProvider] SEMrush related also failed for "${keyword}": ${result.error}`);
    return {
      success: false,
      error: `Both providers failed for "${keyword}". DataforSEO: ${dfClient ? "402/error" : "not configured"}. SEMrush: ${result.error}`,
      source: "none",
    };
  }

  if (!dfClient) {
    return { success: false, error: "Neither DataforSEO nor SEMrush is configured", source: "none" };
  }
  return { success: false, error: "DataforSEO failed and SEMrush is not configured", source: "none" };
}

/**
 * Check if at least one keyword provider is available for an org.
 */
export async function hasKeywordProvider(orgId: string): Promise<boolean> {
  const dfClient = await getDataForSEOClient(orgId);
  if (dfClient) return true;
  const srClient = await getSemrushClient(orgId);
  return srClient !== null;
}
