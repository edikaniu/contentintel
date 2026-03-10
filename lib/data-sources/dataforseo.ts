import { getCredentials } from "@/lib/credentials/credential-store";

// DataforSEO language IDs → ISO language codes
const LANG_ID_TO_CODE: Record<number, string> = {
  1000: "en", 1001: "ar", 1002: "bn", 1003: "zh", 1004: "bg",
  1009: "nl", 1010: "fi", 1011: "fr", 1012: "de", 1014: "el",
  1015: "iw", 1016: "hi", 1018: "id", 1019: "it", 1020: "ja",
  1021: "ko", 1024: "no", 1025: "fa", 1026: "pl", 1027: "pt",
  1028: "ro", 1029: "ru", 1030: "sr", 1031: "sk", 1032: "sl",
  1033: "es", 1034: "sv", 1038: "th", 1039: "tr", 1040: "uk", 1041: "vi",
};

function langCode(id: number): string {
  return LANG_ID_TO_CODE[id] ?? "en";
}

interface DataForSEOResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function getDataForSEOClient(orgId: string) {
  const creds = await getCredentials(orgId, "dataforseo");
  if (!creds) return null;

  const auth = Buffer.from(`${creds.login}:${creds.password}`).toString(
    "base64"
  );
  const baseUrl = "https://api.dataforseo.com/v3";

