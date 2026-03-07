"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  CartesianGrid,
  Tooltip,
  Line,
  ComposedChart,
} from "recharts";

interface OrganicWeek {
  week: string;
  totalClicks: number;
  totalImpressions: number;
}

interface TrendChartProps {
  data: OrganicWeek[];
}

function formatLabel(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; dataKey: string; color: string }>;
  label?: string;
}) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-[#1E293B] text-white text-xs rounded-lg px-3 py-2 shadow-lg">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} className="flex items-center gap-2">
          <span
            className="inline-block w-2 h-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          {entry.dataKey === "totalClicks" ? "Clicks" : "Impressions"}:{" "}
          {entry.value.toLocaleString()}
        </p>
      ))}
    </div>
  );
}

export function TrendChart({ data }: TrendChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
        No organic data yet
      </div>
    );
  }

  const chartData = data.map((d) => ({
    ...d,
    label: formatLabel(d.week),
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
        <defs>
          <linearGradient id="clicksGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4F46E5" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#4F46E5" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          vertical={false}
          stroke="#E2E8F0"
          strokeOpacity={0.5}
        />
        <XAxis
          dataKey="label"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 11, fill: "#94A3B8" }}
          dy={8}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="totalClicks"
          stroke="#4F46E5"
          strokeWidth={2.5}
          fill="url(#clicksGradient)"
          dot={{ r: 4, fill: "#FFFFFF", stroke: "#4F46E5", strokeWidth: 2 }}
          activeDot={{ r: 5, fill: "#4F46E5", stroke: "#FFFFFF", strokeWidth: 2 }}
        />
        <Line
          type="monotone"
          dataKey="totalImpressions"
          stroke="#CBD5E1"
          strokeWidth={1.5}
          strokeDasharray="6 4"
          dot={false}
          activeDot={{ r: 4, fill: "#CBD5E1", stroke: "#FFFFFF", strokeWidth: 2 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
