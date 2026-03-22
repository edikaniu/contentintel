import { eq, and, desc, ne, ilike, inArray, isNull, lte } from "drizzle-orm";
import { db } from "@/lib/db";
import { contentAlerts, contentInventory, contentSnapshots, domains } from "@/lib/db/schema";
import { getCredentials } from "@/lib/credentials/credential-store";
import { getWindsorClient } from "@/lib/data-sources/windsor";
import { getSerpResults as getSerpWithFailover } from "@/lib/data-sources/keyword-provider";

// ---------------------------------------------------------------------------
// Enrichment type definitions
// ---------------------------------------------------------------------------

interface CannibalizationEnrichment {
  type: "cannibalization_check";
  pages: Array<{ title: string; url: string }>;
  verdict: string;
}

interface TitleSuggestionsEnrichment {
  type: "title_suggestions";
  currentTitle: string;
  primaryQuery: string;
  currentCtr: number;
  suggestions: string[];
}

interface UxChecklistEnrichment {
  type: "ux_checklist";
  items: Array<{ label: string; checked: boolean }>;
}

interface QueryLossEnrichment {
  type: "query_loss_analysis";
  queries: Array<{ query: string; oldClicks: number; newClicks: number; change: number }>;
  dateRange: { current: string; previous: string };
}

interface InternalLinkEnrichment {
  type: "internal_link_suggestions";
  links: Array<{ fromTitle: string; fromUrl: string; suggestedAnchor: string }>;
}

interface FeaturedSnippetEnrichment {
  type: "featured_snippet";
  snippetText: string | null;
  targetQuery: string;
}

interface IntentAnalysisEnrichment {
  type: "intent_analysis";
  analysis: string;
  detectedIntent: string;
  pageAlignment: string;
}

type AlertEnrichment =
  | CannibalizationEnrichment
  | TitleSuggestionsEnrichment
  | UxChecklistEnrichment
  | QueryLossEnrichment
  | InternalLinkEnrichment
  | FeaturedSnippetEnrichment
  | IntentAnalysisEnrichment;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_ENRICHMENTS_PER_BATCH = 10;
const AI_TIMEOUT_MS = 15000;
const MODEL_ID = "claude-haiku-4-5-20251001";
const ENRICHMENT_COOLDOWN_DAYS = 7;

const UX_CHECKLIST_ITEMS = [
  "Verify all CTAs are visible and functional on desktop and mobile",
  "Check page load time (target < 3 seconds)",
  "Confirm form submissions work end-to-end",
  "Review mobile layout for CTA visibility and tap targets",
  "Check for broken images or missing assets",
  "Verify tracking pixels and conversion events fire correctly",
  "Compare current page against cached/archived version for unintended changes",
  "Test all links in the conversion funnel",
];

// ---------------------------------------------------------------------------
// Anthropic helper
// ---------------------------------------------------------------------------

async function callAnthropic(apiKey: string, prompt: string, maxTokens: number = 400): Promise<string | null> {
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
        max_tokens: maxTokens,
        messages: [{ role: "user", content: prompt }],
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      console.error(`[Enricher] Anthropic API error: ${res.status}. ${errBody.slice(0, 300)}`);
      return null;
    }

    const json = await res.json();
    let text = (json.content?.[0]?.text ?? "").trim();

    // Strip markdown code block wrapping
    if (text.startsWith("```")) {
      text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
    }

    return text;
  } catch (err) {
    clearTimeout(timeout);
    console.error(`[Enricher] Anthropic call failed:`, err instanceof Error ? err.message : err);
    return null;
  }
}

function formatDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

// ---------------------------------------------------------------------------
// Tier 1 Enrichers
// ---------------------------------------------------------------------------

