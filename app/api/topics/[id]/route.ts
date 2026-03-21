import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/middleware";
import { db } from "@/lib/db";
import { topicRecommendations, domains } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

// GET /api/topics/[id] — Return stored topic data formatted as a Brief
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    const { id } = await params;

    const topic = await db
      .select()
      .from(topicRecommendations)
      .where(eq(topicRecommendations.id, id))
      .then((rows) => rows[0] ?? null);

    if (!topic) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 });
    }

    // Verify domain belongs to user's org
    const domain = await db
      .select()
      .from(domains)
      .where(
        and(
          eq(domains.id, topic.domainId),
          eq(domains.orgId, session!.user.orgId)
        )
      )
      .then((rows) => rows[0] ?? null);

    if (!domain) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 });
    }

    // Convert stored topic data to Brief format
    const supportingKeywords = Array.isArray(topic.supportingKeywordsJson)
      ? (topic.supportingKeywordsJson as { keyword?: string; volume?: number; kd?: number; searchVolume?: number; keywordDifficulty?: number }[])
      : [];
    const competitorData = Array.isArray(topic.competitorDataJson)
      ? (topic.competitorDataJson as { competitor?: string; rank?: number; url?: string }[])
      : [];
    const serpFeatures = Array.isArray(topic.serpFeaturesJson)
      ? (topic.serpFeaturesJson as string[])
      : [];

    // Parse AI angles from stored pipe-separated text
    const angleTexts = topic.aiAngle ? topic.aiAngle.split(" | ").filter(Boolean) : [];
    const angles = angleTexts.length > 0
      ? angleTexts.map((a) => ({ angle: a, rationale: "" }))
      : [];

    // Parse outline from stored newline-separated text
    const outline = topic.aiOutline
      ? topic.aiOutline.split("\n").filter(Boolean)
      : [];

    // Synthesize verdict from opportunity score
    const score = topic.opportunityScore ?? 0;
    const verdict = score >= 70
      ? "Strong content opportunity based on keyword metrics and competitive analysis."
      : score >= 40
      ? "Moderate opportunity — worth pursuing with the right angle."
      : "Lower priority topic — consider alternatives with stronger metrics.";

    const brief = {
      keyword: topic.primaryKeyword,
      primaryMetrics: {
        searchVolume: topic.searchVolume ?? 0,
        keywordDifficulty: topic.keywordDifficulty ?? 0,
        cpc: 0,
        trendData: [] as { month: number; year: number; search_volume: number }[],
      },
      relatedKeywords: supportingKeywords.map((k) => ({
        keyword: k.keyword ?? "",
        searchVolume: k.searchVolume ?? k.volume ?? 0,
        keywordDifficulty: k.keywordDifficulty ?? k.kd ?? 0,
        cpc: 0,
      })),
      serpLandscape: {
        topResults: [] as { title: string; url: string; domain: string; position: number }[],
        serpFeatures: serpFeatures,
      },
      competitorCheck: {
        competitors: competitorData.map((c) => ({
          domain: c.competitor ?? "",
          position: c.rank ?? 0,
          title: "",
          url: c.url ?? "",
        })),
        hasCompetitorPresence: competitorData.length > 0,
      },
      cannibalisationCheck: {
        risk: false,
        overlappingContent: [] as { title: string; url: string }[],
      },
      aiAnalysis: {
        angles,
        outline,
        contentType: topic.suggestedContentType ?? "blog post",
        opportunityScore: Math.round(score),
        verdict,
      },
      generatedAt: topic.createdAt.toISOString(),
    };

    return NextResponse.json({ brief });
  } catch (err) {
    console.error("Get topic brief error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    const { id } = await params;
    const body = await req.json();
    const { status, rejectionReason } = body;

    // Validate status
    const validStatuses = ["approved", "rejected"];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Status must be 'approved' or 'rejected'" },
        { status: 400 }
      );
    }

    if (status === "rejected" && !rejectionReason) {
      return NextResponse.json(
        { error: "rejectionReason is required when rejecting a topic" },
        { status: 400 }
      );
    }

    // Fetch the topic
    const topic = await db
      .select()
      .from(topicRecommendations)
      .where(eq(topicRecommendations.id, id))
      .then((rows) => rows[0] ?? null);

    if (!topic) {
      return NextResponse.json(
        { error: "Topic not found" },
        { status: 404 }
      );
    }

    // Verify domain belongs to user's org
    const domain = await db
      .select()
      .from(domains)
      .where(
        and(
          eq(domains.id, topic.domainId),
          eq(domains.orgId, session!.user.orgId)
        )
      )
      .then((rows) => rows[0] ?? null);

    if (!domain) {
      return NextResponse.json(
        { error: "Topic not found" },
        { status: 404 }
      );
    }

    // Build status history entry
    const historyEntry = {
      status,
      changedBy: session!.user.id,
      changedAt: new Date().toISOString(),
      ...(rejectionReason ? { rejectionReason } : {}),
    };

    const existingHistory = Array.isArray(topic.statusHistoryJson)
      ? (topic.statusHistoryJson as Record<string, unknown>[])
      : [];

    const updatedHistory = [...existingHistory, historyEntry];

    // Update the topic
    const updated = await db
      .update(topicRecommendations)
      .set({
        status,
        statusChangedBy: session!.user.id,
        statusHistoryJson: updatedHistory,
        updatedAt: new Date(),
        ...(status === "rejected" ? { rejectionReason } : {}),
      })
      .where(eq(topicRecommendations.id, id))
      .returning();

    return NextResponse.json({ topic: updated[0] });
  } catch (err) {
    console.error("Update topic status error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
