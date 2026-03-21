"use client";

import { useState } from "react";
import {
  TrendingDown,
  ArrowDown,
  ArrowUp,
  Target,
  Clock,
  MousePointer,
  Lightbulb,
  Sparkles,
  ChevronDown,
  Copy,
  Check,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  Link2,
} from "lucide-react";

const ALERT_TYPE_CONFIG: Record<
  string,
  {
    label: string;
    borderColor: string;
    bgColor: string;
    textColor: string;
    iconBg: string;
    accentColor: string;
    actionBg: string;
    actionBorder: string;
    badgeBorder: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  declining_traffic: {
    label: "Declining Traffic",
    borderColor: "border-red-600",
    bgColor: "bg-red-50",
    textColor: "text-red-600",
    iconBg: "bg-red-100",
    accentColor: "text-red-600",
    actionBg: "bg-red-50/50",
    actionBorder: "border-red-100/50",
    badgeBorder: "border-red-100",
    icon: TrendingDown,
  },
  position_drop: {
    label: "Position Slipping",
    borderColor: "border-amber-500",
    bgColor: "bg-amber-50",
    textColor: "text-amber-600",
    iconBg: "bg-amber-100",
    accentColor: "text-amber-600",
    actionBg: "bg-amber-50/50",
    actionBorder: "border-amber-100/50",
    badgeBorder: "border-amber-100",
    icon: ArrowDown,
  },
  striking_distance: {
    label: "Striking Distance",
    borderColor: "border-green-600",
    bgColor: "bg-green-50",
    textColor: "text-green-600",
    iconBg: "bg-green-100",
    accentColor: "text-green-600",
    actionBg: "bg-green-50/50",
    actionBorder: "border-green-100/50",
    badgeBorder: "border-green-100",
    icon: Target,
  },
  stale_content: {
    label: "Stale Content",
    borderColor: "border-gray-400",
    bgColor: "bg-gray-50",
    textColor: "text-gray-600",
    iconBg: "bg-gray-100",
    accentColor: "text-gray-600",
    actionBg: "bg-gray-50/50",
    actionBorder: "border-gray-100/50",
    badgeBorder: "border-gray-100",
    icon: Clock,
  },
  low_ctr: {
    label: "Low CTR",
    borderColor: "border-blue-600",
    bgColor: "bg-blue-50",
    textColor: "text-blue-600",
    iconBg: "bg-blue-100",
    accentColor: "text-blue-600",
    actionBg: "bg-blue-50/50",
    actionBorder: "border-blue-100/50",
    badgeBorder: "border-blue-100",
    icon: MousePointer,
  },
  conversion_drop: {
    label: "Conversion Drop",
    borderColor: "border-purple-600",
    bgColor: "bg-purple-50",
    textColor: "text-purple-600",
    iconBg: "bg-purple-100",
    accentColor: "text-purple-600",
    actionBg: "bg-purple-50/50",
    actionBorder: "border-purple-100/50",
    badgeBorder: "border-purple-100",
    icon: TrendingDown,
  },
};

const SEVERITY_BORDER: Record<string, string> = {
  high: "border-red-500",
  medium: "border-amber-500",
  low: "border-[#8B5CF6]",
};

function getTypeConfig(alertType: string) {
  return (
    ALERT_TYPE_CONFIG[alertType] ?? {
      label: alertType,
      borderColor: "border-gray-300",
      bgColor: "bg-gray-50",
      textColor: "text-gray-600",
      iconBg: "bg-gray-100",
      accentColor: "text-gray-600",
      actionBg: "bg-gray-50/50",
      actionBorder: "border-gray-100/50",
      badgeBorder: "border-gray-100",
      icon: Clock,
    }
  );
}

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) return `${diffDays}d ago`;
  if (diffHours > 0) return `${diffHours}h ago`;
  return "just now";
}

function getMetricValue(
  metrics: Record<string, unknown> | null,
  key: string
): number | null {
  if (!metrics || !(key in metrics)) return null;
  const val = metrics[key];
  return typeof val === "number" ? val : null;
}

function formatChange(current: number | null, previous: number | null): string | null {
  if (current === null || previous === null || previous === 0) return null;
  const pct = ((current - previous) / previous) * 100;
  const sign = pct >= 0 ? "+" : "";
  return `${sign}${pct.toFixed(1)}%`;
}

