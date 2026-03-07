"use client";

interface ScoreBadgeProps {
  score: number | null;
  showMax?: boolean; // whether to show "/100"
}

export function ScoreBadge({ score, showMax = false }: ScoreBadgeProps) {
  const classes = score === null
    ? "bg-slate-100 text-slate-600"
    : score >= 70
    ? "bg-emerald-100 text-emerald-700"
    : score >= 50
    ? "bg-amber-100 text-amber-700"
    : "bg-slate-100 text-slate-600";

  return (
    <span className={`inline-flex px-2 py-1 rounded text-xs font-bold w-fit ${classes}`}>
      {score !== null ? Math.round(score) : "--"}
      {showMax && "/100"}
    </span>
  );
}
