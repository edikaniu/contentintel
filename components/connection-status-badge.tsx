interface ConnectionStatusBadgeProps {
  status: "connected" | "error" | "not_configured";
}

export function ConnectionStatusBadge({ status }: ConnectionStatusBadgeProps) {
  if (status === "connected") {
    return (
      <span className="flex items-center gap-1.5 bg-[#A3E635]/10 text-[#A3E635] px-2 py-0.5 rounded-lg text-[10px] font-bold font-body uppercase">
        <span className="size-1.5 rounded-full bg-[#A3E635]"></span> Connected
      </span>
    );
  }
  if (status === "error") {
    return (
      <span className="flex items-center gap-1.5 bg-red-50 text-red-400 px-2 py-0.5 rounded-lg text-[10px] font-bold font-body uppercase">
        <span className="size-1.5 rounded-full bg-red-400"></span> Error
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1.5 bg-gray-100 text-gray-400 px-2 py-0.5 rounded-lg text-[10px] font-bold font-body uppercase">
      Not configured
    </span>
  );
}