// ---------------------------------------------------------------------------
// Enrichment Renderers
// ---------------------------------------------------------------------------

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="flex items-center gap-1 px-2 py-1 text-xs font-body font-medium text-gray-500 hover:text-[#8B5CF6] hover:bg-[#8B5CF6]/5 rounded-lg transition-all"
    >
      {copied ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function CannibalizationRenderer({ data }: { data: { pages: Array<{ title: string; url: string }>; verdict: string } }) {
  const hasIssues = data.pages.length > 0;
  return (
    <div>
      <h4 className="text-xs font-headline font-bold text-gray-900 uppercase tracking-wider mb-2">Cannibalization Check</h4>
      <div className={`rounded-xl p-3 ${hasIssues ? "bg-amber-50 border border-amber-100" : "bg-green-50 border border-green-100"}`}>
        <div className="flex items-center gap-2 mb-1">
          {hasIssues ? <AlertTriangle className="w-4 h-4 text-amber-600" /> : <CheckCircle className="w-4 h-4 text-green-600" />}
          <span className={`text-sm font-body font-semibold ${hasIssues ? "text-amber-800" : "text-green-800"}`}>{data.verdict}</span>
        </div>
        {data.pages.length > 0 && (
          <ul className="mt-2 space-y-1.5">
            {data.pages.map((p, i) => (
              <li key={i} className="flex items-center gap-2 text-xs font-body text-amber-700">
                <ExternalLink className="w-3 h-3 shrink-0" />
                <span className="font-medium">{p.title}</span>
                <span className="text-amber-500 truncate">{p.url}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function TitleSuggestionsRenderer({ data }: { data: { currentTitle: string; suggestions: string[]; currentCtr: number } }) {
  return (
    <div>
      <h4 className="text-xs font-headline font-bold text-gray-900 uppercase tracking-wider mb-2">Suggested Title Tags</h4>
      <p className="text-xs font-body text-gray-500 mb-3">Current CTR: {(data.currentCtr * 100).toFixed(1)}% — try these alternatives to improve click-through rate:</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {data.suggestions.map((title, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 p-3 flex flex-col gap-2">
            <span className="text-xs font-body font-bold text-[#8B5CF6]">Option {i + 1}</span>
            <p className="text-sm font-body text-gray-900 font-medium flex-1">{title}</p>
            <CopyButton text={title} />
          </div>
        ))}
      </div>
    </div>
  );
}

function UxChecklistRenderer({ data }: { data: { items: Array<{ label: string; checked: boolean }> } }) {
  const [checks, setChecks] = useState<boolean[]>(data.items.map((i) => i.checked));
  return (
    <div>
      <h4 className="text-xs font-headline font-bold text-gray-900 uppercase tracking-wider mb-2">UX Diagnostic Checklist</h4>
      <div className="space-y-2">
        {data.items.map((item, i) => (
          <label key={i} className="flex items-start gap-2.5 cursor-pointer group">
            <input
              type="checkbox"
              checked={checks[i]}
              onChange={() => setChecks((prev) => { const next = [...prev]; next[i] = !next[i]; return next; })}
              className="mt-0.5 w-4 h-4 rounded border-gray-300 text-[#8B5CF6] focus:ring-[#8B5CF6]/20"
            />
            <span className={`text-sm font-body ${checks[i] ? "text-gray-400 line-through" : "text-gray-700"} group-hover:text-gray-900 transition-colors`}>
              {item.label}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}

function QueryLossRenderer({ data }: { data: { queries: Array<{ query: string; oldClicks: number; newClicks: number; change: number }>; dateRange: { current: string; previous: string } } }) {
  return (
    <div>
      <h4 className="text-xs font-headline font-bold text-gray-900 uppercase tracking-wider mb-2">Query Click Loss Analysis</h4>
      <p className="text-xs font-body text-gray-500 mb-3">Comparing {data.dateRange.previous} vs {data.dateRange.current}</p>
      {data.queries.length === 0 ? (
        <p className="text-sm font-body text-gray-400">No significant query losses detected.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left">
                <th className="px-3 py-2 font-body font-semibold text-gray-500 text-xs uppercase tracking-wider">Query</th>
                <th className="px-3 py-2 font-body font-semibold text-gray-500 text-xs uppercase tracking-wider text-right">Before</th>
                <th className="px-3 py-2 font-body font-semibold text-gray-500 text-xs uppercase tracking-wider text-right">After</th>
                <th className="px-3 py-2 font-body font-semibold text-gray-500 text-xs uppercase tracking-wider text-right">Change</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.queries.map((q, i) => (
                <tr key={i}>
                  <td className="px-3 py-2 font-body text-gray-900 font-medium">{q.query}</td>
                  <td className="px-3 py-2 font-body text-gray-600 text-right">{q.oldClicks}</td>
                  <td className="px-3 py-2 font-body text-gray-600 text-right">{q.newClicks}</td>
                  <td className="px-3 py-2 font-body font-semibold text-red-600 text-right">{q.change}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function InternalLinksRenderer({ data }: { data: { links: Array<{ fromTitle: string; fromUrl: string; suggestedAnchor: string }> } }) {
  return (
    <div>
      <h4 className="text-xs font-headline font-bold text-gray-900 uppercase tracking-wider mb-2">Internal Link Opportunities</h4>
      {data.links.length === 0 ? (
        <p className="text-sm font-body text-gray-400">No internal link suggestions available.</p>
      ) : (
        <div className="space-y-3">
          {data.links.map((link, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-3">
              <div className="flex items-center gap-2 mb-1.5">
                <Link2 className="w-3.5 h-3.5 text-[#8B5CF6]" />
                <span className="text-xs font-body font-semibold text-gray-900">Add link from:</span>
              </div>
              <p className="text-sm font-body text-gray-700 mb-1">{link.fromTitle}</p>
              <p className="text-xs font-body text-gray-400 truncate mb-2">{link.fromUrl}</p>
              <div className="flex items-center justify-between bg-[#8B5CF6]/5 rounded-lg px-3 py-2">
                <span className="text-xs font-body text-gray-600">Anchor text: <span className="font-semibold text-[#8B5CF6]">&ldquo;{link.suggestedAnchor}&rdquo;</span></span>
                <CopyButton text={link.suggestedAnchor} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FeaturedSnippetRenderer({ data }: { data: { snippetText: string | null; targetQuery: string } }) {
  if (!data.snippetText) return null;
  return (
    <div>
      <h4 className="text-xs font-headline font-bold text-gray-900 uppercase tracking-wider mb-2">Featured Snippet Opportunity</h4>
      <p className="text-xs font-body text-gray-500 mb-3">Add this paragraph to your page to target the featured snippet for &ldquo;{data.targetQuery}&rdquo;:</p>
      <div className="bg-[#8B5CF6]/5 border-l-4 border-[#8B5CF6] rounded-r-xl p-4">
        <p className="text-sm font-body text-gray-800 italic leading-relaxed">{data.snippetText}</p>
        <div className="mt-2 flex justify-end">
          <CopyButton text={data.snippetText} />
        </div>
      </div>
    </div>
  );
}

function IntentAnalysisRenderer({ data }: { data: { detectedIntent: string; pageAlignment: string; analysis: string } }) {
  const alignColor = data.pageAlignment === "aligned" ? "text-green-700 bg-green-50 border-green-200"
    : data.pageAlignment === "partial" ? "text-amber-700 bg-amber-50 border-amber-200"
    : "text-red-700 bg-red-50 border-red-200";
  return (
    <div>
      <h4 className="text-xs font-headline font-bold text-gray-900 uppercase tracking-wider mb-2">Search Intent Analysis</h4>
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className="px-2.5 py-1 rounded-lg text-xs font-body font-semibold bg-gray-100 text-gray-700 capitalize">{data.detectedIntent}</span>
        <span className={`px-2.5 py-1 rounded-lg text-xs font-body font-semibold border capitalize ${alignColor}`}>{data.pageAlignment}</span>
      </div>
      <p className="text-sm font-body text-gray-700 leading-relaxed">{data.analysis}</p>
    </div>
  );
}

function EnrichmentRenderer({ enrichment }: { enrichment: Record<string, unknown> }) {
  const type = enrichment.type as string;

  switch (type) {
    case "cannibalization_check":
      return <CannibalizationRenderer data={enrichment as unknown as { pages: Array<{ title: string; url: string }>; verdict: string }} />;
    case "title_suggestions":
      return <TitleSuggestionsRenderer data={enrichment as unknown as { currentTitle: string; suggestions: string[]; currentCtr: number }} />;
    case "ux_checklist":
      return <UxChecklistRenderer data={enrichment as unknown as { items: Array<{ label: string; checked: boolean }> }} />;
    case "query_loss_analysis":
      return <QueryLossRenderer data={enrichment as unknown as { queries: Array<{ query: string; oldClicks: number; newClicks: number; change: number }>; dateRange: { current: string; previous: string } }} />;
    case "internal_link_suggestions":
      return <InternalLinksRenderer data={enrichment as unknown as { links: Array<{ fromTitle: string; fromUrl: string; suggestedAnchor: string }> }} />;
    case "featured_snippet":
      return <FeaturedSnippetRenderer data={enrichment as unknown as { snippetText: string | null; targetQuery: string }} />;
    case "intent_analysis":
      return <IntentAnalysisRenderer data={enrichment as unknown as { detectedIntent: string; pageAlignment: string; analysis: string }} />;
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

interface ContentAlertCardProps {
  alert: {
    id: string;
    alertType: string;
    severity: string;
    currentMetricsJson: Record<string, unknown> | null;
    previousMetricsJson: Record<string, unknown> | null;
    suggestedAction: string | null;
    enrichmentJson: unknown | null;
    lastEnrichedAt: string | null;
    status: string;
    createdAt: string;
  };
  contentTitle: string | null;
  contentUrl: string | null;
  actionLoading: string | null;
  onAction: (alertId: string, status: string) => void;
}

export function ContentAlertCard({ alert, contentTitle, contentUrl, actionLoading, onAction }: ContentAlertCardProps) {
  const [expanded, setExpanded] = useState(false);
  const config = getTypeConfig(alert.alertType);
  const isAcknowledged = alert.status === "acknowledged";
  const borderColor =
    isAcknowledged
      ? "border-gray-300"
      : SEVERITY_BORDER[alert.severity] ?? "border-gray-300";
  const currentMetrics = alert.currentMetricsJson as Record<string, unknown> | null;
  const previousMetrics = alert.previousMetricsJson as Record<string, unknown> | null;

  const enrichments = Array.isArray(alert.enrichmentJson)
    ? (alert.enrichmentJson as Array<Record<string, unknown>>)
    : [];
  const hasEnrichment = enrichments.length > 0;

  const sessions = getMetricValue(currentMetrics, "sessions");
  const prevSessions = getMetricValue(previousMetrics, "sessions");
  const sessionsChange = formatChange(sessions, prevSessions);

  const position = getMetricValue(currentMetrics, "avg_position");
  const prevPosition = getMetricValue(previousMetrics, "avg_position");
  const positionChange =
    position !== null && prevPosition !== null && prevPosition !== 0
      ? `${(position - prevPosition).toFixed(1)}`
      : null;

  return (
    <div
      className={`rounded-2xl shadow-sm overflow-hidden border-l-4 ${borderColor} border border-gray-100 ${
        isAcknowledged ? "bg-gray-50/80" : "bg-white hover:border-[#8B5CF6]/20 hover:shadow-md"
      } transition-all`}
    >
      <div className={`p-5 ${isAcknowledged ? "opacity-70" : ""}`}>
        {/* Header row */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              {isAcknowledged ? (
                <span className="px-2 py-0.5 bg-gray-200 text-gray-600 text-[10px] font-body font-bold uppercase tracking-wider rounded-lg border border-gray-300">
                  Acknowledged
                </span>
              ) : (
                <span
                  className={`px-2 py-0.5 text-[10px] font-body font-bold uppercase tracking-wider rounded-lg border ${config.bgColor} ${config.textColor} ${config.badgeBorder}`}
                >
                  {config.label}
                </span>
              )}
              <span className="font-body text-gray-400 text-xs font-medium">
                Detected {formatTimeAgo(alert.createdAt)}
              </span>
              {hasEnrichment && (
                <span className="px-2 py-0.5 text-[10px] font-body font-bold uppercase tracking-wider rounded-lg border bg-[#8B5CF6]/5 text-[#8B5CF6] border-[#8B5CF6]/20">
                  AI Enhanced
                </span>
              )}
            </div>
            <h3 className={`text-lg font-headline font-bold ${isAcknowledged ? "text-gray-500" : "text-gray-900"}`}>
              {contentTitle || "Untitled Content"}
            </h3>
            <p className={`text-xs font-body font-medium truncate ${isAcknowledged ? "text-gray-400" : "text-gray-500"}`}>
              {contentUrl || ""}
            </p>
          </div>

          {/* Metrics on the right */}
          {!isAcknowledged && (sessions !== null || position !== null) && (
            <div className="flex items-center gap-6">
              {sessions !== null && (
                <div className="text-right">
                  <p className="text-xs font-body font-bold text-gray-400 uppercase tracking-tighter">Sessions</p>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-900 font-bold">
                      {sessions.toLocaleString()}
                    </span>
                    {sessionsChange && (
                      <div
                        className={`flex items-center text-xs font-bold ${
                          sessionsChange.startsWith("+")
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {sessionsChange.startsWith("+") ? (
                          <ArrowUp className="w-3 h-3" />
                        ) : (
                          <ArrowDown className="w-3 h-3" />
                        )}
                        {sessionsChange.replace("+", "").replace("-", "")}
                      </div>
                    )}
                  </div>
                </div>
              )}
              {position !== null && (
                <div className="text-right">
                  <p className="text-xs font-body font-bold text-gray-400 uppercase tracking-tighter">Avg Pos.</p>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-900 font-bold">
                      #{position.toFixed(0)}
                    </span>
                    {positionChange && (
                      <div
                        className={`flex items-center text-xs font-bold ${
                          parseFloat(positionChange) <= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {parseFloat(positionChange) <= 0 ? (
                          <ArrowUp className="w-3 h-3" />
                        ) : (
                          <ArrowDown className="w-3 h-3" />
                        )}
                        {Math.abs(parseFloat(positionChange)).toFixed(0)}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Action bar */}
      {alert.status !== "resolved" && !isAcknowledged && (
        <div
          className={`px-5 py-4 ${config.actionBg} border-t ${config.actionBorder} flex items-center justify-between`}
        >
          <div className="flex items-center gap-3">
            <Lightbulb className={`w-[18px] h-[18px] ${config.accentColor}`} />
            <p className="text-sm font-body font-medium text-gray-700">
              {alert.suggestedAction || "Review this content for potential improvements."}
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            {alert.status === "open" && (
              <button
                onClick={() => onAction(alert.id, "acknowledged")}
                disabled={actionLoading === alert.id}
                className="px-3 py-1.5 text-xs font-body font-bold text-gray-500 hover:text-gray-900 hover:bg-white rounded-lg transition-all border border-transparent hover:border-gray-100 disabled:opacity-50"
              >
                Dismiss
              </button>
            )}
            <button
              onClick={() => onAction(alert.id, "resolved")}
              disabled={actionLoading === alert.id}
              className="px-4 py-1.5 text-xs font-body font-semibold text-white bg-[#8B5CF6] rounded-lg hover:bg-[#7C3AED] transition-all shadow shadow-[#8B5CF6]/20 disabled:opacity-50"
            >
              Fix Now
            </button>
          </div>
        </div>
      )}

      {/* Acknowledged action bar - resolve only */}
      {alert.status === "acknowledged" && (
        <div className="px-5 py-4 bg-gray-50/50 border-t border-gray-100/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Lightbulb className="w-[18px] h-[18px] text-gray-400" />
            <p className="text-sm font-body font-medium text-gray-700">
              {alert.suggestedAction || "Review this content for potential improvements."}
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => onAction(alert.id, "resolved")}
              disabled={actionLoading === alert.id}
              className="px-4 py-1.5 text-xs font-body font-semibold text-white bg-[#8B5CF6] rounded-lg hover:bg-[#7C3AED] transition-all shadow shadow-[#8B5CF6]/20 disabled:opacity-50"
            >
              Resolve
            </button>
          </div>
        </div>
      )}

      {/* AI Recommendations toggle */}
      {hasEnrichment && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full px-5 py-3 flex items-center justify-between text-sm font-body font-semibold text-[#8B5CF6] hover:bg-[#8B5CF6]/5 transition-all border-t border-gray-100"
        >
          <span className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            View AI Recommendations ({enrichments.length})
          </span>
          <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${expanded ? "rotate-180" : ""}`} />
        </button>
      )}

      {/* Expandable enrichment content */}
      <div className={`overflow-hidden transition-all duration-300 ${expanded ? "max-h-[3000px]" : "max-h-0"}`}>
        <div className="px-5 py-5 bg-gray-50/30 border-t border-gray-100 space-y-5">
          {enrichments.map((enrichment, idx) => (
            <EnrichmentRenderer key={idx} enrichment={enrichment} />
          ))}
        </div>
      </div>
    </div>
  );
}
