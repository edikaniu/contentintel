import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { requireRole } from "@/lib/auth/middleware";
import { db } from "@/lib/db";
import { domains } from "@/lib/db/schema";

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireRole("admin");
  if (error) return error;

  try {
    const { id } = await ctx.params;
    const body = await req.json();

    // Verify domain belongs to this org
    const domain = await db
      .select({ id: domains.id })
      .from(domains)
      .where(and(eq(domains.id, id), eq(domains.orgId, session!.user.orgId)))
      .then((rows) => rows[0] ?? null);

    if (!domain) {
      return NextResponse.json({ error: "Domain not found" }, { status: 404 });
    }

    // Build update object from allowed fields
    const update: Record<string, unknown> = {};
    if ("hubspotBlogId" in body) update.hubspotBlogId = body.hubspotBlogId || null;
    if ("gscProperty" in body) update.gscProperty = body.gscProperty || null;
    if ("ga4AccountId" in body) update.ga4AccountId = body.ga4AccountId || null;
    if ("vertical" in body) update.vertical = body.vertical || null;
    if ("displayName" in body) update.displayName = body.displayName;
    if ("contentCategoriesJson" in body) update.contentCategoriesJson = body.contentCategoriesJson;

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    await db.update(domains).set(update).where(eq(domains.id, id));

    return NextResponse.json({ message: "Domain updated" });
  } catch (err) {
    console.error("Update domain error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
