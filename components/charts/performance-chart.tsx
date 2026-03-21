"use client";

import { useState } from "react";

interface PerformanceChartProps {
  alertsByType: Record<string, number>;
}

const alertTypeLabels: Record<string, string> = {
  declining_traffic: "Declining traffic",
  position_drop: "Position slipping",
  striking_distance: "Striking distance",
  stale_content: "Stale content",
  low_ctr: "Low CTR",
  conversion_drop: "Conversion drop",
};

const alertTypeColors: Record<string, string> = {
  declining_traffic: "#DC2626",
  position_drop: "#F59E0B",
  striking_distance: "#8B5CF6",
  stale_content: "#6B7280",
  low_ctr: "#D97706",
  conversion_drop: "#A3E635",
};

const TYPES = Object.keys(alertTypeColors);

export function PerformanceChart({ alertsByType }: PerformanceChartProps) {
  const [hoverType, setHoverType] = useState<string | null>(null);
  const values = TYPES.map((t) => alertsByType[t] ?? 0);
  const total = values.reduce((s, v) => s + v, 0);

  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400 text-sm font-body">
        No alerts yet
      </div>
    );
  }

  // Build donut arc segments
  const cx = 100;
  const cy = 100;
  const outerR = 80;
  const innerR = 55;
  const gap = 0.02; // radians between segments

  const segments: {
    type: string;
    label: string;
    value: number;
    color: string;
    path: string;
  }[] = [];

  let currentAngle = -Math.PI / 2; // start at 12 o'clock

  for (let i = 0; i < TYPES.length; i++) {
    const v = values[i];
    if (v === 0) continue;
    const sweep = (v / total) * Math.PI * 2;
    const start = currentAngle + gap / 2;
    const end = currentAngle + sweep - gap / 2;

    const x1o = cx + outerR * Math.cos(start);
    const y1o = cy + outerR * Math.sin(start);
    const x2o = cx + outerR * Math.cos(end);
    const y2o = cy + outerR * Math.sin(end);
    const x1i = cx + innerR * Math.cos(end);
    const y1i = cy + innerR * Math.sin(end);
    const x2i = cx + innerR * Math.cos(start);
    const y2i = cy + innerR * Math.sin(start);

    const largeArc = sweep - gap > Math.PI ? 1 : 0;

    const path = [
      `M${x1o},${y1o}`,
      `A${outerR},${outerR} 0 ${largeArc} 1 ${x2o},${y2o}`,
      `L${x1i},${y1i}`,
      `A${innerR},${innerR} 0 ${largeArc} 0 ${x2i},${y2i}`,
      "Z",
    ].join(" ");

    segments.push({
      type: TYPES[i],
      label: alertTypeLabels[TYPES[i]] ?? TYPES[i],
      value: v,
      color: alertTypeColors[TYPES[i]],
      path,
    });

    currentAngle += sweep;
  }

  const hoverSegment = segments.find((s) => s.type === hoverType);

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-48 h-48">
        <svg viewBox="0 0 200 200" className="w-full h-full">
          {/* Subtle outer ring */}
          <circle cx={cx} cy={cy} r={outerR + 2} fill="none" stroke="#F3F4F6" strokeWidth="1" />

          {segments.map((seg) => {
            const isHovered = hoverType === seg.type;
            return (
              <path
                key={seg.type}
                d={seg.path}
                fill={seg.color}
                fillOpacity={hoverType === null || isHovered ? 1 : 0.35}
                stroke="white"
                strokeWidth="1.5"
                className="transition-all duration-200 cursor-pointer"
                style={{
                  transform: isHovered ? "scale(1.05)" : "scale(1)",
                  transformOrigin: `${cx}px ${cy}px`,
                }}
                onMouseEnter={() => setHoverType(seg.type)}
                onMouseLeave={() => setHoverType(null)}
              />
            );
          })}

          {/* Center text */}
          <text
            x={cx}
            y={hoverSegment ? cy - 4 : cy + 2}
            textAnchor="middle"
            dominantBaseline="central"
            className="fill-gray-900"
            fontSize="28"
            fontWeight="700"
            fontFamily="var(--font-headline), system-ui, sans-serif"
          >
            {hoverSegment ? hoverSegment.value : total}
          </text>
          <text
            x={cx}
            y={hoverSegment ? cy + 16 : cy + 22}
            textAnchor="middle"
            dominantBaseline="central"
            className="fill-gray-500"
            fontSize="8"
            fontWeight="600"
            letterSpacing="0.06em"
            fontFamily="var(--font-body), system-ui, sans-serif"
          >
            {hoverSegment ? hoverSegment.label.toUpperCase() : "TOTAL ALERTS"}
          </text>
        </svg>
      </div>

      {/* Legend */}
      <div className="flex flex-col gap-2.5 mt-8 w-full">
        {TYPES.map((t, i) => {
          const isHovered = hoverType === t;
          return (
            <div
              key={t}
              className={`flex items-center justify-between text-xs font-body px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                isHovered ? "bg-gray-50" : ""
              }`}
              onMouseEnter={() => setHoverType(t)}
              onMouseLeave={() => setHoverType(null)}
            >
              <div className="flex items-center gap-2">
                <span
                  className="inline-block w-2.5 h-2.5 rounded-full transition-transform"
                  style={{
                    backgroundColor: alertTypeColors[t],
                    transform: isHovered ? "scale(1.3)" : "scale(1)",
                  }}
                />
                <span className="text-gray-600">
                  {alertTypeLabels[t] ?? t}
                </span>
              </div>
              <span className="font-bold text-gray-900">{values[i]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
