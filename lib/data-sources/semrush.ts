import { getCredentials } from "@/lib/credentials/credential-store";

interface SemrushResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function getSemrushClient(orgId: string) {
  const creds = await getCredentials(orgId, "semrush");
  if (!creds) return null;

  const apiKey = creds.api_key;
  const unitsUrl = `https://api.semrush.com/management/v1/units?key=${apiKey}`;

  return {
    async testConnection(): Promise<
      SemrushResult<{ units: number }>
    > {
      try {
        const res = await fetch(unitsUrl);

        if (!res.ok) {
          return {
            success: false,
            error: `SEMrush API error: ${res.status} ${res.statusText}`,
          };
        }

        const text = await res.text();
        const units = parseInt(text, 10);

        if (isNaN(units)) {
          return {
            success: false,
            error: `Unexpected SEMrush response: ${text.slice(0, 200)}`,
          };
        }

        return { success: true, data: { units } };
      } catch (err) {
        return {
          success: false,
          error:
            err instanceof Error
              ? err.message
              : "Failed to connect to SEMrush",
        };
      }
    },

    async getUnitBalance(): Promise<SemrushResult<{ units: number }>> {
      try {
        const res = await fetch(unitsUrl);

        if (!res.ok) {
          return {
            success: false,
            error: `SEMrush API error: ${res.status} ${res.statusText}`,
          };
        }

        const text = await res.text();
        const units = parseInt(text, 10);

        if (isNaN(units)) {
          return {
            success: false,
            error: `Unexpected SEMrush response: ${text.slice(0, 200)}`,
          };
        }

        return { success: true, data: { units } };
      } catch (err) {
        return {
          success: false,
          error:
            err instanceof Error
              ? err.message
              : "Failed to connect to SEMrush",
        };
      }
    },
  };
}
