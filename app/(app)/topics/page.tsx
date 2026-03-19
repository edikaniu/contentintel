"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useDomain } from "@/components/domain-context";
import {
  ChevronDown,
  ChevronUp,
  Check,
  X,
  Download,
  Search,
  Play,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { ScoreBadge } from "@/components/score-badge";

interface Topic {
  id: string;
  domainId: string;
  batchDate: string;
  primaryKeyword: string;
  supportingKeywordsJson: { keyword: string; volume?: number; kd?: number; searchVolume?: number; keywordDifficulty?: number }[] | null;
  searchVolume: number | null;
  keywordDifficulty: number | null;
  opportunityScore: number | null;
  scoreBreakdownJson: Record<string, unknown> | null;
  competitorDataJson: { competitor: string; rank?: number; url?: string }[] | null;
  serpFeaturesJson: string[] | null;
  suggestedContentType: string | null;
  aiAngle: string | null;
  aiOutline: string | null;
  source: string;
  status: string;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
}

type StatusFilter = "" | "pending" | "approved" | "rejected";
type SortOption = "score" | "volume" | "difficulty" | "date";

const STATUS_TABS: { label: string; value: StatusFilter }[] = [
  { label: "All Topics", value: "" },
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
];

const SORT_OPTIONS: { label: string; value: SortOption }[] = [
  { label: "Opportunity", value: "score" },
  { label: "Search Volume", value: "volume" },
  { label: "Keyword Difficulty", value: "difficulty" },
  { label: "Date", value: "date" },
];

const ITEMS_PER_PAGE = 10;

function formatVolume(vol: number | null): string {
  if (vol === null) return "--";
  if (vol >= 1000) return (vol / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  return vol.toLocaleString();
}

function statusBadgeClasses(status: string): string {
  if (status === "approved") return "bg-emerald-100 text-emerald-700";
  if (status === "rejected") return "bg-red-100 text-red-700";
  return "bg-orange-100 text-orange-700";
}

function statusLabel(status: string): string {
  return status.toUpperCase();
}

function scoreBarColor(score: number | null): string {
  if (score === null) return "bg-slate-300";
  if (score >= 70) return "bg-emerald-500";
  if (score >= 50) return "bg-amber-500";
  return "bg-slate-400";
}

function difficultyColor(kd: number | null): string {
  if (kd === null) return "text-slate-500";
  if (kd >= 70) return "text-red-600";
  if (kd >= 40) return "text-amber-600";
  return "text-emerald-600";
}

// Generate category-like tags from content type, source, etc.
function getCategoryTags(topic: Topic): { label: string; color: string }[] {
  const tags: { label: string; color: string }[] = [];
  if (topic.suggestedContentType) {
    tags.push({ label: topic.suggestedContentType, color: "bg-indigo-100 text-indigo-700" });
  }
  if (topic.source) {
    const sourceLabel = topic.source === "competitor_gap" ? "Competitor Gap" : topic.source === "trending" ? "Trending" : topic.source.replace(/_/g, " ");
    tags.push({ label: sourceLabel, color: "bg-slate-100 text-slate-600" });
  }
  if (topic.searchVolume !== null && topic.searchVolume >= 5000) {
    tags.push({ label: "High Volume", color: "bg-emerald-100 text-emerald-700" });
  }
  return tags;
}

export default function TopicsPage() {
  const router = useRouter();
  const { selectedDomainId } = useDomain();

  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("");
  const [sort, setSort] = useState<SortOption>("score");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [discoveryRunning, setDiscoveryRunning] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchTopics = useCallback(async () => {
    if (!selectedDomainId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ domainId: selectedDomainId, sort });
      if (statusFilter) params.set("status", statusFilter);
      if (search) params.set("search", search);
      const res = await fetch(`/api/topics?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setTopics(data.topics ?? []);
      }
    } catch {
      // fetch failed
    } finally {
      setLoading(false);
    }
  }, [selectedDomainId, statusFilter, sort, search]);

  useEffect(() => {
    fetchTopics();
  }, [fetchTopics]);

  // Clear selections when filter changes
  useEffect(() => {
    setSelectedIds(new Set());
  }, [statusFilter, sort, search]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, sort, search, topics.length]);

  const totalPages = Math.max(1, Math.ceil(topics.length / ITEMS_PER_PAGE));
  const paginatedTopics = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return topics.slice(start, start + ITEMS_PER_PAGE);
  }, [topics, currentPage]);

  const handleStatusUpdate = async (
    topicId: string,
    newStatus: "approved" | "rejected",
    reason?: string
  ) => {
    setActionLoading(topicId);
    try {
      const body: Record<string, string> = { status: newStatus };
      if (newStatus === "rejected" && reason) {
        body.rejectionReason = reason;
      }
      const res = await fetch(`/api/topics/${topicId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const data = await res.json();
        setTopics((prev) =>
          prev.map((t) => (t.id === topicId ? { ...t, ...data.topic } : t))
        );
        setRejectingId(null);
        setRejectionReason("");
      }
    } catch {
      // action failed
    } finally {
      setActionLoading(null);
    }
  };

  const handleBulkAction = async (newStatus: "approved" | "rejected") => {
    const ids = Array.from(selectedIds);
    for (const id of ids) {
      await handleStatusUpdate(
        id,
        newStatus,
        newStatus === "rejected" ? "Bulk rejected" : undefined
      );
    }
    setSelectedIds(new Set());
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === topics.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(topics.map((t) => t.id)));
    }
  };

  const handleExportCsv = () => {
    if (!selectedDomainId) return;
    const params = new URLSearchParams({
      domainId: selectedDomainId,
      format: "csv",
    });
    if (statusFilter) params.set("status", statusFilter);
    window.open(`/api/topics?${params.toString()}`, "_blank");
  };

  const handleRunDiscovery = async () => {
    setDiscoveryRunning(true);
    try {
      const res = await fetch("/api/batch/run", { method: "POST" });
      if (res.ok) {
        // Refetch topics after discovery completes
        await fetchTopics();
      }
    } catch {
      // failed
    } finally {
      setDiscoveryRunning(false);
    }
  };

  if (!selectedDomainId) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          Topic Recommendations
        </h1>
        <p className="text-slate-500">
          Select a domain to view topic recommendations.
        </p>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Topic Recommendations
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {topics.length} potential high-traffic topics identified for your domain.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={handleRunDiscovery}
            disabled={discoveryRunning}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white rounded-xl shadow-lg shadow-indigo-600/20 transition-colors disabled:opacity-50"
            style={{ backgroundColor: "#3730A3" }}
          >
            {discoveryRunning ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            {discoveryRunning ? "Running..." : "Run Manual Batch"}
          </button>
        </div>
      </div>

      {/* Filters row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        {/* Status tabs — text style */}
        <div className="flex items-center gap-4 sm:gap-6 overflow-x-auto">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`pb-1 text-sm font-medium transition-colors border-b-2 ${
                statusFilter === tab.value
                  ? "text-indigo-700 border-indigo-700"
                  : "text-slate-500 border-transparent hover:text-slate-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search keywords..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-56"
            />
          </div>

          {/* Sort */}
          <div className="flex items-center gap-1.5">
            <span className="text-sm text-slate-500 whitespace-nowrap">Sort by:</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              className="px-2 py-2 text-sm font-medium text-indigo-700 bg-transparent border-none focus:outline-none focus:ring-0 cursor-pointer"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Bulk actions bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-4 mb-4 px-4 py-3 bg-indigo-50 border border-indigo-200 rounded-lg">
          <input
            type="checkbox"
            checked={selectedIds.size === topics.length && topics.length > 0}
            onChange={toggleSelectAll}
            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
          <span className="text-sm font-medium text-indigo-900">
            {selectedIds.size} selected
          </span>
          <button
            onClick={() => handleBulkAction("approved")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-emerald-700 bg-emerald-100 rounded-md hover:bg-emerald-200 transition-colors"
          >
            <Check className="w-3.5 h-3.5" />
            Approve All
          </button>
          <button
            onClick={() => handleBulkAction("rejected")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            Reject All
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          <span className="ml-2 text-sm text-slate-500">Loading topics...</span>
        </div>
      )}

      {/* Empty state */}
      {!loading && topics.length === 0 && (
        <div className="text-center py-20">
          <p className="text-slate-500 text-sm">
            No topic recommendations found.{" "}
            {search
              ? "Try a different search term."
              : "Run discovery to generate topics."}
          </p>
        </div>
      )}

      {/* Topic list */}
      {!loading && topics.length > 0 && (
        <div className="space-y-3">
          {/* Column headers */}
          <div className="hidden md:grid grid-cols-[1fr_auto_auto_auto_auto_auto] items-center gap-4 px-5 py-2">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Topic</span>
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider w-28 text-center">Opp. Score</span>
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider w-20 text-center">Difficulty</span>
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider w-16 text-right">Vol.</span>
            <span className="w-20" />
            <span className="w-5" />
          </div>

          {paginatedTopics.map((topic) => {
            const isExpanded = expandedId === topic.id;
            const supportingKeywords = Array.isArray(topic.supportingKeywordsJson)
              ? (topic.supportingKeywordsJson as { keyword: string; volume?: number; kd?: number; searchVolume?: number; keywordDifficulty?: number }[])
              : [];
            const categoryTags = getCategoryTags(topic);

            return (
              <div
                key={topic.id}
                className={`bg-white rounded-xl border transition-colors ${
                  isExpanded ? "border-slate-300 shadow-sm" : "border-slate-200 hover:border-slate-300"
                }`}
              >
                {/* Collapsed row */}
                <div
                  className="flex flex-col md:grid md:grid-cols-[1fr_auto_auto_auto_auto_auto] md:items-center gap-3 md:gap-4 px-5 py-4 cursor-pointer"
                  onClick={() =>
                    setExpandedId(isExpanded ? null : topic.id)
                  }
                >
                  {/* Topic name + tags + status */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-semibold text-slate-900 text-sm">
                        {topic.primaryKeyword}
                      </span>
                      <span
                        className={`inline-flex px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full ${statusBadgeClasses(
                          topic.status
                        )}`}
                      >
                        {statusLabel(topic.status)}
                      </span>
                    </div>
                    {categoryTags.length > 0 && (
                      <div className="flex items-center gap-1.5 mt-1.5">
                        {categoryTags.map((tag, i) => (
                          <span
                            key={i}
                            className={`inline-flex px-2 py-0.5 text-[10px] font-medium rounded-full ${tag.color}`}
                          >
                            {tag.label}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Mobile metrics row */}
                  <div className="flex items-center gap-4 md:contents">
                    {/* Opportunity Score */}
                    <div className="md:w-28 md:text-center">
                      <ScoreBadge score={topic.opportunityScore} showMax />
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1">
                        <div
                          className={`h-full rounded-full ${scoreBarColor(topic.opportunityScore)}`}
                          style={{
                            width: `${topic.opportunityScore !== null ? Math.round(topic.opportunityScore) : 0}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Difficulty */}
                    <div className="md:w-20 md:text-center">
                      <span className={`text-sm font-semibold ${difficultyColor(topic.keywordDifficulty)}`}>
                        {topic.keywordDifficulty !== null
                          ? Math.round(topic.keywordDifficulty)
                          : "--"}
                      </span>
                    </div>

                    {/* Volume */}
                    <div className="md:w-16 md:text-right">
                      <span className="text-sm font-semibold text-slate-800">
                        {formatVolume(topic.searchVolume)}
                      </span>
                    </div>

                    {/* Action buttons */}
                    <div
                      className="flex items-center gap-2 md:w-20 md:justify-center ml-auto"
                      onClick={(e) => e.stopPropagation()}
                    >
                    {topic.status === "pending" && (
                      <>
                        <button
                          onClick={() =>
                            handleStatusUpdate(topic.id, "approved")
                          }
                          disabled={actionLoading === topic.id}
                          className="w-8 h-8 flex items-center justify-center rounded-full bg-emerald-100 text-emerald-600 hover:bg-emerald-200 transition-colors disabled:opacity-50"
                          title="Approve"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (rejectingId === topic.id) {
                              setRejectingId(null);
                              setRejectionReason("");
                            } else {
                              setRejectingId(topic.id);
                            }
                          }}
                          disabled={actionLoading === topic.id}
                          className="w-8 h-8 flex items-center justify-center rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-colors disabled:opacity-50"
                          title="Reject"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>

                    {/* Expand arrow */}
                    <div className="w-5 flex items-center justify-center">
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Rejection reason input (shown inline below the row when reject button clicked) */}
                {rejectingId === topic.id && (
                  <div
                    className="px-5 pb-3 flex items-center gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="text"
                      placeholder="Reason for rejection..."
                      value={rejectionReason}
                      onChange={(e) =>
                        setRejectionReason(e.target.value)
                      }
                      className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent flex-1 max-w-sm"
                      autoFocus
                    />
                    <button
                      onClick={() => {
                        if (rejectionReason.trim()) {
                          handleStatusUpdate(
                            topic.id,
                            "rejected",
                            rejectionReason.trim()
                          );
                        }
                      }}
                      disabled={
                        !rejectionReason.trim() ||
                        actionLoading === topic.id
                      }
                      className="px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => {
                        setRejectingId(null);
                        setRejectionReason("");
                      }}
                      className="px-3 py-1.5 text-sm text-slate-500 hover:text-slate-700"
                    >
                      Cancel
                    </button>
                  </div>
                )}

                {/* Expanded view — two columns */}
                {isExpanded && (
                  <div className="border-t border-slate-100 px-5 py-5">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Left: Keyword Landscape */}
                      <div>
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                          Keyword Landscape
                        </h4>
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-xs text-slate-400 uppercase tracking-wider">
                              <th className="text-left pb-2 font-medium">Variant Keyword</th>
                              <th className="text-right pb-2 font-medium">Volume</th>
                              <th className="text-right pb-2 font-medium">KD</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {supportingKeywords.length > 0 ? (
                              supportingKeywords.map((sk, i) => (
                                <tr key={i}>
                                  <td className="py-2 text-slate-700">{sk.keyword}</td>
                                  <td className="py-2 text-right text-slate-600">
                                    {(sk.searchVolume ?? sk.volume) != null ? (sk.searchVolume ?? sk.volume)!.toLocaleString() : "--"}
                                  </td>
                                  <td className="py-2 text-right text-slate-600">
                                    {(sk.keywordDifficulty ?? sk.kd) != null ? `${(sk.keywordDifficulty ?? sk.kd)}` : "--"}
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={3} className="py-3 text-slate-400 text-center">
                                  No keyword variants available
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>

                      {/* Right: AI Recommendation Outline */}
                      <div>
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          AI Recommendation Outline
                        </h4>
                        {topic.aiOutline ? (
                          <ul className="space-y-2.5 text-sm text-slate-700">
                            {topic.aiOutline.split("\n").filter(Boolean).map((line, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
                                <span>{line.replace(/^[-*•]\s*/, "")}</span>
                              </li>
                            ))}
                          </ul>
                        ) : topic.aiAngle ? (
                          <p className="text-sm text-slate-700">{topic.aiAngle}</p>
                        ) : (
                          <p className="text-sm text-slate-400">No AI outline available</p>
                        )}
                        <div className="mt-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/validate?keyword=${encodeURIComponent(topic.primaryKeyword)}`);
                            }}
                            className="text-sm font-semibold text-indigo-700 hover:text-indigo-800 transition-colors"
                          >
                            VIEW FULL BRIEF &rsaquo;
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Rejection reason display */}
                    {topic.status === "rejected" && topic.rejectionReason && (
                      <div className="mt-4 pt-4 border-t border-slate-100">
                        <p className="text-sm text-red-600">
                          <span className="font-medium">Rejected:</span>{" "}
                          {topic.rejectionReason}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Pagination */}
          <div className="flex items-center justify-between pt-4 px-1">
            <p className="text-sm text-slate-500">
              Showing {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, topics.length)}-{Math.min(currentPage * ITEMS_PER_PAGE, topics.length)} of {topics.length} topics
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                    currentPage === page
                      ? "text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                  style={currentPage === page ? { backgroundColor: "#3730A3" } : undefined}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
