"use client";

import { useState, useEffect, useCallback } from "react";
import { useDomain } from "@/components/domain-context";
import {
  TrendingDown,
  ArrowDown,
  Target,
  Clock,
  MousePointer,
  Search,
  Download,
  RefreshCw,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Info,
  ShoppingCart,
} from "lucide-react";
import { ContentAlertCard } from "@/components/content-alert-card";

interface AlertData {
  id: string;
  contentId: string;
  batchDate: string;
  alertType: string;
  severity: string;
  currentMetricsJson: Record<string, unknown> | null;
  previousMetricsJson: Record<string, unknown> | null;
  suggestedAction: string | null;
  priorityScore: number | null;
  status: string;
  createdAt: string;
  enrichmentJson: unknown | null;
  lastEnrichedAt: string | null;
}

interface AlertRow {
  alert: AlertData;
  contentTitle: string | null;
  contentUrl: string | null;
}

const ALERT_TYPE_CONFIG: Record<string, { label: string }> = {
  declining_traffic: { label: "Declining Traffic" },
  position_drop: { label: "Position Slipping" },
  striking_distance: { label: "Striking Distance" },
  stale_content: { label: "Stale Content" },
  low_ctr: { label: "Low CTR" },
  conversion_drop: { label: "Conversion Drop" },
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function ContentHealthPage() {
  const { selectedDomainId } = useDomain();
  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rescanning, setRescanning] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [cleanupMessage, setCleanupMessage] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const fetchAlerts = useCallback(async () => {
    if (!selectedDomainId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ domainId: selectedDomainId });
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (typeFilter !== "all") params.set("alertType", typeFilter);
      const res = await fetch(`/api/content/alerts?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setAlerts(data.alerts ?? []);
      }
    } catch {
      // fetch failed
    } finally {
      setLoading(false);
    }
  }, [selectedDomainId, statusFilter, typeFilter]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const handleAction = async (alertId: string, status: string) => {
    setActionLoading(alertId);
    try {
      const res = await fetch(`/api/content/alerts/${alertId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        await fetchAlerts();
      }
    } catch {
      // action failed
    } finally {
      setActionLoading(null);
    }
  };

  const handleExport = () => {
    if (!selectedDomainId) return;
    const params = new URLSearchParams({ domainId: selectedDomainId, format: "csv" });
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (typeFilter !== "all") params.set("alertType", typeFilter);
    window.open(`/api/content/alerts?${params.toString()}`, "_blank");
  };

  const handleRescan = async () => {
    setRescanning(true);
    try {
      const res = await fetch("/api/batch/run", { method: "POST" });
      if (res.ok) {
        await fetchAlerts();
      }
    } catch {
      // rescan failed
    } finally {
      setRescanning(false);
    }
  };

  const handleCleanup = async () => {
    if (!confirm("This will remove duplicate alerts and keep only the highest-priority version of each. Continue?")) return;
    setCleaning(true);
    setCleanupMessage(null);
    try {
      const res = await fetch("/api/content/alerts/cleanup", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setCleanupMessage(data.message);
        await fetchAlerts();
      } else {
        setCleanupMessage(data.error ?? "Cleanup failed");
      }
    } catch {
      setCleanupMessage("Network error");
    } finally {
      setCleaning(false);
    }
  };

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, typeFilter, priorityFilter, searchQuery]);

  // Client-side filters for priority and search
  const filteredAlerts = alerts.filter((row) => {
    if (priorityFilter !== "all" && row.alert.severity !== priorityFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const title = (row.contentTitle ?? "").toLowerCase();
      const url = (row.contentUrl ?? "").toLowerCase();
      if (!title.includes(q) && !url.includes(q)) return false;
    }
    return true;
  });

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredAlerts.length / pageSize));
  const paginatedAlerts = filteredAlerts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Summary counts
  const openAlerts = alerts.filter((r) => r.alert.status === "open");
  const typeCounts: Record<string, number> = {};
  for (const row of openAlerts) {
    typeCounts[row.alert.alertType] = (typeCounts[row.alert.alertType] ?? 0) + 1;
  }

  const lastScanned =
    alerts.length > 0
      ? formatDate(
          alerts.reduce((latest, r) =>
            r.alert.createdAt > latest ? r.alert.createdAt : latest,
            alerts[0].alert.createdAt
          )
        )
      : "Never";

  const summaryTypes = [
    { key: "declining_traffic", icon: TrendingDown, color: "text-red-500", iconBg: "bg-red-100", tooltip: "" },
    { key: "position_drop", icon: ArrowDown, color: "text-amber-500", iconBg: "bg-amber-100", tooltip: "" },
    { key: "striking_distance", icon: Target, color: "text-green-500", iconBg: "bg-green-100", tooltip: "Pages ranking positions 5–20 that could reach page 1 with targeted optimisation" },
    { key: "stale_content", icon: Clock, color: "text-gray-500", iconBg: "bg-gray-100", tooltip: "" },
    { key: "low_ctr", icon: MousePointer, color: "text-blue-500", iconBg: "bg-blue-100", tooltip: "" },
    { key: "conversion_drop", icon: ShoppingCart, color: "text-purple-500", iconBg: "bg-purple-100", tooltip: "" },
  ];

  if (!selectedDomainId) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-headline font-bold text-gray-900 tracking-tight">Content Health</h1>
        <p className="text-gray-400 font-body mt-2">Select a domain to view content health alerts.</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-headline font-bold text-gray-900 tracking-tight">Content Health</h1>
          <p className="mt-1 text-gray-500 font-body font-medium flex items-center gap-2">
            <span className="w-2 h-2 bg-[#8B5CF6] rounded-full animate-pulse" />
            {openAlerts.length} active alert{openAlerts.length !== 1 ? "s" : ""} &middot; Last
            scanned {lastScanned}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {cleanupMessage && (
            <span className="text-xs font-body text-gray-400">{cleanupMessage}</span>
          )}
          <button
            onClick={handleCleanup}
            disabled={cleaning}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-body font-semibold border border-gray-100 text-gray-600 hover:bg-gray-50 rounded-xl transition-all disabled:opacity-60"
          >
            {cleaning ? "Cleaning..." : "Clean Up Duplicates"}
          </button>
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-body font-semibold text-gray-600 border border-gray-100 hover:bg-gray-50 rounded-xl transition-all"
          >
            <Download className="w-4 h-4" />
            Export Alerts
          </button>
          <button
            onClick={handleRescan}
            disabled={rescanning}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-body font-semibold bg-[#8B5CF6] text-white hover:bg-[#7C3AED] rounded-xl transition-all shadow-lg shadow-[#8B5CF6]/20 disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 ${rescanning ? "animate-spin" : ""}`} />
            {rescanning ? "Scanning..." : "Rescan Now"}
          </button>
        </div>
      </div>

      {/* Summary grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {summaryTypes.map((st) => {
          const config = ALERT_TYPE_CONFIG[st.key];
          const count = typeCounts[st.key] ?? 0;
          const Icon = st.icon;
          const isActive = typeFilter === st.key;

          return (
            <button
              key={st.key}
              onClick={() => setTypeFilter(isActive ? "all" : st.key)}
              className={`bg-white p-5 rounded-2xl shadow-sm border text-left transition-all flex flex-col gap-3 ${
                isActive
                  ? "border-[#8B5CF6] ring-2 ring-[#8B5CF6]/20"
                  : "border-gray-100 hover:border-[#8B5CF6]/20 hover:shadow-md"
              }`}
            >
              <div className="flex items-center gap-2 text-gray-400">
                <Icon className="w-[18px] h-[18px]" />
                <span className="text-xs font-body font-semibold uppercase tracking-wider">
                  {config?.label ?? st.key}
                </span>
                {st.tooltip && (
                  <span className="relative group">
                    <Info className="w-3.5 h-3.5 text-gray-300 hover:text-gray-500 cursor-help" />
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 px-3 py-2 bg-gray-800 text-white text-[11px] leading-snug rounded-lg shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-20">
                      {st.tooltip}
                    </span>
                  </span>
                )}
              </div>
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-headline font-bold text-gray-900">{count}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Filter bar */}
      <div className="bg-white p-2 rounded-xl shadow-sm flex flex-wrap items-center justify-between gap-4 mb-8">
        {/* Status tabs */}
        <div className="flex bg-gray-50 p-1 rounded-lg">
          {[
            { value: "all", label: "All" },
            { value: "open", label: "Open" },
            { value: "acknowledged", label: "Acknowledged" },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`px-4 py-1.5 text-sm font-body rounded-md transition-all ${
                statusFilter === tab.value
                  ? "bg-white text-gray-900 shadow-sm font-semibold"
                  : "text-gray-500 hover:text-gray-700 font-medium"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Priority dropdown */}
        <div className="flex-1 flex items-center gap-3">
          <div className="relative">
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="appearance-none bg-white border border-gray-100 rounded-xl px-3 py-1.5 pr-8 text-sm font-body font-medium text-gray-600 hover:border-gray-200 focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6]/20"
            >
              <option value="all">Priority: All</option>
              <option value="high">Priority: High</option>
              <option value="medium">Priority: Medium</option>
              <option value="low">Priority: Low</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Sort + Search */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm font-body font-medium text-gray-500">
            <span>Sort: Newest</span>
          </div>
          <div className="h-6 w-px bg-gray-100" />
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search pages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-4 py-1.5 text-xs font-body bg-transparent border-none focus:ring-0 w-40"
            />
          </div>
        </div>
      </div>

      {/* Alert feed */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse"
            >
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-3" />
              <div className="h-5 bg-gray-200 rounded w-1/2 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : filteredAlerts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Target className="w-6 h-6 text-gray-400" />
          </div>
          <h3 className="text-lg font-headline font-bold text-gray-900 mb-1">No alerts found</h3>
          <p className="text-sm text-gray-400 font-body">
            {alerts.length === 0
              ? "No content health alerts have been generated yet. Run a scan to detect issues."
              : "No alerts match the current filters."}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {paginatedAlerts.map((row) => (
              <ContentAlertCard
                key={row.alert.id}
                alert={row.alert}
                contentTitle={row.contentTitle}
                contentUrl={row.contentUrl}
                actionLoading={actionLoading}
                onAction={handleAction}
              />
            ))}
          </div>

          {/* Pagination controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 bg-white rounded-2xl border border-gray-100 p-4">
              <p className="text-sm font-body text-gray-500">
                Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filteredAlerts.length)} of {filteredAlerts.length} alerts
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-gray-100 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft className="w-4 h-4 text-gray-600" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                  .map((page, idx, arr) => (
                    <span key={page}>
                      {idx > 0 && arr[idx - 1] !== page - 1 && (
                        <span className="text-gray-400 px-1">…</span>
                      )}
                      <button
                        onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 rounded-lg text-sm font-body font-medium transition-all ${
                          currentPage === page
                            ? "bg-[#8B5CF6] text-white shadow"
                            : "text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        {page}
                      </button>
                    </span>
                  ))}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-gray-100 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
