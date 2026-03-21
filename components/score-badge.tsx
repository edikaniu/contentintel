"use client";

interface ScoreBadgeProps {
  score: number | null;
  showMax?: boolean; // whether to show "/100"
}

export function ScoreBadge({ score, showMax = false }: ScoreBadgeProps) {
  const classes = score === null
    ? "bg-gray-100 text-gray-600"
    : score >= 70
    ? "bg-[#A3E635]/10 text-[#A3E635]"
    : score >= 50
    ? "bg-amber-100 text-amber-700"
    : "bg-red-100 text-red-600";

  return (
    <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-bold font-body w-fit ${classes}`}>
      {score !== null ? Math.round(score) : "--"}
      {showMax && "/100"}
    </span>
  );
}