/** Position drop → check for keyword cannibalization via DB query */
async function enrichCannibalization(
  alert: typeof contentAlerts.$inferSelect,
  content: typeof contentInventory.$inferSelect
): Promise<CannibalizationEnrichment> {
  const metrics = alert.currentMetricsJson as Record<string, unknown> | null;
  const primaryQuery = (metrics?.primaryQuery as string) ?? "";

  // Build search pattern from first 3 words of the primary query (or title)
  const searchSource = primaryQuery || content.title || "";
  const words = searchSource.toLowerCase().split(/\s+/).filter(Boolean).slice(0, 3);

  if (words.length === 0) {
    return { type: "cannibalization_check", pages: [], verdict: "No primary query available for cannibalization check." };
  }

  const pattern = `%${words.join("%")}%`;
  const matches = await db
    .select({ title: contentInventory.title, url: contentInventory.url })
    .from(contentInventory)
    .where(
      and(
        eq(contentInventory.domainId, content.domainId),
        ne(contentInventory.id, content.id),
        ilike(contentInventory.title, pattern)
      )
    )
    .limit(5);

  const verdict = matches.length === 0
    ? "No keyword cannibalization detected."
    : `${matches.length} page${matches.length > 1 ? "s" : ""} may be cannibalizing this content.`;

  return {
    type: "cannibalization_check",
    pages: matches.map((m) => ({ title: m.title ?? "", url: m.url })),
    verdict,
  };
}

/** Low CTR → generate 3 high-CTR title alternatives via Anthropic */
async function enrichTitleSuggestions(
  apiKey: string,
  alert: typeof contentAlerts.$inferSelect,
  content: typeof contentInventory.$inferSelect
): Promise<TitleSuggestionsEnrichment> {
  const metrics = alert.currentMetricsJson as Record<string, unknown> | null;
  const primaryQuery = (metrics?.primaryQuery as string) ?? "";
  const ctr = (metrics?.ctr as number) ?? 0;
  const currentTitle = content.title ?? "";

  const prompt = `You are an SEO expert. Generate exactly 3 alternative title tags optimized for higher click-through rate.

Current title: "${currentTitle}"
Primary search query: "${primaryQuery}"
Current CTR: ${(ctr * 100).toFixed(1)}%

Rules:
- Each title must be under 60 characters
- Use power words, numbers, or brackets to increase CTR
- Match the search intent of the primary query
- Do NOT use clickbait or misleading titles

Respond with ONLY a JSON array of 3 strings, no other text:
["Title 1", "Title 2", "Title 3"]`;

  const text = await callAnthropic(apiKey, prompt, 300);

  let suggestions: string[] = [];
  if (text) {
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) suggestions = parsed.slice(0, 3).map(String);
    } catch {
      console.warn("[Enricher] Failed to parse title suggestions JSON");
    }
  }

  return {
    type: "title_suggestions",
    currentTitle,
    primaryQuery,
    currentCtr: ctr,
    suggestions,
  };
}

/** Conversion drop → static UX diagnostic checklist */
function enrichUxChecklist(): UxChecklistEnrichment {
  return {
    type: "ux_checklist",
    items: UX_CHECKLIST_ITEMS.map((label) => ({ label, checked: false })),
  };
}

// ---------------------------------------------------------------------------
// Tier 2 Enrichers
// ---------------------------------------------------------------------------

/** Declining traffic → identify which queries lost the most clicks */
async function enrichQueryLoss(
  orgId: string,
  alert: typeof contentAlerts.$inferSelect,
  content: typeof contentInventory.$inferSelect,
  domain: typeof domains.$inferSelect
): Promise<QueryLossEnrichment | null> {
  if (!domain.gscProperty) return null;

  const client = await getWindsorClient(orgId);
  if (!client) return null;

  const now = new Date();
  const currentFrom = new Date(now);
  currentFrom.setDate(currentFrom.getDate() - 7);
  const previousFrom = new Date(now);
  previousFrom.setDate(previousFrom.getDate() - 35);
  const previousTo = new Date(now);
  previousTo.setDate(previousTo.getDate() - 28);

  const [currentGsc, previousGsc] = await Promise.all([
    client.getGSCData(domain.gscProperty, formatDate(currentFrom), formatDate(now)),
    client.getGSCData(domain.gscProperty, formatDate(previousFrom), formatDate(previousTo)),
  ]);

  if (!currentGsc.success || !previousGsc.success) return null;

  // Extract the path from the content URL for matching
  const contentPath = extractPath(content.url);

  // Filter to rows matching this content's URL
  const currentQueries = new Map<string, number>();
  for (const row of currentGsc.data ?? []) {
    if (extractPath(String(row.page ?? "")) === contentPath) {
      currentQueries.set(String(row.query ?? ""), row.clicks);
    }
  }

  const previousQueries = new Map<string, number>();
  for (const row of previousGsc.data ?? []) {
    if (extractPath(String(row.page ?? "")) === contentPath) {
      previousQueries.set(String(row.query ?? ""), row.clicks);
    }
  }

  // Compare and find biggest losers
  const losses: Array<{ query: string; oldClicks: number; newClicks: number; change: number }> = [];
  for (const [query, oldClicks] of previousQueries) {
    const newClicks = currentQueries.get(query) ?? 0;
    if (oldClicks > newClicks) {
      const change = oldClicks > 0 ? -Math.round(((oldClicks - newClicks) / oldClicks) * 100) : 0;
      losses.push({ query, oldClicks, newClicks, change });
    }
  }

  losses.sort((a, b) => (a.newClicks - a.oldClicks) - (b.newClicks - b.oldClicks));

  return {
    type: "query_loss_analysis",
    queries: losses.slice(0, 5),
    dateRange: {
      current: `${formatDate(currentFrom)} to ${formatDate(now)}`,
      previous: `${formatDate(previousFrom)} to ${formatDate(previousTo)}`,
    },
  };
}

