"use client";

import { CheckCircle, AlertTriangle, ExternalLink, Download, Plus, TrendingUp, TrendingDown } from "lucide-react";

interface Brief {
  keyword: string;
  primaryMetrics: {
    searchVolume: number;
    keywordDifficulty: number;
    cpc: number;
    trendData: Array<{ month: number; year: number; search_volume: number }>;
  };
  relatedKeywords: Array<{
    keyword: string;
    searchVolume: number;
    keywordDifficulty: number;
    cpc: number;
  }>;
  serpLandscape: {
    topResults: Array<{ title: string; url: string; domain: string; position: number }>;
    serpFeatures: string[];
  };
  competitorCheck: {
    competitors: Array<{ domain: string; position: number; title: string; url: string }>;
    hasCompetitorPresence: boolean;
  };
  cannibalisationCheck: {
    risk: boolean;
    overlappingContent: Array<{ title: string; url: string }>;
  };
  aiAnalysis: {
    angles: Array<{ angle: string; rationale: string }>;
    outline: string[];
    contentType: string;
    opportunityScore: number;
    verdict: string;
  };
  generatedAt: string;
  warnings?: string[];
}

interface BriefDisplayProps {
  brief: Brief;
  onAddToRecommendations: () => void;
  adding: boolean;
}

function ScoreGauge({ score }: { score: number }) {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const color =
    score >= 70 ? "#059669" : score >= 40 ? "#D97706" : "#DC2626";

  return (
    <div className="flex flex-col items-center">
      <svg width="120" height="120" viewBox="0 0 120 120">
        <circle
          cx="60" cy="60" r={radius}
          fill="none" stroke="#F3F4F6" strokeWidth="8"
        />
        <circle
          cx="60" cy="60" r={radius}
          fill="none" stroke={color} strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          transform="rotate(-90 60 60)"
        />
        <text x="60" y="56" textAnchor="middle" className="text-2xl font-black" fill={color}>
          {score}
        </text>
        <text x="60" y="72" textAnchor="middle" className="text-xs" fill="#9CA3AF">
          /100
        </text>
      </svg>
      <span
        className="mt-1 text-sm font-body font-bold"
        style={{ color }}
      >
        {score >= 70 ? "Strong" : score >= 40 ? "Moderate" : "Weak"} Opportunity
      </span>
    </div>
  );
}

function SerpFeatureBadge({ feature }: { feature: string }) {
  const labels: Record<string, string> = {
    featured_snippet: "Featured Snippet",
    people_also_ask: "People Also Ask",
    knowledge_panel: "Knowledge Panel",
    local_pack: "Local Pack",
    video: "Video",
    images: "Images",
    shopping: "Shopping",
    news: "News",
    twitter: "Twitter",
    top_stories: "Top Stories",
  };

  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold font-body bg-[#8B5CF6]/10 text-[#8B5CF6]">
      {labels[feature] ?? feature.replace(/_/g, " ")}
    </span>
  );
}