  async function request<T>(
    path: string,
    options?: RequestInit
  ): Promise<DataForSEOResult<T>> {
    try {
      const res = await fetch(`${baseUrl}${path}`, {
        ...options,
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
          ...options?.headers,
        },
      });

      if (!res.ok) {
        return {
          success: false,
          error: `DataForSEO API error: ${res.status} ${res.statusText}`,
        };
      }

      const json = await res.json();

      if (json.status_code !== 20000) {
        return {
          success: false,
          error: json.status_message ?? "Unknown DataForSEO error",
        };
      }

      return { success: true, data: json.tasks?.[0]?.result?.[0] as T };
    } catch (err) {
      return {
        success: false,
        error:
          err instanceof Error
            ? err.message
            : "Failed to connect to DataForSEO",
      };
    }
  }

  return {
    async testConnection(): Promise<
      DataForSEOResult<{ balance: number; login: string }>
    > {
      const result = await request<{
        login: string;
        money: { balance: number };
      }>("/appendix/user_data");

      if (!result.success || !result.data) {
        return { success: false, error: result.error ?? "No data returned" };
      }

      return {
        success: true,
        data: {
          balance: result.data.money.balance,
          login: result.data.login,
        },
      };
    },

    async getAccountBalance(): Promise<DataForSEOResult<{ balance: number }>> {
      const result = await request<{ money: { balance: number } }>(
        "/appendix/user_data"
      );

      if (!result.success || !result.data) {
        return { success: false, error: result.error ?? "No data returned" };
      }

      return {
        success: true,
        data: { balance: result.data.money.balance },
      };
    },

    async getRankedKeywords(
      target: string,
      locationCode: number,
      languageCode: number,
      limit: number = 200
    ): Promise<DataForSEOResult<RankedKeyword[]>> {
      const result = await request<{ items?: RankedKeywordRaw[] }>(
        "/dataforseo_labs/google/ranked_keywords/live",
        {
          method: "POST",
          body: JSON.stringify([{
            target,
            location_code: locationCode,
            language_code: langCode(languageCode),
            limit,
            order_by: ["keyword_data.keyword_info.search_volume,desc"],
          }]),
        }
      );

      if (!result.success || !result.data) {
        return { success: false, error: result.error ?? "No data returned" };
      }

      const items = (result.data.items ?? []).map((item) => ({
        keyword: item.keyword_data?.keyword ?? "",
        searchVolume: item.keyword_data?.keyword_info?.search_volume ?? 0,
        keywordDifficulty: item.keyword_data?.keyword_properties?.keyword_difficulty ?? item.keyword_data?.keyword_info?.keyword_difficulty ?? 0,
        cpc: item.keyword_data?.keyword_info?.cpc ?? 0,
        position: item.ranked_serp_element?.serp_item?.rank_absolute ?? 0,
        trendData: item.keyword_data?.keyword_info?.monthly_searches ?? [],
      }));

      return { success: true, data: items };
    },

    async getKeywordSuggestions(
      keyword: string,
      locationCode: number,
      languageCode: number,
      limit: number = 50
    ): Promise<DataForSEOResult<KeywordData[]>> {
      const result = await request<{ items?: KeywordItemRaw[]; seed_keyword_data?: KeywordItemRaw }>(
        "/dataforseo_labs/google/keyword_suggestions/live",
        {
          method: "POST",
          body: JSON.stringify([{
            keyword,
            location_code: locationCode,
            language_code: langCode(languageCode),
            limit,
            include_serp_info: true,
          }]),
        }
      );

      if (!result.success || !result.data) {
        return { success: false, error: result.error ?? "No data returned" };
      }

      const parsed = parseKeywordItems(result.data.items ?? []);

      // Prepend the seed keyword's own metrics (returned separately by the API)
      if (result.data.seed_keyword_data) {
        const seedParsed = parseKeywordItems([result.data.seed_keyword_data]);
        if (seedParsed.length > 0) {
          parsed.unshift(seedParsed[0]);
        }
      }

      return { success: true, data: parsed };
    },

    async getRelatedKeywords(
      keyword: string,
      locationCode: number,
      languageCode: number,
      limit: number = 50
    ): Promise<DataForSEOResult<KeywordData[]>> {
      const result = await request<{ items?: KeywordItemRaw[]; seed_keyword_data?: KeywordItemRaw }>(
        "/dataforseo_labs/google/related_keywords/live",
        {
          method: "POST",
          body: JSON.stringify([{
            keyword,
            location_code: locationCode,
            language_code: langCode(languageCode),
            limit,
          }]),
        }
      );

      if (!result.success || !result.data) {
        return { success: false, error: result.error ?? "No data returned" };
      }

      const parsed = parseKeywordItems(result.data.items ?? []);

      // Prepend the seed keyword's own metrics (returned separately by the API)
      if (result.data.seed_keyword_data) {
        const seedParsed = parseKeywordItems([result.data.seed_keyword_data]);
        if (seedParsed.length > 0) {
          parsed.unshift(seedParsed[0]);
        }
      }

      return { success: true, data: parsed };
    },

    async getDomainIntersection(
      target1: string,
      target2: string,
      locationCode: number,
      languageCode: number,
      limit: number = 100
    ): Promise<DataForSEOResult<IntersectionKeyword[]>> {
      const result = await request<{ items?: IntersectionRaw[] }>(
        "/dataforseo_labs/google/domain_intersection/live",
        {
          method: "POST",
          body: JSON.stringify([{
            target1,
            target2,
            intersection_mode: "target2_not_target1",
            location_code: locationCode,
            language_code: langCode(languageCode),
            limit,
            order_by: ["keyword_data.keyword_info.search_volume,desc"],
            filters: [
              ["keyword_data.ranked_serp_element.serp_item.rank_absolute", "<=", 20],
            ],
          }]),
        }
      );

      if (!result.success || !result.data) {
        return { success: false, error: result.error ?? "No data returned" };
      }

      const items = (result.data.items ?? []).map((item) => ({
        keyword: item.keyword_data?.keyword ?? "",
        searchVolume: item.keyword_data?.keyword_info?.search_volume ?? 0,
        keywordDifficulty: item.keyword_data?.keyword_properties?.keyword_difficulty ?? item.keyword_data?.keyword_info?.keyword_difficulty ?? 0,
        competitorPosition: item.second_domain_serp_element?.serp_item?.rank_absolute ?? item.keyword_data?.ranked_serp_element?.serp_item?.rank_absolute ?? 0,
        competitorDomain: target2,
      }));

      return { success: true, data: items };
    },

    async getSerpResults(
      keyword: string,
      locationCode: number,
      languageCode: number
    ): Promise<DataForSEOResult<SerpResult>> {
      const result = await request<SerpResultRaw>(
        "/serp/google/organic/live/regular",
        {
          method: "POST",
          body: JSON.stringify([{
            keyword,
            location_code: locationCode,
            language_code: langCode(languageCode),
            depth: 10,
          }]),
        }
      );

      if (!result.success || !result.data) {
        return { success: false, error: result.error ?? "No data returned" };
      }

      const items = (result.data.items ?? []).filter((i) => i.type === "organic");
      const topResults = items.slice(0, 5).map((i) => ({
        title: i.title ?? "",
        url: i.url ?? "",
        domain: i.domain ?? "",
        position: i.rank_absolute ?? 0,
      }));

      const features: string[] = [];
      for (const item of result.data.items ?? []) {
        if (item.type && item.type !== "organic" && !features.includes(item.type)) {
          features.push(item.type);
        }
      }

      return {
        success: true,
        data: { topResults, serpFeatures: features },
      };
    },
  };
}

