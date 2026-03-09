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

    // Separate into GSC and GA4 accounts
    const gscAccounts = result.data
      .filter((a) => a.type === "searchconsole")
      .map((a) => ({ id: a.id, name: a.name || a.id }));

    const ga4Accounts = result.data
      .filter((a) => a.type === "googleanalytics4" || a.type === "ga4")
      .map((a) => ({ id: a.id, name: a.name || a.id }));

    return NextResponse.json({ gscAccounts, ga4Accounts });
  } catch (err) {
    console.error("Windsor accounts error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
