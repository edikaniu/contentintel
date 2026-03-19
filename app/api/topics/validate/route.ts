import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/middleware";
import { db } from "@/lib/db";
import { domains, competitors, contentInventory } from "@/lib/db/schema";
import { eq, and, ilike } from "drizzle-orm";
import { getDataForSEOClient } from "@/lib/data-sources/dataforseo";
import { getKeywordSuggestions, getRelatedKeywords, hasKeywordProvider } from "@/lib/data-sources/keyword-provider";
import { getCredentials } from "@/lib/credentials/credential-store";

export async function POST(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    const body = await req.json();
    const { topic, domainId } = body;

    if (!topic || typeof topic !== "string" || !topic.trim()) {
      return NextResponse.json(
        { error: "Topic text is required" },
        { status: 400 }
      );
    }

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

    const orgId = session!.user.orgId;
    const keyword = topic.trim().toLowerCase();
    const locationCode = domain.dataforseoLocation ?? 2566;
    const languageCode = domain.dataforseoLanguage ?? 1000;

    // Step 1: Check keyword provider availability
    const providerAvailable = await hasKeywordProvider(orgId);
    if (!providerAvailable) {
      return NextResponse.json(
        { error: "Neither DataforSEO nor SEMrush is configured. Please add credentials in Settings." },
        { status: 422 }
      );
    }

    const semrushDb = domain.semrushDatabase;

    // Step 2: Fetch keyword data + SERP results
    // Keyword suggestions and related use the failover provider
    // SERP uses DataforSEO directly (no SEMrush equivalent yet)
    const dfsClient = await getDataForSEOClient(orgId);

    const [keywordResult, relatedResult] = await Promise.all([
      getKeywordSuggestions(orgId, keyword, locationCode, languageCode, 10, semrushDb),
      getRelatedKeywords(orgId, keyword, locationCode, languageCode, 10, semrushDb),
    ]);

    // SERP via DataforSEO only (if available)
    let serpResult: { success: boolean; data?: { topResults: Array<{ title: string; url: string; domain: string; position: number }>; serpFeatures: string[] } } = { success: false };
    if (dfsClient) {
      serpResult = await dfsClient.getSerpResults(keyword, locationCode, languageCode);
    }

    // Extract primary keyword metrics from suggestions (first match or manual)
    let primaryMetrics = {
      searchVolume: 0,
      keywordDifficulty: 0,
      cpc: 0,
      trendData: [] as Array<{ month: number; year: number; search_volume: number }>,
    };

    if (keywordResult.success && keywordResult.data) {
      const exact = keywordResult.data.find(
        (k) => k.keyword.toLowerCase() === keyword
      );
      if (exact) {
        primaryMetrics = {
          searchVolume: exact.searchVolume,
          keywordDifficulty: exact.keywordDifficulty,
          cpc: exact.cpc,
          trendData: exact.trendData,
        };
      } else if (keywordResult.data.length > 0) {
        const first = keywordResult.data[0];
        primaryMetrics = {
          searchVolume: first.searchVolume,
          keywordDifficulty: first.keywordDifficulty,
          cpc: first.cpc,
          trendData: first.trendData,
        };
      }
    }

    // Related keywords
    const relatedKeywords = (relatedResult.success && relatedResult.data)
      ? relatedResult.data.slice(0, 10).map((k) => ({
          keyword: k.keyword,
          searchVolume: k.searchVolume,
          keywordDifficulty: k.keywordDifficulty,
          cpc: k.cpc,
        }))
      : [];

    // SERP data
    const serpData = (serpResult.success && serpResult.data)
      ? serpResult.data
      : { topResults: [], serpFeatures: [] };

    // Step 3: Check competitors
    const domainCompetitors = await db
      .select()
      .from(competitors)
      .where(eq(competitors.domainId, domainId));

    const competitorDomains = domainCompetitors.map((c) => c.competitorDomain.toLowerCase());
    const competitorPresence = serpData.topResults
      .filter((r) => competitorDomains.some((cd) => r.domain.toLowerCase().includes(cd)))
      .map((r) => ({
        domain: r.domain,
        position: r.position,
        title: r.title,
        url: r.url,
      }));

    // Step 4: Cannibalisation check
    const existingContent = await db
      .select({
        id: contentInventory.id,
        url: contentInventory.url,
        title: contentInventory.title,
      })
      .from(contentInventory)
      .where(
        and(
          eq(contentInventory.domainId, domainId),
          ilike(contentInventory.title, `%${keyword.split(" ").slice(0, 3).join("%")}%`)
        )
      );

    const cannibalisationRisk = existingContent.length > 0;
    const overlappingContent = existingContent.map((c) => ({
      title: c.title,
      url: c.url,
    }));

    // Step 5: AI analysis
    let aiAnalysis = {
      angles: [] as Array<{ angle: string; rationale: string }>,
      outline: [] as string[],
      contentType: "blog post",
      opportunityScore: 0,
      verdict: "",
    };

    const anthropicCreds = await getCredentials(orgId, "anthropic");
    if (anthropicCreds) {
      console.log(`[Validator] Anthropic credentials found for org ${orgId}, key starts with: ${anthropicCreds.api_key.slice(0, 10)}...`);
      aiAnalysis = await generateValidationAnalysis(
        anthropicCreds.api_key,
        keyword,
        primaryMetrics,
        relatedKeywords,
        serpData,
        competitorPresence,
        cannibalisationRisk,
        overlappingContent,
        domain.vertical ?? "general"
      );
    } else {
      console.log(`[Validator] No Anthropic credentials found for org ${orgId}, using fallback`);
    }

    // Build the full brief
    const brief = {
      keyword,
      primaryMetrics,
      relatedKeywords,
      serpLandscape: {
        topResults: serpData.topResults,
        serpFeatures: serpData.serpFeatures,
      },
      competitorCheck: {
        competitors: competitorPresence,
        hasCompetitorPresence: competitorPresence.length > 0,
      },
      cannibalisationCheck: {
        risk: cannibalisationRisk,
        overlappingContent,
      },
      aiAnalysis: {
        angles: aiAnalysis.angles,
        outline: aiAnalysis.outline,
        contentType: aiAnalysis.contentType,
        opportunityScore: aiAnalysis.opportunityScore,
        verdict: aiAnalysis.verdict,
      },
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json({ brief });
  } catch (err) {
    console.error("Topic validation error:", err);
    return NextResponse.json(
      { error: "Failed to validate topic" },
      { status: 500 }
    );
  }
}

