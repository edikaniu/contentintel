import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { requireRole } from "@/lib/auth/middleware";
import { db } from "@/lib/db";
import { domains, competitors } from "@/lib/db/schema";

export async function GET() {
  const { session, error } = await requireRole("viewer");
  if (error) return error;

  try {
    const orgDomains = await db
      .select()
      .from(domains)
      .where(eq(domains.orgId, session!.user.orgId));

    const result = await Promise.all(
      orgDomains.map(async (d) => {
        const comps = await db
          .select()
          .from(competitors)
          .where(eq(competitors.domainId, d.id));
        return { ...d, competitors: comps };
      })
    );

    return NextResponse.json({ domains: result });
  } catch (err) {
    console.error("List domains error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { session, error } = await requireRole("admin");
  if (error) return error;

  try {
    const body = await req.json();
    const {
      domain, displayName, vertical,
      dataforseoLocation, dataforseoLanguage,
      gscProperty, ga4AccountId, hubspotBlogId,
      competitors: competitorList, contentCategories,
      semrushEnabled, semrushDatabase,
    } = body;

    if (!domain || !displayName) {
      return NextResponse.json({ error: "Domain and display name are required" }, { status: 400 });
    }

    const result = await db.transaction(async (tx) => {
      const [newDomain] = await tx.insert(domains).values({
        orgId: session!.user.orgId,
        domain, displayName,
        vertical: vertical || null,
        dataforseoLocation: dataforseoLocation || 2566,
        dataforseoLanguage: dataforseoLanguage || 1000,
        gscProperty: gscProperty || null,
        ga4AccountId: ga4AccountId || null,
        hubspotBlogId: hubspotBlogId || null,
        contentCategoriesJson: contentCategories || [],
        semrushEnabled: semrushEnabled || false,
        semrushDatabase: semrushDatabase || null,
      }).returning();

      if (competitorList?.length > 0) {
        await tx.insert(competitors).values(
          competitorList.slice(0, 10).map((c: string) => ({
            domainId: newDomain.id, competitorDomain: c,
          }))
        );
      }

      return newDomain;
    });

    return NextResponse.json({ domain: result }, { status: 201 });
  } catch (err) {
    console.error("Create domain error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
