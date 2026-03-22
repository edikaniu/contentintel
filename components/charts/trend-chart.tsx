"use client";

import { useState, useRef, useMemo, useCallback } from "react";

interface OrganicWeek {
  week: string;
  totalClicks: number;
  totalImpressions: number;
}

interface TrendChartProps {
  data: OrganicWeek[];
  granularity?: Granularity;
  onGranularityChange?: (g: Granularity) => void;
}

// ---------------------------------------------------------------------------
// Granularity types & aggregation
// ---------------------------------------------------------------------------
type Granularity = "weekly" | "monthly";

function aggregate(data: OrganicWeek[], granularity: Granularity): OrganicWeek[] {
  if (granularity === "weekly") return data;

  // Monthly: SUM the weekly snapshots (not average — each snapshot is already a week's total)
  const buckets = new Map<string, { clicks: number; impressions: number }>();

  for (const d of data) {
    const dt = new Date(d.week);
    if (isNaN(dt.getTime())) continue;

    const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-01`;
    const bucket = buckets.get(key) ?? { clicks: 0, impressions: 0 };
    bucket.clicks += d.totalClicks;
    bucket.impressions += d.totalImpressions;
    buckets.set(key, bucket);
  }

  return Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, b]) => ({
      week: key,
      totalClicks: b.clicks,
      totalImpressions: b.impressions,
    }));
}

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------
function formatXLabel(dateStr: string, granularity: Granularity): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  if (granularity === "monthly") {
    return d.toLocaleDateString("en-US", { month: "short" });
  }
  return "Wk " + d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function niceAxis(max: number): { ticks: number[]; ceil: number } {
  if (max <= 0) return { ticks: [0], ceil: 10 };
  const magnitude = Math.pow(10, Math.floor(Math.log10(max)));
  let step = magnitude;
  if (max / step < 3) step = magnitude / 2;
  if (max / step > 8) step = magnitude * 2;
  const ceil = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let v = 0; v <= ceil; v += step) ticks.push(v);
  return { ticks, ceil };
}

function formatValue(v: number): string {
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (v >= 1_000) return (v / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return v.toString();
}

// ---------------------------------------------------------------------------
// Smooth cubic bezier path from Catmull-Rom spline
// ---------------------------------------------------------------------------
function smoothPath(points: [number, number][]): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M${points[0][0]},${points[0][1]}`;
  if (points.length === 2) {
    return `M${points[0][0]},${points[0][1]}L${points[1][0]},${points[1][1]}`;
  }

  let d = `M${points[0][0]},${points[0][1]}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];

    const tension = 0.3;
    const cp1x = p1[0] + (p2[0] - p0[0]) * tension;
    const cp1y = p1[1] + (p2[1] - p0[1]) * tension;
    const cp2x = p2[0] - (p3[0] - p1[0]) * tension;
    const cp2y = p2[1] - (p3[1] - p1[1]) * tension;

    d += `C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2[0]},${p2[1]}`;
  }
  return d;
}

// ---------------------------------------------------------------------------
// Chart constants
// ---------------------------------------------------------------------------
const CHART_H = 280;
const PAD = { top: 20, right: 20, bottom: 40, left: 56 };
const SVG_W = 800;

export function TrendChart({ data, granularity: externalGranularity, onGranularityChange }: TrendChartProps) {
  const [internalGranularity, setInternalGranularity] = useState<Granularity>("weekly");
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Use external granularity if provided, otherwise internal
  const granularity = externalGranularity ?? internalGranularity;
  const setGranularity = onGranularityChange ?? setInternalGranularity;
  const isControlled = externalGranularity !== undefined;

  const aggregated = useMemo(() => aggregate(data, granularity), [data, granularity]);

  const plotW = SVG_W - PAD.left - PAD.right;
  const plotH = CHART_H - PAD.top - PAD.bottom;

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const svg = svgRef.current;
      if (!svg || aggregated.length === 0) return;
      const rect = svg.getBoundingClientRect();
      const mouseX = ((e.clientX - rect.left) / rect.width) * SVG_W - PAD.left;
      if (mouseX < 0 || mouseX > plotW) {
        setHoverIdx(null);
        return;
      }
      const step = aggregated.length > 1 ? plotW / (aggregated.length - 1) : plotW;
      const idx = Math.round(mouseX / step);
      setHoverIdx(Math.max(0, Math.min(aggregated.length - 1, idx)));
    },
    [aggregated, plotW]
  );

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400 text-sm font-body">
        No organic data yet
      </div>
    );
  }

  const maxClicks = Math.max(...aggregated.map((d) => d.totalClicks), 1);
  const maxImpressions = Math.max(...aggregated.map((d) => d.totalImpressions), 1);
  const clicksAxis = niceAxis(maxClicks);
  const impressionsAxis = niceAxis(maxImpressions);

  // Pre-compute point positions
  const clicksPoints: [number, number][] = aggregated.map((d, i) => [
    PAD.left + (aggregated.length > 1 ? (i / (aggregated.length - 1)) * plotW : plotW / 2),
    PAD.top + plotH * (1 - d.totalClicks / clicksAxis.ceil),
  ]);
  const impressionsPoints: [number, number][] = aggregated.map((d, i) => [
    PAD.left + (aggregated.length > 1 ? (i / (aggregated.length - 1)) * plotW : plotW / 2),
    PAD.top + plotH * (1 - d.totalImpressions / impressionsAxis.ceil),
  ]);

  // X-axis label step to avoid crowding
  const maxLabels = 10;
  const labelStep = Math.max(1, Math.ceil(aggregated.length / maxLabels));

  // Area fill path
  const baseY = PAD.top + plotH;
  const curvePath = smoothPath(clicksPoints);
  const areaPath =
    clicksPoints.length > 0
      ? `${curvePath}L${clicksPoints[clicksPoints.length - 1][0]},${baseY}L${clicksPoints[0][0]},${baseY}Z`
      : "";

  return (
    <div className="w-full">
      {/* Internal granularity toggle — only shown when NOT controlled externally */}
      {!isControlled && (
        <div className="flex items-center gap-1 mb-4">
          <div className="inline-flex rounded-xl bg-gray-50 border border-gray-100 p-1">
            {(["weekly", "monthly"] as Granularity[]).map((g) => (
              <button
                key={g}
                onClick={() => setGranularity(g)}
                className={`px-3.5 py-1.5 text-xs font-medium font-body rounded-lg transition-all ${
                  granularity === g
                    ? "bg-[#8B5CF6] text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                {g.charAt(0).toUpperCase() + g.slice(1)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* SVG Chart */}
      <svg
        ref={svgRef}
        viewBox={`0 0 ${SVG_W} ${CHART_H}`}
        preserveAspectRatio="xMidYMid meet"
        className="w-full h-auto"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverIdx(null)}
      >
        <defs>
          <linearGradient id="trendClicksGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.15} />
            <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="trendImpGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#A3E635" stopOpacity={0.08} />
            <stop offset="100%" stopColor="#A3E635" stopOpacity={0} />
          </linearGradient>
        </defs>

        {/* Horizontal grid lines (dashed, subtle) */}
        {clicksAxis.ticks.map((tick) => {
          const y = PAD.top + plotH * (1 - tick / clicksAxis.ceil);
          return (
            <line
              key={tick}
              x1={PAD.left}
              x2={SVG_W - PAD.right}
              y1={y}
              y2={y}
              stroke="#E5E7EB"
              strokeWidth="1"
              strokeDasharray={tick === 0 ? "0" : "4 4"}
            />
          );
        })}

        {/* Y-axis labels */}
        {clicksAxis.ticks.map((tick) => {
          const y = PAD.top + plotH * (1 - tick / clicksAxis.ceil);
          return (
            <text
              key={tick}
              x={PAD.left - 10}
              y={y + 4}
              textAnchor="end"
              fill="#9CA3AF"
              fontSize="11"
              fontFamily="var(--font-body), system-ui, sans-serif"
            >
              {formatValue(tick)}
            </text>
          );
        })}

        {/* Impressions gradient fill */}
        {impressionsPoints.length > 0 && (
          <path
            d={`${smoothPath(impressionsPoints)}L${impressionsPoints[impressionsPoints.length - 1][0]},${baseY}L${impressionsPoints[0][0]},${baseY}Z`}
            fill="url(#trendImpGrad)"
          />
        )}

        {/* Impressions line (dashed, lime green) */}
        <path
          d={smoothPath(impressionsPoints)}
          fill="none"
          stroke="#A3E635"
          strokeWidth="2"
          strokeDasharray="6 4"
          strokeOpacity="0.6"
        />

        {/* Clicks gradient fill */}
        {areaPath && <path d={areaPath} fill="url(#trendClicksGrad)" />}

        {/* Clicks line */}
        <path
          d={curvePath}
          fill="none"
          stroke="#8B5CF6"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Always-visible data dots for clicks */}
        {clicksPoints.map((pt, i) => (
          <circle
            key={`c-${i}`}
            cx={pt[0]}
            cy={pt[1]}
            r={hoverIdx === i ? 0 : 3}
            fill="#8B5CF6"
            fillOpacity={0.8}
          />
        ))}

        {/* Always-visible data dots for impressions */}
        {impressionsPoints.map((pt, i) => (
          <circle
            key={`i-${i}`}
            cx={pt[0]}
            cy={pt[1]}
            r={hoverIdx === i ? 0 : 2.5}
            fill="#A3E635"
            fillOpacity={0.6}
          />
        ))}

        {/* X-axis labels */}
        {aggregated.map((d, i) => {
          if (i % labelStep !== 0 && i !== aggregated.length - 1) return null;
          const x = clicksPoints[i][0];
          return (
            <text
              key={i}
              x={x}
              y={CHART_H - 8}
              textAnchor="middle"
              fill="#9CA3AF"
              fontSize="10"
              fontFamily="var(--font-body), system-ui, sans-serif"
            >
              {formatXLabel(d.week, granularity)}
            </text>
          );
        })}

        {/* Hover interaction: vertical guide, dots, tooltip */}
        {hoverIdx !== null && (() => {
          const d = aggregated[hoverIdx];
          const x = clicksPoints[hoverIdx][0];
          const yClicks = clicksPoints[hoverIdx][1];
          const yImpressions = impressionsPoints[hoverIdx][1];

          const tooltipW = 180;
          const tooltipH = 68;
          let tx = x + 14;
          if (tx + tooltipW > SVG_W - PAD.right) tx = x - tooltipW - 14;
          let ty = Math.min(yClicks, yImpressions) - 14;
          if (ty < PAD.top) ty = PAD.top;

          return (
            <g>
              {/* Vertical guide */}
              <line
                x1={x} x2={x}
                y1={PAD.top} y2={PAD.top + plotH}
                stroke="#8B5CF6" strokeWidth="1" strokeOpacity="0.25" strokeDasharray="4 3"
              />
              {/* Clicks dot */}
              <circle cx={x} cy={yClicks} r="6" fill="#fff" stroke="#8B5CF6" strokeWidth="2.5" />
              {/* Impressions dot */}
              <circle cx={x} cy={yImpressions} r="5" fill="#fff" stroke="#A3E635" strokeWidth="2" />

              {/* Tooltip */}
              <rect
                x={tx} y={ty}
                width={tooltipW} height={tooltipH}
                rx="12" fill="#111" fillOpacity="0.95"
              />
              <text x={tx + 14} y={ty + 20} fill="#fff" fontSize="11" fontWeight="600" fontFamily="var(--font-body), system-ui, sans-serif">
                {formatDate(d.week)}
              </text>
              <circle cx={tx + 18} cy={ty + 36} r="4" fill="#8B5CF6" />
              <text x={tx + 28} y={ty + 40} fill="#D1D5DB" fontSize="11" fontFamily="var(--font-body), system-ui, sans-serif">
                Clicks: <tspan fill="#fff" fontWeight="600">{d.totalClicks.toLocaleString()}</tspan>
              </text>
              <circle cx={tx + 18} cy={ty + 54} r="4" fill="#A3E635" />
              <text x={tx + 28} y={ty + 58} fill="#D1D5DB" fontSize="11" fontFamily="var(--font-body), system-ui, sans-serif">
                Impressions: <tspan fill="#fff" fontWeight="600">{d.totalImpressions.toLocaleString()}</tspan>
              </text>
            </g>
          );
        })()}
      </svg>
    </div>
  );
}