// --- Type definitions for DataforSEO API responses ---

interface RankedKeyword {
  keyword: string;
  searchVolume: number;
  keywordDifficulty: number;
  cpc: number;
  position: number;
  trendData: Array<{ month: number; year: number; search_volume: number }>;
}

interface RankedKeywordRaw {
  keyword_data?: {
    keyword?: string;
    keyword_info?: {
      search_volume?: number;
      keyword_difficulty?: number;
      cpc?: number;
      monthly_searches?: Array<{ month: number; year: number; search_volume: number }>;
    };
    keyword_properties?: {
      keyword_difficulty?: number;
    };
  };
  ranked_serp_element?: {
    serp_item?: { rank_absolute?: number };
  };
}

interface KeywordData {
  keyword: string;
  searchVolume: number;
  keywordDifficulty: number;
  cpc: number;
  trendData: Array<{ month: number; year: number; search_volume: number }>;
}

interface KeywordItemRaw {
  keyword_data?: {
    keyword?: string;
    keyword_info?: {
      search_volume?: number;
      keyword_difficulty?: number;
      cpc?: number;
      monthly_searches?: Array<{ month: number; year: number; search_volume: number }>;
    };
    keyword_properties?: {
      keyword_difficulty?: number;
    };
  };
  // related_keywords wraps items differently
  keyword?: string;
  keyword_info?: {
    search_volume?: number;
    keyword_difficulty?: number;
    cpc?: number;
    monthly_searches?: Array<{ month: number; year: number; search_volume: number }>;
  };
  keyword_properties?: {
    keyword_difficulty?: number;
  };
}

function parseKeywordItems(items: KeywordItemRaw[]): KeywordData[] {
  return items.map((item) => {
    const kd = item.keyword_data;
    const ki = kd?.keyword_info ?? item.keyword_info;
    const kp = kd?.keyword_properties ?? item.keyword_properties;
    return {
      keyword: kd?.keyword ?? item.keyword ?? "",
      searchVolume: ki?.search_volume ?? 0,
      keywordDifficulty: kp?.keyword_difficulty ?? ki?.keyword_difficulty ?? 0,
      cpc: ki?.cpc ?? 0,
      trendData: ki?.monthly_searches ?? [],
    };
  });
}

interface IntersectionKeyword {
  keyword: string;
  searchVolume: number;
  keywordDifficulty: number;
  competitorPosition: number;
  competitorDomain: string;
}

interface IntersectionRaw {
  keyword_data?: {
    keyword?: string;
    keyword_info?: {
      search_volume?: number;
      keyword_difficulty?: number;
    };
    keyword_properties?: {
      keyword_difficulty?: number;
    };
    ranked_serp_element?: {
      serp_item?: { rank_absolute?: number };
    };
  };
  second_domain_serp_element?: {
    serp_item?: { rank_absolute?: number };
  };
}

interface SerpResult {
  topResults: Array<{ title: string; url: string; domain: string; position: number }>;
  serpFeatures: string[];
}

interface SerpResultRaw {
  items?: Array<{
    type?: string;
    title?: string;
    url?: string;
    domain?: string;
    rank_absolute?: number;
  }>;
}
