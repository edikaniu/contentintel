"use client";

import { ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface PerformanceChartProps {
  alertsByType: Record<string, number>;
}

const alertTypeLabels: Record<string, string> = {
  declining_traffic: "Declining traffic",
  position_slipping: "Position slipping",
  striking_distance: "Striking distance",
  stale_content: "Stale content",
  low_ctr: "Low CTR",
  conversion_drop: "Conversion drop",
};

const alertTypeColors: Record<string, string> = {
  declining_traffic: "#DC2626",
  position_slipping: "#F59E0B",
  striking_distance: "#3730A3",
  stale_content: "#6B7280",
  low_ctr: "#D97706",
  conversion_drop: "#7C3AED",
};

const TYPES = Object.keys(alertTypeColors);

function CenterLabel({ total }: { total: number }) {
  return (
    <g>
      <text
        x="50%"
        y="46%"
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-slate-900"
        fontSize="26"
        fontWeight="700"
      >
        {total}
      </text>
      <text
        x="50%"
        y="62%"
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-slate-500"
        fontSize="9"
        fontWeight="700"
        letterSpacing="0.05em"
      >
        TOTAL ALERTS
      </text>
    </g>
  );
}

export function PerformanceChart({ alertsByType }: PerformanceChartProps) {
  const values = TYPES.map((t) => alertsByType[t] ?? 0);
  const total = values.reduce((s, v) => s + v, 0);

  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
        No alerts yet
      </div>
    );
  }

  const chartData = TYPES.map((t, i) => ({
    name: alertTypeLabels[t] ?? t,
    value: values[i],
    color: alertTypeColors[t],
  })).filter((d) => d.value > 0);

  return (
    <div className="flex flex-col items-center">
      <div className="w-48 h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius="60%"
              outerRadius="80%"
              dataKey="value"
              startAngle={90}
              endAngle={-270}
              paddingAngle={2}
              strokeWidth={0}
            >
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <CenterLabel total={total} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      {/* Legend */}
      <div className="flex flex-col gap-3 mt-8 w-full">
        {TYPES.map((t, i) => (
          <div key={t} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span
                className="inline-block w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: alertTypeColors[t] }}
              />
              <span className="text-slate-600">
                {alertTypeLabels[t] ?? t}
              </span>
            </div>
            <span className="font-bold text-slate-800">{values[i]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
