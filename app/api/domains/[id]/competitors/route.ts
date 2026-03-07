import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { requireRole } from "@/lib/auth/middleware";
import { db } from "@/lib/db";
import { domains, competitors } from "@/lib/db/schema";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireRole("admin");
  if (error) return error;

  const { id: domainId } = await params;

  try {
    // Verify domain belongs to org
    const domain = await db
      .select({ id: domains.id })
      .from(domains)
      .where(and(eq(domains.id, domainId), eq(domains.orgId, session!.user.orgId)))
      .then((rows) => rows[0] ?? null);

    if (!domain) {
      return NextResponse.json({ error: "Domain not found" }, { status: 404 });
    }

    const { competitorDomain } = await req.json();
    if (!competitorDomain) {
      return NextResponse.json({ error: "Competitor domain is required" }, { status: 400 });
    }

    // Check limit
    const existing = await db
      .select()
      .from(competitors)
      .where(eq(competitors.domainId, domainId));

    if (existing.length >= 10) {
      return NextResponse.json({ error: "Maximum 10 competitors per domain" }, { status: 400 });
    }

    const [comp] = await db.insert(competitors).values({
      domainId, competitorDomain,
    }).returning();

    return NextResponse.json({ competitor: comp }, { status: 201 });
  } catch (err) {
    console.error("Add competitor error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireRole("admin");
  if (error) return error;

  const { id: domainId } = await params;

  try {
    // Verify domain belongs to org
    const domain = await db
      .select({ id: domains.id })
      .from(domains)
      .where(and(eq(domains.id, domainId), eq(domains.orgId, session!.user.orgId)))
      .then((rows) => rows[0] ?? null);

    if (!domain) {
      return NextResponse.json({ error: "Domain not found" }, { status: 404 });
    }

    const { competitorId } = await req.json();
    if (!competitorId) {
      return NextResponse.json({ error: "Competitor ID is required" }, { status: 400 });
    }

    await db.delete(competitors).where(eq(competitors.id, competitorId));

    return NextResponse.json({ message: "Competitor removed" });
  } catch (err) {
    console.error("Remove competitor error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
