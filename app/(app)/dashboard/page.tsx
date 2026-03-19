"use client";

import { useSession } from "next-auth/react";
import { useDomain } from "@/components/domain-context";
import { useState, useEffect, useCallback } from "react";
import {
  Lightbulb,
  AlertTriangle,
  TrendingUp,
  CheckCircle2,
  Loader2,
  Clock,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Check,
  Pencil,
  X,
} from "lucide-react";
import Link from "next/link";
import { ScoreBadge } from "@/components/score-badge";
import { TrendChart } from "@/components/charts/trend-chart";
import { PerformanceChart } from "@/components/charts/performance-chart";

// ---------------------------------------------------------------------------
// Types matching API response from /api/dashboard/stats
// ---------------------------------------------------------------------------

interface TopicRecommendation {
  id: string;
  primaryKeyword: string;
  opportunityScore: number;
  searchVolume: number | null;
  status: string;
}

interface ActivityItem {
  id: string;
  primaryKeyword: string;
  status: string;
  statusChangedBy: string | null;
  updatedAt: string;
}

interface OrganicWeek {
  week: string;
  totalClicks: number;
  totalImpressions: number;
}

interface DashboardData {
  newTopicsThisWeek: number;
  contentAlertsCount: number;
  avgOpportunityScore: number;
  topicsApprovedThisMonth: number;
  topRecommendations: TopicRecommendation[];
  recentActivity: ActivityItem[];
  alertsByType: Record<string, number>;
  organicTrend: OrganicWeek[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const statusColors: Record<string, string> = {
  new: "bg-blue-500",
  approved: "bg-emerald-500",
  rejected: "bg-red-500",
  in_progress: "bg-amber-500",
  published: "bg-indigo-500",
};

const statusLabels: Record<string, string> = {
  new: "New",
  approved: "Approved",
  rejected: "Rejected",
  in_progress: "In Progress",
  published: "Published",
};

// ---------------------------------------------------------------------------
// Activity icon helpers
// ---------------------------------------------------------------------------

function getActivityIcon(status: string) {
  switch (status) {
    case "approved":
      return { bg: "bg-[#3730A3]", icon: <Check className="w-3 h-3 text-white" /> };
    case "rejected":
      return { bg: "bg-red-500", icon: <X className="w-3 h-3 text-white" /> };
    case "new":
      return { bg: "bg-slate-400", icon: <RefreshCw className="w-3 h-3 text-white" /> };
    default:
      return { bg: "bg-amber-500", icon: <Pencil className="w-3 h-3 text-white" /> };
  }
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-slate-100" />
        <div className="h-3 w-24 rounded bg-slate-100" />
      </div>
      <div className="h-8 w-16 rounded bg-slate-100 mb-2" />
      <div className="h-3 w-32 rounded bg-slate-100" />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6 animate-pulse h-72" />
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 animate-pulse h-72" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function DashboardPage() {
  const { data: session } = useSession();
  const { selectedDomainId } = useDomain();

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [batchRunning, setBatchRunning] = useState(false);
  const [batchMessage, setBatchMessage] = useState<string | null>(null);
  const [trendRange, setTrendRange] = useState<string>("90");
  const [trendLoading, setTrendLoading] = useState(false);

  // Fetch dashboard data
  const [refreshKey, setRefreshKey] = useState(0);

  // Main dashboard data fetch (does NOT depend on trendRange)
  useEffect(() => {
    if (!selectedDomainId) {
      setLoading(false);
      setData(null);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetch(`/api/dashboard/stats?domainId=${selectedDomainId}&trendRange=90`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load");
        return res.json();
      })
      .then((json) => {
        if (!cancelled) setData(json);
      })
      .catch(() => {
        if (!cancelled) setData(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedDomainId, refreshKey]);

  // Separate trend-only fetch when date selector changes
  useEffect(() => {
    if (!selectedDomainId || !data) return;

    let cancelled = false;
    setTrendLoading(true);

    fetch(`/api/dashboard/stats?domainId=${selectedDomainId}&trendRange=${trendRange}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load");
        return res.json();
      })
      .then((json) => {
        if (!cancelled) {
          setData((prev) => prev ? { ...prev, organicTrend: json.organicTrend } : prev);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setTrendLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedDomainId, trendRange]);

  const runBatch = useCallback(async () => {
    setBatchRunning(true);
    setBatchMessage(null);
    try {
      const res = await fetch("/api/batch/run", { method: "POST" });
      const json = await res.json();
      if (res.ok) {
        // Build a detailed message from batch results
        const d = json.domains?.[0];
        if (d) {
          const parts: string[] = [];
          if (d.topics > 0) parts.push(`${d.topics} topics`);
          if (d.alerts > 0) parts.push(`${d.alerts} alerts`);
          if (d.snapshots > 0) parts.push(`${d.snapshots} snapshots`);
          if (d.contentSynced > 0) parts.push(`${d.contentSynced} content synced`);
          const skipped = (d.skipped ?? []).join("; ");
          const errors = (d.errors ?? []).join("; ");
          let msg = parts.length > 0 ? `Batch done: ${parts.join(", ")}` : "Batch completed — no new data generated";
          if (skipped) msg += ` | Skipped: ${skipped}`;
          if (errors) msg += ` | Errors: ${errors}`;
          setBatchMessage(msg);
        } else {
          setBatchMessage("Batch completed successfully");
        }
        // Re-fetch dashboard stats to show new data
        setRefreshKey((k) => k + 1);
      } else {
        setBatchMessage(json.error ?? "Batch failed");
      }
    } catch {
      setBatchMessage("Network error");
    } finally {
      setBatchRunning(false);
    }
  }, []);

  if (!session) return null;

  const userName = session.user?.name?.split(" ")[0] ?? "there";

  // No domain selected
  if (!selectedDomainId) {
    return (
      <div className="p-8">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
          <p className="text-slate-500 text-lg">
            Select a domain from the dropdown above to view your dashboard.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Welcome strip */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {getGreeting()}, {userName}
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Here&apos;s what&apos;s happening with your content performance today.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {batchMessage && (
            <span className="text-xs text-slate-500">{batchMessage}</span>
          )}
          <button
            onClick={runBatch}
            disabled={batchRunning}
            className="inline-flex items-center gap-2 bg-[#3730A3] hover:bg-[#4F46E5] disabled:opacity-60 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors shadow-lg shadow-[#3730A3]/20"
          >
            {batchRunning ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Run Manual Batch
          </button>
        </div>
      </div>

      {loading ? (
        <DashboardSkeleton />
      ) : !data ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
          <p className="text-slate-500">
            No data available yet. Run a batch to start collecting insights.
          </p>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* New Topics */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 text-sm font-medium">
                    New Topics
                  </span>
                </div>
                <div className="bg-indigo-50 p-2 rounded-xl text-indigo-600">
                  <Lightbulb className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-extrabold text-slate-900">
                  {data.newTopicsThisWeek}
                </span>
                {data.newTopicsThisWeek > 0 && (
                  <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-[10px] font-bold mb-1 flex items-center gap-0.5">
                    <ArrowUp className="w-3 h-3" />
                    {data.newTopicsThisWeek}
                  </span>
                )}
              </div>
              <p className="text-emerald-600 text-xs font-semibold">
                +{data.newTopicsThisWeek} vs last week
              </p>
            </div>

            {/* Content Alerts */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 text-sm font-medium">
                    Content Alerts
                  </span>
                </div>
                <div className="bg-amber-100 p-2 rounded-xl text-amber-600">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-extrabold text-slate-900">
                  {data.contentAlertsCount}
                </span>
                {data.contentAlertsCount > 0 && (
                  <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-[10px] font-bold mb-1 flex items-center gap-0.5">
                    <ArrowDown className="w-3 h-3" />
                    {data.contentAlertsCount}
                  </span>
                )}
              </div>
              <p className="text-red-600 text-xs font-semibold">
                {data.contentAlertsCount} alerts require attention
              </p>
            </div>

            {/* Avg Opportunity Score */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 text-sm font-medium">
                    Avg Opportunity Score
                  </span>
                </div>
                <div className="bg-emerald-50 p-2 rounded-xl text-emerald-600">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-extrabold text-slate-900">
                  {Math.round(data.avgOpportunityScore)}
                </span>
                <span className="text-lg font-medium text-slate-400 mb-0.5">
                  /100
                </span>
                {data.avgOpportunityScore >= 50 && (
                  <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-[10px] font-bold mb-1 flex items-center gap-0.5">
                    <ArrowUp className="w-3 h-3" />
                    Good
                  </span>
                )}
              </div>
              <p className="text-emerald-600 text-xs font-semibold">
                +5 pts than last week
              </p>
            </div>

            {/* Topics Approved */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 text-sm font-medium">
                    Topics Approved
                  </span>
                </div>
                <div className="bg-indigo-50 p-2 rounded-xl text-indigo-600">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-extrabold text-slate-900">
                  {data.topicsApprovedThisMonth}
                </span>
              </div>
              <p className="text-slate-400 text-xs font-medium">
                of {data.topicsApprovedThisMonth + data.newTopicsThisWeek} total
              </p>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Organic Performance Trend */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="font-bold text-lg text-slate-900">
                    Organic Performance Trend
                  </h2>
                  <p className="text-xs text-slate-500">Track clicks and impressions across all content.</p>
                </div>
                <div className="flex items-center gap-4">
                  <select
                    value={trendRange}
                    onChange={(e) => setTrendRange(e.target.value)}
                    className="text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-[#3730A3]/20"
                  >
                    <option value="7">Last 7 days</option>
                    <option value="30">Last 30 days</option>
                    <option value="56">Last 8 weeks</option>
                    <option value="90">Last 3 months</option>
                  </select>
                  <span className="flex items-center gap-1.5 text-xs text-slate-500">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#3730A3]" />
                    Clicks
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-slate-500">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                    Impressions
                  </span>
                </div>
              </div>
              {trendLoading ? (
                <div className="flex items-center justify-center h-[280px] text-slate-400 text-sm">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Loading trend data...
                </div>
              ) : (
                <TrendChart data={data.organicTrend} />
              )}
            </div>

            {/* Alerts by Type */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h2 className="font-bold text-lg text-slate-900 mb-6">
                Alerts by Type
              </h2>
              <PerformanceChart alertsByType={data.alertsByType} />
            </div>
          </div>

          {/* Bottom Section */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
            {/* Top Recommendations */}
            <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 flex items-center justify-between border-b border-slate-100">
                <h2 className="font-bold text-lg text-slate-900">
                  Top Recommendations
                </h2>
                <Link
                  href="/topics"
                  className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                >
                  View All
                </Link>
              </div>
              {data.topRecommendations.length === 0 ? (
                <p className="text-sm text-slate-400 py-6 text-center">
                  No recommendations yet. Run a batch to discover topics.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[11px] tracking-wider">
                      <tr>
                        <th className="px-6 py-4 text-left">Topic / Keyword</th>
                        <th className="px-6 py-4 text-left">Opp. Score</th>
                        <th className="px-6 py-4 text-center">Vol.</th>
                        <th className="px-6 py-4 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.topRecommendations.map((rec) => (
                        <tr
                          key={rec.id}
                          className="hover:bg-slate-50 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <Link
                              href="/topics"
                              className="hover:text-indigo-600 transition-colors"
                            >
                              <span className="font-semibold text-slate-900">
                                {rec.primaryKeyword}
                              </span>
                              <p className="text-xs text-slate-500">
                                {rec.status === "approved" ? "Approved topic" : rec.status === "rejected" ? "Rejected topic" : "Pending review"}
                              </p>
                            </Link>
                          </td>
                          <td className="px-6 py-4">
                            <ScoreBadge score={rec.opportunityScore} showMax />
                          </td>
                          <td className="px-6 py-4 text-center text-slate-600 font-medium">
                            {rec.searchVolume != null
                              ? rec.searchVolume.toLocaleString()
                              : "--"}
                          </td>
                          <td className="px-6 py-4">
                            <span className="flex items-center gap-1.5 text-xs font-medium">
                              <span
                                className={`size-1.5 rounded-full ${
                                  statusColors[rec.status] ?? "bg-slate-400"
                                }`}
                              />
                              <span className="text-slate-600">
                                {statusLabels[rec.status] ?? rec.status}
                              </span>
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Recent Activity */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col">
              <h2 className="font-bold text-lg text-slate-900 mb-6">
                Recent Activity
              </h2>
              {data.recentActivity.length === 0 ? (
                <p className="text-sm text-slate-400 py-6 text-center">
                  No recent activity.
                </p>
              ) : (
                <div className="space-y-6 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-px before:bg-slate-200">
                  {data.recentActivity.map((item) => {
                    const { bg, icon } = getActivityIcon(item.status);
                    return (
                      <div key={item.id} className="relative pl-10">
                        <div className={`absolute left-1.5 top-1 size-5 rounded-full ${bg} flex items-center justify-center ring-4 ring-white z-10`}>
                          {icon}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {item.statusChangedBy ?? "System"}{" "}
                            <span className="font-normal text-slate-500">
                              changed{" "}
                            </span>
                            {item.primaryKeyword}{" "}
                            <span className="font-normal text-slate-500">
                              to{" "}
                            </span>
                            {statusLabels[item.status] ?? item.status}
                          </p>
                          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {timeAgo(item.updatedAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="mt-auto pt-6 border-t border-slate-100">
                <Link
                  href="/topics"
                  className="text-sm text-slate-500 font-medium hover:text-[#3730A3]"
                >
                  View Full History
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
