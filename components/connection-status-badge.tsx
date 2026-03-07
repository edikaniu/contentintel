interface ConnectionStatusBadgeProps {
  status: "connected" | "error" | "not_configured";
}

export function ConnectionStatusBadge({ status }: ConnectionStatusBadgeProps) {
  if (status === "connected") {
    return (
      <span className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
        <span className="size-1.5 rounded-full bg-emerald-500"></span> Connected
      </span>
    );
  }
  if (status === "error") {
    return (
      <span className="flex items-center gap-1.5 bg-rose-50 text-rose-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
        <span className="size-1.5 rounded-full bg-rose-500"></span> Error
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1.5 bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
      Not configured
    </span>
  );
}