async function generateValidationAnalysis(
  apiKey: string,
  keyword: string,
  metrics: { searchVolume: number; keywordDifficulty: number; cpc: number },
  relatedKeywords: Array<{ keyword: string; searchVolume: number }>,
  serpData: { topResults: Array<{ title: string; domain: string; position: number }>; serpFeatures: string[] },
  competitorPresence: Array<{ domain: string; position: number }>,
  cannibalisationRisk: boolean,
  overlappingContent: Array<{ title: string; url: string }>,
  vertical: string
) {
  const prompt = `You are an expert content strategist. Analyze this topic and provide a detailed content brief.

Topic/Keyword: "${keyword}"
Vertical: ${vertical}

Keyword Metrics:
- Search Volume: ${metrics.searchVolume}
- Keyword Difficulty: ${metrics.keywordDifficulty}/100
- CPC: $${metrics.cpc}

Related Keywords: ${relatedKeywords.map((k) => `${k.keyword} (vol: ${k.searchVolume})`).join(", ") || "none found"}

Current SERP (top 5):
${serpData.topResults.map((r) => `- #${r.position}: ${r.title} (${r.domain})`).join("\n") || "No results found"}

SERP Features Present: ${serpData.serpFeatures.join(", ") || "none"}

Competitor Presence: ${competitorPresence.length > 0 ? competitorPresence.map((c) => `${c.domain} at position ${c.position}`).join(", ") : "None of our competitors rank for this term"}

Cannibalisation Risk: ${cannibalisationRisk ? `YES - existing content: ${overlappingContent.map((c) => c.title).join(", ")}` : "No overlapping content found"}

Respond in exactly this JSON format (no markdown, no code blocks):
{
  "angles": [
    { "angle": "brief angle description", "rationale": "why this angle works" },
    { "angle": "brief angle description", "rationale": "why this angle works" }
  ],
  "outline": ["Section 1: ...", "Section 2: ...", "Section 3: ...", "Section 4: ...", "Section 5: ..."],
  "content_type": "one of: blog post, comparison page, guide, tool, listicle, how-to",
  "opportunity_score": 0-100,
  "verdict": "1-2 sentence plain-language assessment of the opportunity"
}`;

  const modelId = "claude-haiku-4-5-20251001";
  try {
    console.log(`[Validator] Calling Anthropic API with model=${modelId}, max_tokens=1500`);
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: modelId,
        max_tokens: 1500,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      console.error(`[Validator] Anthropic API error: HTTP ${res.status} ${res.statusText}. Body: ${errBody.slice(0, 500)}`);
      return fallbackAnalysis(metrics);
    }

    const json = await res.json();
    const text = json.content?.[0]?.text ?? "";
    console.log(`[Validator] Anthropic response received (model=${json.model ?? modelId}), ${text.length} chars, stop_reason=${json.stop_reason ?? "unknown"}`);

    const parsed = JSON.parse(text);
    return {
      angles: parsed.angles ?? [],
      outline: parsed.outline ?? [],
      contentType: parsed.content_type ?? "blog post",
      opportunityScore: Math.min(100, Math.max(0, parsed.opportunity_score ?? 0)),
      verdict: parsed.verdict ?? "",
    };
  } catch (err) {
    console.error(`[Validator] AI analysis error:`, err instanceof Error ? err.message : err);
    return fallbackAnalysis(metrics);
  }
}

function fallbackAnalysis(metrics: { searchVolume: number; keywordDifficulty: number }) {
  // Simple heuristic score when AI is unavailable
  const volumeScore = Math.min(40, (metrics.searchVolume / 1000) * 10);
  const difficultyScore = Math.max(0, 40 - (metrics.keywordDifficulty * 0.4));
  const score = Math.round(volumeScore + difficultyScore + 20);

  return {
    angles: [{ angle: "Standard coverage", rationale: "AI analysis unavailable" }],
    outline: ["Introduction", "Main Content", "Key Takeaways", "Conclusion"],
    contentType: "blog post",
    opportunityScore: Math.min(100, score),
    verdict: "AI analysis was unavailable. Score is based on keyword metrics only.",
  };
}
