import { getCredentials } from "@/lib/credentials/credential-store";

interface WindsorResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface WindsorAccount {
  id: string;
  name: string;
  type: string;
}

interface GSCPageData {
  date: string;
  page: string;
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

interface GA4PageData {
  page: string;
  sessions: number;
  users: number;
  engagementRate: number;
  bounceRate: number;
  conversions: Record<string, number>;
}

export async function getWindsorClient(orgId: string) {
  const creds = await getCredentials(orgId, "windsor");
  if (!creds) return null;

  const apiKey = creds.api_key;
  const baseUrl = "https://connectors.windsor.ai";

  async function request<T>(path: string): Promise<WindsorResult<T>> {
    try {
      const url = `${baseUrl}${path}${path.includes("?") ? "&" : "?"}api_key=${encodeURIComponent(apiKey)}`;
      const res = await fetch(url);

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        return {
          success: false,
          error: `Windsor API error: ${res.status} ${res.statusText}${body ? ` — ${body.slice(0, 200)}` : ""}`,
        };
      }

      const json = await res.json();
      return { success: true, data: json as T };
    } catch (err) {
      return {
        success: false,
        error:
          err instanceof Error
            ? err.message
            : "Failed to connect to Windsor.ai",
      };
    }
  }

  return {
    async testConnection(): Promise<WindsorResult<{ connected: boolean }>> {
      const result = await request<unknown>("/all");

      if (!result.success) {
        return { success: false, error: result.error };
      }

      return { success: true, data: { connected: true } };
    },

    async getGSCData(
      gscProperty: string,
      dateFrom: string,
      dateTo: string
    ): Promise<WindsorResult<GSCPageData[]>> {
      // Use connector-specific endpoint per Windsor docs (not /all?connector=)
      const qs = `fields=date,page,query,clicks,impressions,ctr,position&date_from=${dateFrom}&date_to=${dateTo}&account_id=${encodeURIComponent(gscProperty)}`;

      const result = await request<{ data?: Array<Record<string, unknown>> }>(
        `/searchconsole?${qs}`
      );

      if (!result.success || !result.data) {
        return { success: false, error: result.error ?? "No GSC data returned" };
      }

      const rows = Array.isArray(result.data)
        ? result.data
        : result.data.data ?? [];

      const pageData: GSCPageData[] = (rows as Array<Record<string, unknown>>).map((row) => ({
        date: String(row.date ?? ""),
        page: String(row.page ?? row.landing_page ?? ""),
        query: String(row.query ?? row.search_query ?? row.campaign ?? ""),
        clicks: Number(row.clicks ?? 0),
        impressions: Number(row.impressions ?? 0),
        ctr: Number(row.ctr ?? 0),
        position: Number(row.position ?? 0),
      }));

      return { success: true, data: pageData };
    },

    async getGA4Data(
      ga4AccountId: string,
      dateFrom: string,
      dateTo: string
    ): Promise<WindsorResult<GA4PageData[]>> {
      // Use connector-specific endpoint per Windsor docs (not /all?connector=)
      const qs = `fields=page_path,sessions,users,engagement_rate,bounce_rate&date_from=${dateFrom}&date_to=${dateTo}&account_id=${encodeURIComponent(ga4AccountId)}`;

      const result = await request<{ data?: Array<Record<string, unknown>> }>(
        `/googleanalytics4?${qs}`
      );

      if (!result.success || !result.data) {
        return { success: false, error: result.error ?? "No GA4 data returned" };
      }

      const rows = Array.isArray(result.data)
        ? result.data
        : result.data.data ?? [];

      const pageData: GA4PageData[] = (rows as Array<Record<string, unknown>>).map((row) => ({
        page: String(row.page_path ?? row.page ?? row.landing_page ?? ""),
        sessions: Number(row.sessions ?? 0),
        users: Number(row.users ?? row.totalusers ?? 0),
        engagementRate: Number(row.engagement_rate ?? 0),
        bounceRate: Number(row.bounce_rate ?? 0),
        conversions: {},
      }));

      return { success: true, data: pageData };
    },

    async listConnectedAccounts(): Promise<WindsorResult<WindsorAccount[]>> {
      // Uses the onboard API (different base URL) to list connected data source accounts
      try {
        const url = `https://onboard.windsor.ai/api/common/ds-accounts?datasource=all&api_key=${apiKey}`;
        const res = await fetch(url);

        if (!res.ok) {
          return {
            success: false,
            error: `Windsor API error: ${res.status} ${res.statusText}`,
          };
        }

        const json = await res.json();
        const items = Array.isArray(json) ? json : json.data ?? json.accounts ?? [];
        const accounts: WindsorAccount[] = items.map((item: Record<string, unknown>) => ({
          id: String(item.account_id ?? item.id ?? ""),
          name: String(item.account_name ?? item.name ?? item.account_id ?? item.id ?? ""),
          type: String(item.datasource ?? item.ds_id ?? item.type ?? ""),
        }));

        return { success: true, data: accounts };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : "Failed to fetch Windsor accounts",
        };
      }
    },
  };
}
