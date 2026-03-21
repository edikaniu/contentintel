import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/middleware";
import { db } from "@/lib/db";
import { contentAlerts, contentInventory, domains } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    const { searchParams } = new URL(req.url);
    const domainId = searchParams.get("domainId");
    const status = searchParams.get("status");
    const alertType = searchParams.get("alertType");
    const format = searchParams.get("format");

    if (!domainId) {
      return NextResponse.json(
        { error: "domainId is required" },
        { status: 400 }
      );
    }

    // Verify domain belongs to user's org
    const domain = await db
      .select()
      .from(domains)
      .where(
        and(eq(domains.id, domainId), eq(domains.orgId, session!.user.orgId))
      )
      .then((rows) => rows[0] ?? null);

    if (!domain) {
      return NextResponse.json(
        { error: "Domain not found" },
        { status: 404 }
      );
    }

    // Build filter conditions
    const conditions = [eq(contentInventory.domainId, domainId)];

    if (status) {
      conditions.push(eq(contentAlerts.status, status));
    }

    if (alertType) {
      conditions.push(eq(contentAlerts.alertType, alertType));
    }

    const alerts = await db
      .select({
        alert: contentAlerts,
        contentTitle: contentInventory.title,
        contentUrl: contentInventory.url,
      })
      .from(contentAlerts)
      .innerJoin(
        contentInventory,
        eq(contentAlerts.contentId, contentInventory.id)
      )
      .where(and(...conditions))
      .orderBy(desc(contentAlerts.priorityScore));

    // CSV export
    if (format === "csv") {
      const headers = [
        "Content Title",
        "Content URL",
        "Alert Type",
        "Severity",
        "Suggested Action",
        "Priority Score",
        "Status",
        "Enriched",
        "Created At",
      ];

      const rows = alerts.map((a) => [
        `"${(a.contentTitle || "").replace(/"/g, '""')}"`,
        `"${(a.contentUrl || "").replace(/"/g, '""')}"`,
        a.alert.alertType,
        a.alert.severity,
        `"${(a.alert.suggestedAction || "").replace(/"/g, '""')}"`,
        a.alert.priorityScore ?? "",
        a.alert.status,
        a.alert.lastEnrichedAt ? "Yes" : "No",
        a.alert.createdAt?.toISOString() ?? "",
      ]);

      const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join(
        "\n"
      );

      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="alerts-${domainId}.csv"`,
        },
      });
    }

    return NextResponse.json({ alerts });
  } catch (err) {
    console.error("List alerts error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