function extractPath(url: string): string {
  try {
    return new URL(url).pathname.replace(/\/$/, "").toLowerCase();
  } catch {
    return url.replace(/^https?:\/\/[^/]+/, "").replace(/\/$/, "").toLowerCase();
  }
}

/** Striking distance → suggest internal links from high-traffic related pages */
async function enrichInternalLinks(
  apiKey: string,
  content: typeof contentInventory.$inferSelect,
  domain: typeof domains.$inferSelect
): Promise<InternalLinkEnrichment> {
  // Find top 20 highest-traffic pages on the same domain (excluding current)
  const topPages = await db
    .select({
      title: contentInventory.title,
      url: contentInventory.url,
      sessions: contentSnapshots.sessions,
      organicClicks: contentSnapshots.organicClicks,
    })
    .from(contentSnapshots)
    .innerJoin(contentInventory, eq(contentSnapshots.contentId, contentInventory.id))
    .where(
      and(
        eq(contentInventory.domainId, domain.id),
        ne(contentInventory.id, content.id)
      )
    )
    .orderBy(desc(contentSnapshots.sessions))
    .limit(20);

  if (topPages.length === 0) {
    return { type: "internal_link_suggestions", links: [] };
  }

  const pageList = topPages
    .map((p) => `- "${p.title}" (${p.url}) — ${p.sessions ?? p.organicClicks ?? 0} sessions`)
    .join("\n");

  const prompt = `You are an SEO expert. Suggest 2-3 internal links from these high-traffic pages to the target page.

Target page: "${content.title}" (${content.url})

High-traffic pages on the same site:
${pageList}

For each link, provide:
- The source page that should link TO the target
- The exact anchor text to use (keyword-rich, natural)

Respond with ONLY a JSON array, no other text:
[{"fromTitle": "...", "fromUrl": "...", "suggestedAnchor": "..."}]`;

  const text = await callAnthropic(apiKey, prompt, 500);

  let links: Array<{ fromTitle: string; fromUrl: string; suggestedAnchor: string }> = [];
  if (text) {
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        links = parsed.slice(0, 3).map((l: Record<string, unknown>) => ({
          fromTitle: String(l.fromTitle ?? ""),
          fromUrl: String(l.fromUrl ?? ""),
          suggestedAnchor: String(l.suggestedAnchor ?? ""),
        }));
      }
    } catch {
      console.warn("[Enricher] Failed to parse internal links JSON");
    }
  }

  return { type: "internal_link_suggestions", links };
}