export function BriefDisplay({ brief, onAddToRecommendations, adding }: BriefDisplayProps) {
  function exportMarkdown() {
    const md = [
      `# Content Brief: ${brief.keyword}`,
      ``,
      `## Opportunity Score: ${brief.aiAnalysis.opportunityScore}/100`,
      brief.aiAnalysis.verdict,
      ``,
      `## Keyword Metrics`,
      `- **Primary Keyword:** ${brief.keyword}`,
      `- **Search Volume:** ${brief.primaryMetrics.searchVolume.toLocaleString()}`,
      `- **Keyword Difficulty:** ${brief.primaryMetrics.keywordDifficulty}/100`,
      `- **CPC:** $${brief.primaryMetrics.cpc.toFixed(2)}`,
      `- **Content Type:** ${brief.aiAnalysis.contentType}`,
      ``,
      `## Related Keywords`,
      ...brief.relatedKeywords.map(
        (k) => `- ${k.keyword} (vol: ${k.searchVolume.toLocaleString()}, KD: ${k.keywordDifficulty})`
      ),
      ``,
      `## SERP Landscape`,
      ...brief.serpLandscape.topResults.map(
        (r) => `${r.position}. [${r.title}](${r.url}) — ${r.domain}`
      ),
      ``,
      `SERP Features: ${brief.serpLandscape.serpFeatures.join(", ") || "none"}`,
      ``,
      `## Competitor Presence`,
      brief.competitorCheck.hasCompetitorPresence
        ? brief.competitorCheck.competitors.map(
            (c) => `- ${c.domain} — position ${c.position}`
          ).join("\n")
        : "No defined competitors currently rank for this keyword.",
      ``,
      `## Cannibalisation Check`,
      brief.cannibalisationCheck.risk
        ? `**Warning:** Existing content may overlap:\n${brief.cannibalisationCheck.overlappingContent.map((c) => `- ${c.title}`).join("\n")}`
        : "No overlapping content found. Safe to create new content.",
      ``,
      `## Recommended Angles`,
      ...brief.aiAnalysis.angles.map(
        (a, i) => `### Angle ${i + 1}: ${a.angle}\n${a.rationale}`
      ),
      ``,
      `## Recommended Outline`,
      ...brief.aiAnalysis.outline.map((s) => `- ${s}`),
      ``,
      `---`,
      `Generated by ContentIntel on ${new Date(brief.generatedAt).toLocaleDateString()}`,
    ].join("\n");

    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `brief-${brief.keyword.replace(/\s+/g, "-")}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const trend = brief.primaryMetrics.trendData;
  const trendDirection =
    trend.length >= 2 && trend[trend.length - 1].search_volume > trend[trend.length - 2].search_volume
      ? "up"
      : trend.length >= 2
      ? "down"
      : "flat";

  return (
    <div className="space-y-6">
      {/* Warnings banner */}
      {brief.warnings && brief.warnings.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-body font-semibold text-amber-800 mb-1">Some data sources returned incomplete results</p>
              <ul className="space-y-0.5">
                {brief.warnings.map((w, i) => (
                  <li key={i} className="text-xs font-body text-amber-700">{w}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Header with Score + Verdict */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col md:flex-row gap-6 items-center">
        <ScoreGauge score={brief.aiAnalysis.opportunityScore} />
        <div className="flex-1 space-y-2">
          <h3 className="text-xl font-headline font-bold text-gray-900">{brief.keyword}</h3>
          <span className="inline-block px-3 py-1 rounded-full text-xs font-bold font-body bg-[#8B5CF6]/10 text-[#8B5CF6] capitalize">
            {brief.aiAnalysis.contentType}
          </span>
          <p className="text-gray-600 text-sm font-body">{brief.aiAnalysis.verdict}</p>
        </div>
        <div className="flex flex-col gap-2 shrink-0">
          <button
            onClick={onAddToRecommendations}
            disabled={adding}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#8B5CF6] text-white text-sm font-semibold font-body rounded-xl hover:bg-[#7C3AED] disabled:opacity-50 transition-colors"
          >
            <Plus className="w-4 h-4" />
            {adding ? "Adding..." : "Add to Recommendations"}
          </button>
          <button
            onClick={exportMarkdown}
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-100 text-gray-700 text-sm font-semibold font-body rounded-xl hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export Brief
          </button>
        </div>
      </div>

      {/* Keyword Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-semibold font-body text-gray-400 uppercase tracking-wider">Search Volume</p>
          <p className="text-2xl font-headline font-black text-gray-900 mt-1">{brief.primaryMetrics.searchVolume.toLocaleString()}</p>
          <div className="flex items-center gap-1 mt-1">
            {trendDirection === "up" ? (
              <TrendingUp className="w-3.5 h-3.5 text-[#059669]" />
            ) : trendDirection === "down" ? (
              <TrendingDown className="w-3.5 h-3.5 text-red-500" />
            ) : null}
            <span className={`text-xs font-semibold font-body ${trendDirection === "up" ? "text-[#059669]" : trendDirection === "down" ? "text-red-500" : "text-gray-400"}`}>
              {trendDirection === "up" ? "Trending up" : trendDirection === "down" ? "Trending down" : "Stable"}
            </span>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-semibold font-body text-gray-400 uppercase tracking-wider">Keyword Difficulty</p>
          <p className="text-2xl font-headline font-black text-gray-900 mt-1">{brief.primaryMetrics.keywordDifficulty}</p>
          <div className="h-1.5 w-full bg-gray-100 rounded-full mt-2">
            <div
              className="h-full rounded-full"
              style={{
                width: `${brief.primaryMetrics.keywordDifficulty}%`,
                backgroundColor: brief.primaryMetrics.keywordDifficulty >= 70 ? "#DC2626" : brief.primaryMetrics.keywordDifficulty >= 40 ? "#D97706" : "#059669",
              }}
            />
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-semibold font-body text-gray-400 uppercase tracking-wider">CPC</p>
          <p className="text-2xl font-headline font-black text-gray-900 mt-1">${brief.primaryMetrics.cpc.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-semibold font-body text-gray-400 uppercase tracking-wider">Related Keywords</p>
          <p className="text-2xl font-headline font-black text-gray-900 mt-1">{brief.relatedKeywords.length}</p>
        </div>
      </div>

      {/* Related Keywords Table */}
      {brief.relatedKeywords.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100">
            <h4 className="text-sm font-headline font-bold text-gray-900">Related Keywords</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left bg-gray-50/50">
                  <th className="px-5 py-2.5 font-semibold font-body text-gray-500 text-xs uppercase tracking-wider">Keyword</th>
                  <th className="px-5 py-2.5 font-semibold font-body text-gray-500 text-xs uppercase tracking-wider">Volume</th>
                  <th className="px-5 py-2.5 font-semibold font-body text-gray-500 text-xs uppercase tracking-wider">KD</th>
                  <th className="px-5 py-2.5 font-semibold font-body text-gray-500 text-xs uppercase tracking-wider">CPC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {brief.relatedKeywords.map((k, i) => (
                  <tr key={i} className="last:border-0">
                    <td className="px-5 py-2.5 font-body text-gray-900 font-medium">{k.keyword}</td>
                    <td className="px-5 py-2.5 font-body text-gray-600">{k.searchVolume.toLocaleString()}</td>
                    <td className="px-5 py-2.5">
                      <span className={`font-semibold font-body ${k.keywordDifficulty >= 70 ? "text-red-600" : k.keywordDifficulty >= 40 ? "text-amber-600" : "text-[#059669]"}`}>
                        {k.keywordDifficulty}
                      </span>
                    </td>
                    <td className="px-5 py-2.5 font-body text-gray-600">${k.cpc.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SERP Landscape */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <h4 className="text-sm font-headline font-bold text-gray-900">SERP Landscape</h4>
          {brief.serpLandscape.serpFeatures.length > 0 && (
            <div className="flex gap-1.5 flex-wrap">
              {brief.serpLandscape.serpFeatures.map((f) => (
                <SerpFeatureBadge key={f} feature={f} />
              ))}
            </div>
          )}
        </div>
        {brief.serpLandscape.topResults.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left bg-gray-50/50">
                  <th className="px-5 py-2.5 font-semibold font-body text-gray-500 text-xs uppercase tracking-wider w-12">#</th>
                  <th className="px-5 py-2.5 font-semibold font-body text-gray-500 text-xs uppercase tracking-wider">Title</th>
                  <th className="px-5 py-2.5 font-semibold font-body text-gray-500 text-xs uppercase tracking-wider">Domain</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {brief.serpLandscape.topResults.map((r, i) => (
                  <tr key={i} className="last:border-0">
                    <td className="px-5 py-2.5 font-body text-gray-400 font-bold">{r.position}</td>
                    <td className="px-5 py-2.5">
                      <a
                        href={r.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#8B5CF6] hover:underline font-medium font-body flex items-center gap-1"
                      >
                        {r.title}
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    </td>
                    <td className="px-5 py-2.5 font-body text-gray-500">{r.domain}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="px-5 py-4 text-sm text-gray-400 font-body">No SERP results available.</p>
        )}
      </div>

      {/* Competitor + Cannibalisation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:border-[#8B5CF6]/20 hover:shadow-md transition-all">
          <h4 className="text-sm font-headline font-bold text-gray-900 mb-3">Competitor Check</h4>
          {brief.competitorCheck.hasCompetitorPresence ? (
            <div className="space-y-2">
              {brief.competitorCheck.competitors.map((c, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                  <span className="text-sm font-medium font-body text-gray-700">{c.domain}</span>
                  <span className="text-xs font-bold font-body text-[#8B5CF6] bg-[#8B5CF6]/10 px-2 py-0.5 rounded-full">
                    Position {c.position}
                  </span>
                </div>
              ))}
              <p className="text-xs font-body text-amber-600 mt-2 font-medium">
                <AlertTriangle className="w-3 h-3 inline mr-1" />
                Competitors are ranking for this keyword
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-[#059669]">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-medium font-body">No competitors ranking</span>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:border-[#8B5CF6]/20 hover:shadow-md transition-all">
          <h4 className="text-sm font-headline font-bold text-gray-900 mb-3">Cannibalisation Check</h4>
          {brief.cannibalisationCheck.risk ? (
            <div className="space-y-2">
              {brief.cannibalisationCheck.overlappingContent.map((c, i) => (
                <div key={i} className="py-1.5 border-b border-gray-50 last:border-0">
                  <p className="text-sm font-medium font-body text-gray-700 truncate">{c.title}</p>
                  <p className="text-xs font-body text-gray-400 truncate">{c.url}</p>
                </div>
              ))}
              <p className="text-xs font-body text-amber-600 mt-2 font-medium">
                <AlertTriangle className="w-3 h-3 inline mr-1" />
                Consider updating existing content instead
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-[#059669]">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-medium font-body">No overlap found — safe to create</span>
            </div>
          )}
        </div>
      </div>

      {/* AI Recommendations */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h4 className="text-sm font-headline font-bold text-gray-900 mb-4">AI Recommendations</h4>
        <div className="space-y-4">
          {brief.aiAnalysis.angles.map((a, i) => (
            <div key={i} className="bg-gray-50 rounded-2xl border border-gray-100 p-5">
              <p className="text-sm font-headline font-bold text-gray-900">Angle {i + 1}: {a.angle}</p>
              <p className="text-sm font-body text-gray-600 mt-1">{a.rationale}</p>
            </div>
          ))}
        </div>
        {brief.aiAnalysis.outline.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs font-headline font-bold text-gray-500 uppercase tracking-wider mb-2">Recommended Outline</p>
            <ol className="space-y-1.5">
              {brief.aiAnalysis.outline.map((s, i) => (
                <li key={i} className="text-sm font-body text-gray-700 flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#8B5CF6]/10 text-[#8B5CF6] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  {s}
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}
