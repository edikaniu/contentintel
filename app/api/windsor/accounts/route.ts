import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/middleware";
import { getWindsorClient } from "@/lib/data-sources/windsor";

export async function GET() {
  const { session, error } = await requireRole("admin");
  if (error) return error;

  try {
    const client = await getWindsorClient(session!.user.orgId);
    if (!client) {
      return NextResponse.json(
        { error: "Windsor not configured. Add your Windsor API key in Settings > Connections." },
        { status: 400 }
      );
    }

    const result = await client.listConnectedAccounts();
    if (!result.success || !result.data) {
      return NextResponse.json(
        { error: result.error ?? "Failed to fetch Windsor accounts" },
        { status: 502 }
      );
    }

    // Log raw accounts for debugging
    console.log("[Windsor Accounts] Raw accounts:", JSON.stringify(result.data));

    // Separate into GSC and GA4 accounts (match various datasource type names)
    const gscAccounts = result.data
      .filter((a) => {
        const t = a.type.toLowerCase();
        return t.includes("searchconsole") || t.includes("search_console") || t === "gsc";
      })
      .map((a) => ({ id: a.id, name: a.name || a.id }));

    const ga4Accounts = result.data
      .filter((a) => {
        const t = a.type.toLowerCase();
        return t.includes("analytics4") || t.includes("analytics_4") || t === "ga4";
      })
      .map((a) => ({ id: a.id, name: a.name || a.id }));

    return NextResponse.json({ gscAccounts, ga4Accounts, allAccounts: result.data });
  } catch (err) {
    console.error("Windsor accounts error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