/** Striking distance → generate a featured snippet paragraph */
async function enrichFeaturedSnippet(
  apiKey: string,
  alert: typeof contentAlerts.$inferSelect,
  content: typeof contentInventory.$inferSelect
): Promise<FeaturedSnippetEnrichment> {
  const metrics = alert.currentMetricsJson as Record<string, unknown> | null;
  const primaryQuery = (metrics?.primaryQuery as string) ?? "";

  if (!primaryQuery) {
    return { type: "featured_snippet", snippetText: null, targetQuery: "" };
  }

  const prompt = `Write a 40-50 word paragraph that directly answers this search query, optimized to win a Google featured snippet.

Search query: "${primaryQuery}"
Page title: "${content.title}"

Rules:
- Start with a direct, definitive answer
- Use simple, clear language
- Include the key term naturally
- Keep to exactly 40-50 words

Respond with ONLY a JSON object, no other text:
{"snippet": "Your paragraph here"}`;

  const text = await callAnthropic(apiKey, prompt, 200);

  let snippetText: string | null = null;
  if (text) {
    try {
      const parsed = JSON.parse(text);
      snippetText = parsed.snippet ?? null;
    } catch {
      // If JSON parse fails, try using the raw text as the snippet
      if (text.length > 20 && text.length < 500) snippetText = text;
    }
  }

  return { type: "featured_snippet", snippetText, targetQuery: primaryQuery };
}

/** Conversion drop → analyze if search intent shifted away from page content */
async function enrichIntentAnalysis(
  apiKey: string,
  orgId: string,
  alert: typeof contentAlerts.$inferSelect,
  content: typeof contentInventory.$inferSelect,
  domain: typeof domains.$inferSelect
): Promise<IntentAnalysisEnrichment | null> {
  const metrics = alert.currentMetricsJson as Record<string, unknown> | null;
  const primaryQuery = (metrics?.primaryQuery as string) ?? "";

  if (!primaryQuery) return null;

  const locationCode = domain.dataforseoLocation ?? 2566;
  const languageCode = domain.dataforseoLanguage ?? 1000;

  const serpResult = await getSerpWithFailover(orgId, primaryQuery, locationCode, languageCode);
  if (!serpResult.success || !serpResult.data) return null;

  const serpContext = serpResult.data.topResults
    .slice(0, 5)
    .map((r) => `#${r.position}: "${r.title}" (${r.domain})`)
    .join("\n");

  const prompt = `Analyze the search intent for this query based on the current SERP results, and compare it to the page.

Search query: "${primaryQuery}"
Page title: "${content.title}"
Page URL: ${content.url}

Current top SERP results:
${serpContext}

Determine:
1. The dominant search intent (informational, transactional, navigational, commercial)
2. Whether the page aligns with this intent
3. A brief recommendation

Respond with ONLY a JSON object, no other text:
{"detected_intent": "...", "page_alignment": "aligned|partial|misaligned", "analysis": "1-2 sentence recommendation"}`;

  const text = await callAnthropic(apiKey, prompt, 400);

  if (!text) return null;

  try {
    const parsed = JSON.parse(text);
    return {
      type: "intent_analysis",
      detectedIntent: String(parsed.detected_intent ?? "unknown"),
      pageAlignment: String(parsed.page_alignment ?? "unknown"),
      analysis: String(parsed.analysis ?? ""),
    };
  } catch {
    console.warn("[Enricher] Failed to parse intent analysis JSON");
    return null;
  }
}

// ---------------------------------------------------------------------------
// Orchestrator
// ---------------------------------------------------------------------------

interface EnrichmentResult {
  enriched: number;
  skipped: number;
  errors: string[];
}

