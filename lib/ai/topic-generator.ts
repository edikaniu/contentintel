import { getCredentials } from "@/lib/credentials/credential-store";

interface TopicAIResult {
  angle: string;
  contentType: string;
  outline: string;
}

interface AIGenerationResult {
  results: Map<string, TopicAIResult>;
  skipped: boolean;
  error?: string;
}

/**
 * Generate AI topic angles and outlines for top-scoring topic clusters.
 * Uses the Anthropic API with the org's stored credentials.
 */
export async function generateTopicAngles(
  orgId: string,
  topics: Array<{
    primaryKeyword: string;
    supportingKeywords: string[];
    vertical: string;
    competitorData: Array<{ domain: string; position: number }>;
  }>
): Promise<AIGenerationResult> {
  const creds = await getCredentials(orgId, "anthropic");
  if (!creds) {
    return { results: new Map(), skipped: true, error: "Anthropic not configured" };
  }

  const apiKey = creds.api_key;
  const results = new Map<string, TopicAIResult>();

  for (const topic of topics) {
    try {
      const result = await generateSingleTopic(apiKey, topic);
      if (result) {
        results.set(topic.primaryKeyword, result);
      }
    } catch (err) {
      console.error(`AI generation failed for "${topic.primaryKeyword}":`, err);
      // Continue with other topics
    }
  }

  return { results, skipped: false };
}

async function generateSingleTopic(
  apiKey: string,
  topic: {
    primaryKeyword: string;
    supportingKeywords: string[];
    vertical: string;
    competitorData: Array<{ domain: string; position: number }>;
  }
): Promise<TopicAIResult | null> {
  const competitorContext = topic.competitorData.length > 0
    ? `Competitors ranking for this topic: ${topic.competitorData.map((c) => `${c.domain} (position ${c.position})`).join(", ")}`
    : "No direct competitors currently ranking for this topic.";

  const prompt = `You are a senior content strategist specialising in the ${topic.vertical} space. Your job is to turn keyword data into a specific, actionable content brief that a writer can immediately use.

Primary keyword: "${topic.primaryKeyword}"
Supporting keywords: ${topic.supportingKeywords.join(", ") || "none"}
${competitorContext}

Generate a content recommendation. Be specific and strategic — not generic. The angle should explain WHY this piece will rank and what unique value it offers readers. The outline should have descriptive section titles that reflect real subtopics, not just "Section 1".

Respond in exactly this JSON format (no markdown, no code blocks):
{
  "angle": "2-3 sentence strategic angle explaining the unique approach, target reader, and why this will outperform existing content",
  "content_type": "one of: blog post, comparison page, ultimate guide, interactive tool, listicle, how-to tutorial, case study, data-driven analysis",
  "outline": "Introduction: [specific hook]\\n[Descriptive heading 1]: [what this covers]\\n[Descriptive heading 2]: [what this covers]\\n[Descriptive heading 3]: [what this covers]\\n[Descriptive heading 4]: [what this covers]\\n[Descriptive heading 5]: [what this covers]\\nConclusion: [specific takeaway]"
}`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(`[TopicGenerator] Anthropic API error: HTTP ${res.status} ${res.statusText}. Body: ${body.slice(0, 500)}`);
    return null;
  }

  const json = await res.json();
  const text = json.content?.[0]?.text ?? "";
  console.log(`[TopicGenerator] AI response for "${topic.primaryKeyword}": ${text.length} chars, model=${json.model ?? "unknown"}`);

  try {
    const parsed = JSON.parse(text);
    return {
      angle: parsed.angle ?? "",
      contentType: parsed.content_type ?? "blog post",
      outline: parsed.outline ?? "",
    };
  } catch {
    // Try to extract from text if JSON parse fails
    return {
      angle: text.slice(0, 200),
      contentType: "blog post",
      outline: "",
    };
  }
}
