import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/middleware";
import { db } from "@/lib/db";
import { topicRecommendations, domains } from "@/lib/db/schema";
import { eq, and, desc, asc, ilike } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    const { searchParams } = new URL(req.url);
    const domainId = searchParams.get("domainId");
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const sort = searchParams.get("sort");
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

    // Build conditions
    const conditions = [eq(topicRecommendations.domainId, domainId)];

    if (status) {
      conditions.push(eq(topicRecommendations.status, status));
    }

    if (search) {
      conditions.push(ilike(topicRecommendations.primaryKeyword, `%${search}%`));
    }

    // Determine sort order
    let orderBy;
    switch (sort) {
      case "volume":
        orderBy = desc(topicRecommendations.searchVolume);
        break;
      case "difficulty":
        orderBy = asc(topicRecommendations.keywordDifficulty);
        break;
      case "date":
        orderBy = desc(topicRecommendations.createdAt);
        break;
      case "score":
      default:
        orderBy = desc(topicRecommendations.opportunityScore);
        break;
    }

    const topics = await db
      .select()
      .from(topicRecommendations)
      .where(and(...conditions))
      .orderBy(orderBy);

    // CSV export
    if (format === "csv") {
      const headers = [
        "Primary Keyword",
        "Search Volume",
        "Keyword Difficulty",
        "Opportunity Score",
        "Suggested Content Type",
        "AI Angle",
        "Source",
        "Status",
        "Created At",
      ];

      const rows = topics.map((t) => [
        `"${(t.primaryKeyword || "").replace(/"/g, '""')}"`,
        t.searchVolume ?? "",
        t.keywordDifficulty ?? "",
        t.opportunityScore ?? "",
        `"${(t.suggestedContentType || "").replace(/"/g, '""')}"`,
        `"${(t.aiAngle || "").replace(/"/g, '""')}"`,
        t.source,
        t.status,
        t.createdAt?.toISOString() ?? "",
      ]);

      const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join(
        "\n"
      );

      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="topics-${domainId}.csv"`,
        },
      });
    }

    return NextResponse.json({ topics });
  } catch (err) {
    console.error("List topics error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    const body = await req.json();
    const {
      domainId,
      primaryKeyword,
      searchVolume,
      keywordDifficulty,
      opportunityScore,
      suggestedContentType,
      aiAngle,
      aiOutline,
      supportingKeywords,
      competitorData,
      serpFeatures,
      source,
    } = body;

    if (!domainId || !primaryKeyword) {
      return NextResponse.json(
        { error: "domainId and primaryKeyword are required" },
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

    const now = new Date();
    const [inserted] = await db
      .insert(topicRecommendations)
      .values({
        domainId,
        batchDate: now,
        primaryKeyword,
        searchVolume: searchVolume ?? null,
        keywordDifficulty: keywordDifficulty ?? null,
        opportunityScore: opportunityScore ?? null,
        suggestedContentType: suggestedContentType ?? null,
        aiAngle: aiAngle ?? null,
        aiOutline: aiOutline ?? null,
        supportingKeywordsJson: supportingKeywords ?? null,
        competitorDataJson: competitorData ?? null,
        serpFeaturesJson: serpFeatures ?? null,
        source: source ?? "validator",
        status: "pending",
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return NextResponse.json({ topic: inserted }, { status: 201 });
  } catch (err) {
    console.error("Create topic error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
