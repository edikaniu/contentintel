import { getCredentials } from "@/lib/credentials/credential-store";

interface SemrushResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface SemrushKeywordData {
  keyword: string;
  searchVolume: number;
  keywordDifficulty: number;
  cpc: number;
  trendData: Array<{ month: number; year: number; search_volume: number }>;
}

/**
 * Parse SEMrush CSV response (semicolon-delimited) into rows of objects.
 * First line = headers, remaining lines = data rows.
 * SEMrush returns "ERROR 50 :: NOTHING FOUND" when no results.
 */
function parseSemrushCsv(text: string, expectedColumns: string[]): Record<string, string>[] {
  const trimmed = text.trim();
  if (!trimmed || trimmed.startsWith("ERROR")) return [];

  const lines = trimmed.split("\n");
  if (lines.length < 2) return [];

  const headers = lines[0].split(";").map((h) => h.trim());
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const vals = lines[i].split(";");
    if (vals.length < headers.length) continue;
    const row: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = vals[j]?.trim() ?? "";
    }
    rows.push(row);
  }

  return rows;
}

function rowToKeywordData(row: Record<string, string>): SemrushKeywordData {
  return {
    keyword: row["Keyword"] ?? row["Ph"] ?? "",
    searchVolume: parseInt(row["Search Volume"] ?? row["Nq"] ?? "0", 10) || 0,
    keywordDifficulty: parseFloat(row["Keyword Difficulty"] ?? row["Kd"] ?? "0") || 0,
    cpc: parseFloat(row["CPC"] ?? row["Cp"] ?? "0") || 0,
    trendData: [], // SEMrush CSV doesn't include monthly trend in these endpoints
  };
}

export async function getSemrushClient(orgId: string) {
  const creds = await getCredentials(orgId, "semrush");
  if (!creds) return null;

  const apiKey = creds.api_key;
  const baseUrl = "https://api.semrush.com/";
  const unitsUrl = `https://api.semrush.com/management/v1/units?key=${apiKey}`;

  async function semrushGet(params: Record<string, string>): Promise<SemrushResult<string>> {
    try {
      const searchParams = new URLSearchParams({ key: apiKey, ...params });
      const res = await fetch(`${baseUrl}?${searchParams.toString()}`);

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        if (res.status === 402 || body.includes("API units balance is zero")) {
          return { success: false, error: `SEMrush: Insufficient credits (${res.status}). ${body.slice(0, 200)}` };
        }
        return { success: false, error: `SEMrush API error: ${res.status} ${res.statusText}. ${body.slice(0, 200)}` };
      }

      const text = await res.text();
      if (text.trim().startsWith("ERROR")) {
        // SEMrush returns "ERROR XX :: MESSAGE" for various issues
        if (text.includes("NOTHING FOUND")) {
          return { success: true, data: "" }; // No results is not an error
        }
        return { success: false, error: `SEMrush: ${text.trim().slice(0, 200)}` };
      }

      return { success: true, data: text };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Failed to connect to SEMrush",
      };
    }
  }

  return {
    async testConnection(): Promise<SemrushResult<{ units: number }>> {
      try {
        const res = await fetch(unitsUrl);
        if (!res.ok) {
          return { success: false, error: `SEMrush API error: ${res.status} ${res.statusText}` };
        }
        const text = await res.text();
        const units = parseInt(text, 10);
        if (isNaN(units)) {
          return { success: false, error: `Unexpected SEMrush response: ${text.slice(0, 200)}` };
        }
        return { success: true, data: { units } };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : "Failed to connect to SEMrush",
        };
      }
    },

    async getUnitBalance(): Promise<SemrushResult<{ units: number }>> {
      try {
        const res = await fetch(unitsUrl);
        if (!res.ok) {
          return { success: false, error: `SEMrush API error: ${res.status} ${res.statusText}` };
        }
        const text = await res.text();
        const units = parseInt(text, 10);
        if (isNaN(units)) {
          return { success: false, error: `Unexpected SEMrush response: ${text.slice(0, 200)}` };
        }
        return { success: true, data: { units } };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : "Failed to connect to SEMrush",
        };
      }
    },

    /**
     * Get keyword suggestions (broad match) via SEMrush phrase_this endpoint.
     * Equivalent to DataforSEO's getKeywordSuggestions.
     */
    async getKeywordSuggestions(
      keyword: string,
      database: string,
      limit: number = 30
    ): Promise<SemrushResult<SemrushKeywordData[]>> {
      const result = await semrushGet({
        type: "phrase_this",
        phrase: keyword,
        database,
        export_columns: "Ph,Nq,Kd,Cp",
        display_limit: String(limit),
      });

      if (!result.success) return { success: false, error: result.error };
      if (!result.data) return { success: true, data: [] };

      const rows = parseSemrushCsv(result.data, ["Ph", "Nq", "Kd", "Cp"]);
      return { success: true, data: rows.map(rowToKeywordData) };
    },

    /**
     * Get related keywords via SEMrush phrase_related endpoint.
     * Equivalent to DataforSEO's getRelatedKeywords.
     */
    async getRelatedKeywords(
      keyword: string,
      database: string,
      limit: number = 30
    ): Promise<SemrushResult<SemrushKeywordData[]>> {
      const result = await semrushGet({
        type: "phrase_related",
        phrase: keyword,
        database,
        export_columns: "Ph,Nq,Kd,Cp",
        display_limit: String(limit),
      });

      if (!result.success) return { success: false, error: result.error };
      if (!result.data) return { success: true, data: [] };

      const rows = parseSemrushCsv(result.data, ["Ph", "Nq", "Kd", "Cp"]);
      return { success: true, data: rows.map(rowToKeywordData) };
    },

    /**
     * Get keyword overview (volume, difficulty, CPC) for a single keyword.
     */
    async getKeywordOverview(
      keyword: string,
      database: string
    ): Promise<SemrushResult<SemrushKeywordData | null>> {
      const result = await semrushGet({
        type: "phrase_this",
        phrase: keyword,
        database,
        export_columns: "Ph,Nq,Kd,Cp",
        display_limit: "1",
      });

      if (!result.success) return { success: false, error: result.error };
      if (!result.data) return { success: true, data: null };

      const rows = parseSemrushCsv(result.data, ["Ph", "Nq", "Kd", "Cp"]);
      return { success: true, data: rows.length > 0 ? rowToKeywordData(rows[0]) : null };
    },
  };
}
