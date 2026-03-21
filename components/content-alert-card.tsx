"use client";

import {
  TrendingDown,
  ArrowDown,
  ArrowUp,
  Target,
  Clock,
  MousePointer,
  Lightbulb,
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

interface ContentAlertCardProps {
  alert: {
    id: string;
    alertType: string;
    severity: string;
    currentMetricsJson: Record<string, unknown> | null;
    previousMetricsJson: Record<string, unknown> | null;
    suggestedAction: string | null;
    status: string;
    createdAt: string;
  };
  contentTitle: string | null;
  contentUrl: string | null;
  actionLoading: string | null;
  onAction: (alertId: string, status: string) => void;
}

export function ContentAlertCard({ alert, contentTitle, contentUrl, actionLoading, onAction }: ContentAlertCardProps) {
  const config = getTypeConfig(alert.alertType);
  const isAcknowledged = alert.status === "acknowledged";
  const borderColor =
    isAcknowledged
      ? "border-gray-300"
      : SEVERITY_BORDER[alert.severity] ?? "border-gray-300";
  const currentMetrics = alert.currentMetricsJson as Record<string, unknown> | null;
  const previousMetrics = alert.previousMetricsJson as Record<string, unknown> | null;

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
                {isAcknowledged
                  ? `Detected ${formatTimeAgo(alert.createdAt)}`
                  : `Detected ${formatTimeAgo(alert.createdAt)}`}
              </span>
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
    </div>
  );
}
