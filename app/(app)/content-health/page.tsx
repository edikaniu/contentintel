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
  high_bounce: { label: "High Bounce Rate" },
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
    // Trigger rescan via the existing batch/cron mechanism
    // For now, just refetch alerts
    await fetchAlerts();
  };

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
    { key: "declining_traffic", icon: TrendingDown, color: "text-red-500", iconBg: "bg-red-100" },
    { key: "position_drop", icon: ArrowDown, color: "text-amber-500", iconBg: "bg-amber-100" },
    { key: "striking_distance", icon: Target, color: "text-green-500", iconBg: "bg-green-100" },
    { key: "stale_content", icon: Clock, color: "text-slate-500", iconBg: "bg-slate-100" },
    { key: "low_ctr", icon: MousePointer, color: "text-blue-500", iconBg: "bg-blue-100" },
  ];

  if (!selectedDomainId) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Content Health</h1>
        <p className="text-slate-500 mt-2">Select a domain to view content health alerts.</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Content Health</h1>
          <p className="mt-1 text-slate-500 font-medium flex items-center gap-2">
            <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
            {openAlerts.length} active alert{openAlerts.length !== 1 ? "s" : ""} &middot; Last
            scanned {lastScanned}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-600 border border-slate-300 hover:bg-slate-50 rounded-xl transition-all"
          >
            <Download className="w-4 h-4" />
            Export Alerts
          </button>
          <button
            onClick={handleRescan}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold bg-[#3730A3] text-white hover:bg-indigo-700 rounded-xl transition-all shadow-lg shadow-indigo-600/20"
          >
            <RefreshCw className="w-4 h-4" />
            Rescan Now
          </button>
        </div>
      </div>

      {/* Summary grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
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
                  ? "border-[#3730A3] ring-2 ring-[#3730A3]/20"
                  : "border-slate-100 hover:border-slate-200"
              }`}
            >
              <div className="flex items-center gap-2 text-slate-400">
                <Icon className="w-[18px] h-[18px]" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  {config?.label ?? st.key}
                </span>
              </div>
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-black text-slate-900">{count}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Filter bar */}
      <div className="bg-white p-2 rounded-xl shadow-sm flex flex-wrap items-center justify-between gap-4 mb-8">
        {/* Status tabs */}
        <div className="flex bg-slate-50 p-1 rounded-lg">
          {[
            { value: "all", label: "All" },
            { value: "open", label: "Open" },
            { value: "acknowledged", label: "Acknowledged" },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`px-4 py-1.5 text-sm rounded-md transition-all ${
                statusFilter === tab.value
                  ? "bg-white text-slate-900 shadow-sm font-semibold"
                  : "text-slate-500 hover:text-slate-700 font-medium"
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
              className="appearance-none bg-white border border-slate-200 rounded-lg px-3 py-1.5 pr-8 text-sm font-medium text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#3730A3]/20"
            >
              <option value="all">Priority: All</option>
              <option value="high">Priority: High</option>
              <option value="medium">Priority: Medium</option>
              <option value="low">Priority: Low</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Sort + Search */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
            <span>Sort: Newest</span>
          </div>
          <div className="h-6 w-px bg-slate-200" />
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search pages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-4 py-1.5 text-xs bg-transparent border-none focus:ring-0 w-40"
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
              className="bg-white rounded-xl border border-slate-100 p-6 animate-pulse"
            >
              <div className="h-4 bg-slate-200 rounded w-1/4 mb-3" />
              <div className="h-5 bg-slate-200 rounded w-1/2 mb-2" />
              <div className="h-3 bg-slate-100 rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : filteredAlerts.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 p-12 text-center">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Target className="w-6 h-6 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-1">No alerts found</h3>
          <p className="text-sm text-slate-500">
            {alerts.length === 0
              ? "No content health alerts have been generated yet. Run a scan to detect issues."
              : "No alerts match the current filters."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAlerts.map((row) => (
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
      )}
    </div>
  );
}
