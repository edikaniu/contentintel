import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/middleware";
import { db } from "@/lib/db";
import { contentAlerts, contentInventory, domains } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    const { id } = await params;
    const body = await req.json();
    const { status } = body;

    // Validate status
    const validStatuses = ["acknowledged", "resolved"];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Status must be 'acknowledged' or 'resolved'" },
        { status: 400 }
      );
    }

    // Fetch the alert with its content to verify org ownership
    const alertWithContent = await db
      .select({
        alert: contentAlerts,
        domainId: contentInventory.domainId,
      })
      .from(contentAlerts)
      .innerJoin(
        contentInventory,
        eq(contentAlerts.contentId, contentInventory.id)
      )
      .where(eq(contentAlerts.id, id))
      .then((rows) => rows[0] ?? null);

    if (!alertWithContent) {
      return NextResponse.json(
        { error: "Alert not found" },
        { status: 404 }
      );
    }

    // Verify domain belongs to user's org
    const domain = await db
      .select()
      .from(domains)
      .where(
        and(
          eq(domains.id, alertWithContent.domainId),
          eq(domains.orgId, session!.user.orgId)
        )
      )
      .then((rows) => rows[0] ?? null);

    if (!domain) {
      return NextResponse.json(
        { error: "Alert not found" },
        { status: 404 }
      );
    }

    // Update the alert
    const updated = await db
      .update(contentAlerts)
      .set({ status })
      .where(eq(contentAlerts.id, id))
      .returning();

    return NextResponse.json({ alert: updated[0] });
  } catch (err) {
    console.error("Update alert status error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