export async function enrichAlerts(
  orgId: string,
  domain: typeof domains.$inferSelect,
  batchDate: Date
): Promise<EnrichmentResult> {
  const result: EnrichmentResult = { enriched: 0, skipped: 0, errors: [] };

  // Calculate cooldown threshold
  const cooldownDate = new Date(batchDate);
  cooldownDate.setDate(cooldownDate.getDate() - ENRICHMENT_COOLDOWN_DAYS);

  // Fetch top unenriched alerts by priority
  const eligibleAlerts = await db
    .select({
      alert: contentAlerts,
      contentTitle: contentInventory.title,
      contentUrl: contentInventory.url,
    })
    .from(contentAlerts)
    .innerJoin(contentInventory, eq(contentAlerts.contentId, contentInventory.id))
    .where(
      and(
        eq(contentInventory.domainId, domain.id),
        inArray(contentAlerts.status, ["open", "acknowledged"]),
        // Not enriched yet, or enrichment is stale
        isNull(contentAlerts.lastEnrichedAt)
      )
    )
    .orderBy(desc(contentAlerts.priorityScore))
    .limit(MAX_ENRICHMENTS_PER_BATCH);

  // Also fetch stale enrichments (older than cooldown)
  const staleAlerts = await db
    .select({
      alert: contentAlerts,
      contentTitle: contentInventory.title,
      contentUrl: contentInventory.url,
    })
    .from(contentAlerts)
    .innerJoin(contentInventory, eq(contentAlerts.contentId, contentInventory.id))
    .where(
      and(
        eq(contentInventory.domainId, domain.id),
        inArray(contentAlerts.status, ["open", "acknowledged"]),
        lte(contentAlerts.lastEnrichedAt, cooldownDate)
      )
    )
    .orderBy(desc(contentAlerts.priorityScore))
    .limit(MAX_ENRICHMENTS_PER_BATCH);

  // Combine and deduplicate, respect max limit
  const alertMap = new Map<string, typeof eligibleAlerts[0]>();
  for (const a of [...eligibleAlerts, ...staleAlerts]) {
    if (alertMap.size >= MAX_ENRICHMENTS_PER_BATCH) break;
    alertMap.set(a.alert.id, a);
  }

  const alertsToEnrich = Array.from(alertMap.values());

  if (alertsToEnrich.length === 0) {
    console.log(`[Enricher] No alerts to enrich for domain ${domain.domain}`);
    return result;
  }

  console.log(`[Enricher] Enriching ${alertsToEnrich.length} alerts for domain ${domain.domain}`);

  // Get credentials once
  const anthropicCreds = await getCredentials(orgId, "anthropic");
  const apiKey = anthropicCreds?.api_key ?? null;

  // Fetch content inventory for all alerts
  const contentIds = alertsToEnrich.map((a) => a.alert.contentId);
  const contentItems = await db
    .select()
    .from(contentInventory)
    .where(inArray(contentInventory.id, contentIds));
  const contentMap = new Map(contentItems.map((c) => [c.id, c]));

  // Process each alert sequentially
  for (const { alert } of alertsToEnrich) {
    const content = contentMap.get(alert.contentId);
    if (!content) {
      result.skipped++;
      continue;
    }

    const enrichments: AlertEnrichment[] = [];

    try {
      switch (alert.alertType) {
        case "position_drop": {
          const cannibal = await enrichCannibalization(alert, content);
          enrichments.push(cannibal);
          break;
        }

        case "low_ctr": {
          if (apiKey) {
            const titles = await enrichTitleSuggestions(apiKey, alert, content);
            enrichments.push(titles);
          }
          break;
        }

        case "conversion_drop": {
          enrichments.push(enrichUxChecklist());
          if (apiKey) {
            const intent = await enrichIntentAnalysis(apiKey, orgId, alert, content, domain);
            if (intent) enrichments.push(intent);
          }
          break;
        }

        case "declining_traffic": {
          const queryLoss = await enrichQueryLoss(orgId, alert, content, domain);
          if (queryLoss) enrichments.push(queryLoss);
          break;
        }

        case "striking_distance": {
          if (apiKey) {
            const links = await enrichInternalLinks(apiKey, content, domain);
            enrichments.push(links);
            const snippet = await enrichFeaturedSnippet(apiKey, alert, content);
            enrichments.push(snippet);
          }
          break;
        }

        // stale_content: no enrichment in Tier 1/2
        default:
          break;
      }

      if (enrichments.length > 0) {
        await db
          .update(contentAlerts)
          .set({
            enrichmentJson: enrichments,
            lastEnrichedAt: new Date(),
          })
          .where(eq(contentAlerts.id, alert.id));
        result.enriched++;
        console.log(`[Enricher] Enriched alert ${alert.id} (${alert.alertType}) with ${enrichments.length} enrichment(s)`);
      } else {
        result.skipped++;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[Enricher] Error enriching alert ${alert.id}:`, msg);
      result.errors.push(`${alert.alertType}: ${msg}`);
    }
  }

  console.log(`[Enricher] Done: ${result.enriched} enriched, ${result.skipped} skipped, ${result.errors.length} errors`);
  return result;
}
