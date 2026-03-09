import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/middleware";
import { getHubSpotClient } from "@/lib/data-sources/hubspot";

export async function GET() {
  const { session, error } = await requireRole("admin");
  if (error) return error;

  try {
    const client = await getHubSpotClient(session!.user.orgId);
    if (!client) {
      return NextResponse.json(
        { error: "HubSpot not configured. Please add your access token in Connections." },
        { status: 404 }
      );
    }

    const result = await client.listBlogs();
    if (!result.success) {
      return NextResponse.json(
        { error: result.error ?? "Failed to fetch blogs" },
        { status: 502 }
      );
    }

    return NextResponse.json({ blogs: result.data ?? [] });
  } catch (err) {
    console.error("List HubSpot blogs error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
