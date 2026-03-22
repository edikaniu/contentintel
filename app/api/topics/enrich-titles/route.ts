import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/middleware";
import { db } from "@/lib/db";
import { topicRecommendations, domains } from "@/lib/db/schema";
import { eq, and, isNull, inArray } from "drizzle-orm";
import { getCredentials } from "@/lib/credentials/credential-store";

const MODEL_ID = "claude-haiku-4-5-20251001";
const AI_TIMEOUT_MS = 15000;

async function generateTitles(
  apiKey: string,
  keywords: Array<{ id: string; keyword: string; contentType: string | null }>
): Promise<Map<string, string>> {
  const results = new Map<string, string>();

  // Process in batches of 10 to send fewer API calls
  for (let i = 0; i < keywords.length; i += 10) {
    const batch = keywords.slice(i, i + 10);
    const keywordList = batch
      .map((k, idx) => `${idx + 1}. "${k.keyword}" (${k.contentType ?? "blog post"})`)
      .join("\n");

    const prompt = `You are an expert content strategist. For each keyword below, suggest a compelling, SEO-friendly article title that a content team would use as their topic.

Rules:
- Each title should be 50-70 characters
- Include the primary keyword naturally
- Use power words, numbers, or brackets where appropriate
- Match the content type specified
- Make it sound like a real article title, not a keyword

Keywords:
${keywordList}

Respond with ONLY a JSON array of objects, no other text:
[{"index": 1, "title": "Your Suggested Title Here"}, ...]`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: MODEL_ID,
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }],
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!res.ok) {
        console.error(`[TopicEnrich] Anthropic error: ${res.status}`);
        continue;
      }

      const json = await res.json();
      let text = (json.content?.[0]?.text ?? "").trim();
      if (text.startsWith("```")) {
        text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
      }

      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          const idx = (item.index ?? 0) - 1;
          if (idx >= 0 && idx < batch.length && item.title) {
            results.set(batch[idx].id, String(item.title));
          }
        }
      }
    } catch (err) {
      clearTimeout(timeout);
      console.error(`[TopicEnrich] Batch ${i} failed:`, err instanceof Error ? err.message : err);
    }
  }

  return results;
}

/**
 * POST /api/topics/enrich-titles
 * One-time enrichment: generate proper topic titles from keywords using AI.
 */
export async function POST(req: NextRequest) {
  const { session, error } = await requireRole("admin");
  if (error) return error;

  try {
    const orgId = session!.user.orgId;

    // Get Anthropic credentials
    const anthropicCreds = await getCredentials(orgId, "anthropic");
    if (!anthropicCreds?.api_key) {
      return NextResponse.json(
        { error: "Anthropic is not configured. Add your API key in Settings > Connections." },
        { status: 422 }
      );
    }

    // Get all domains for this org
    const orgDomains = await db
      .select({ id: domains.id })
      .from(domains)
      .where(eq(domains.orgId, orgId));

    const domainIds = orgDomains.map((d) => d.id);

    // Fetch topics without a suggestedTitle
    const topics = await db
      .select({
        id: topicRecommendations.id,
        primaryKeyword: topicRecommendations.primaryKeyword,
        suggestedContentType: topicRecommendations.suggestedContentType,
      })
      .from(topicRecommendations)
      .where(
        and(
          inArray(topicRecommendations.domainId, domainIds),
          isNull(topicRecommendations.suggestedTitle)
        )
      );

    if (topics.length === 0) {
      return NextResponse.json({ enriched: 0, message: "All topics already have titles." });
    }

    console.log(`[TopicEnrich] Generating titles for ${topics.length} topics in org ${orgId}`);

    const keywords = topics.map((t) => ({
      id: t.id,
      keyword: t.primaryKeyword,
      contentType: t.suggestedContentType,
    }));

    const titles = await generateTitles(anthropicCreds.api_key, keywords);

    // Update each topic with its generated title
    let enriched = 0;
    for (const [topicId, title] of titles) {
      await db
        .update(topicRecommendations)
        .set({ suggestedTitle: title, updatedAt: new Date() })
        .where(eq(topicRecommendations.id, topicId));
      enriched++;
    }

    console.log(`[TopicEnrich] Generated ${enriched} titles out of ${topics.length} topics`);

    return NextResponse.json({
      enriched,
      total: topics.length,
      message: `Generated titles for ${enriched} of ${topics.length} topics.`,
    });
  } catch (err) {
    console.error("Topic enrichment error:", err);
    return NextResponse.json(
      { error: "Enrichment failed", details: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
