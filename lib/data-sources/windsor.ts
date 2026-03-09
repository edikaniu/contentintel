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
      const url = `${baseUrl}${path}${path.includes("?") ? "&" : "?"}api_key=${apiKey}`;
      const res = await fetch(url);

      if (!res.ok) {
        return {
          success: false,
          error: `Windsor API error: ${res.status} ${res.statusText}`,
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
      const params = new URLSearchParams({
        connector: "google_search_console",
        fields: "page,search_query,clicks,impressions,ctr,position",
        date_from: dateFrom,
        date_to: dateTo,
        account_id: gscProperty,
      });

      const result = await request<{ data?: Array<Record<string, unknown>> }>(
        `/all?${params.toString()}`
      );

      if (!result.success || !result.data) {
        return { success: false, error: result.error ?? "No GSC data returned" };
      }

      const rows = Array.isArray(result.data)
        ? result.data
        : result.data.data ?? [];

      const pageData: GSCPageData[] = (rows as Array<Record<string, unknown>>).map((row) => ({
        page: String(row.page ?? row.landing_page ?? ""),
        query: String(row.search_query ?? row.query ?? row.campaign ?? ""),
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
      const params = new URLSearchParams({
        connector: "ga4",
        fields: "page,sessions,users,engagement_rate,bounce_rate,conversions",
        date_from: dateFrom,
        date_to: dateTo,
        account_id: ga4AccountId,
      });

      const result = await request<{ data?: Array<Record<string, unknown>> }>(
        `/all?${params.toString()}`
      );

      if (!result.success || !result.data) {
        return { success: false, error: result.error ?? "No GA4 data returned" };
      }

      const rows = Array.isArray(result.data)
        ? result.data
        : result.data.data ?? [];

      const pageData: GA4PageData[] = (rows as Array<Record<string, unknown>>).map((row) => ({
        page: String(row.page ?? row.landing_page ?? ""),
        sessions: Number(row.sessions ?? 0),
        users: Number(row.users ?? 0),
        engagementRate: Number(row.engagement_rate ?? 0),
        bounceRate: Number(row.bounce_rate ?? 0),
        conversions: typeof row.conversions === "object" && row.conversions !== null
          ? (row.conversions as Record<string, number>)
          : {},
      }));

      return { success: true, data: pageData };
    },

    async listConnectedAccounts(): Promise<WindsorResult<WindsorAccount[]>> {
      const result = await request<
        Array<{ id: string; accounts?: Array<{ id?: string; name?: string }> }>
      >("/connectors");

      if (!result.success || !result.data) {
        return { success: false, error: result.error ?? "No data returned" };
      }

      const connectors = Array.isArray(result.data) ? result.data : [];
      const accounts: WindsorAccount[] = [];

      for (const connector of connectors) {
        const connectorId = connector.id;
        for (const acct of connector.accounts ?? []) {
          accounts.push({
            id: acct.id ?? "",
            name: acct.name ?? acct.id ?? "",
            type: connectorId,
          });
        }
      }

      return { success: true, data: accounts };
    },
  };
}
