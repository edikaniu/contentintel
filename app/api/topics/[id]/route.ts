import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/middleware";
import { db } from "@/lib/db";
import { topicRecommendations, domains } from "@/lib/db/schema";
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
