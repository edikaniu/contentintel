"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";
import { useDomain } from "@/components/domain-context";

export function DomainSelector() {
  const { domains, selectedDomainId, setSelectedDomainId } = useDomain();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const selected = domains.find((d) => d.id === selectedDomainId);

  if (domains.length === 0) {
    return (
      <div className="px-4 py-2 text-xs text-slate-500">No domains configured</div>
    );
  }

  return (
    <div ref={ref} className="relative px-4">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-2 px-3 py-3 rounded-xl bg-slate-800/50 border border-slate-700 text-sm text-slate-200 hover:bg-slate-700 transition-colors"
      >
        <div className="flex flex-col items-start">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Project</span>
          <span className="text-white text-sm font-medium">{selected?.displayName ?? "Select domain"}</span>
        </div>
        <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute left-4 right-4 mt-1 bg-[#1E293B] border border-slate-600 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
          {domains.map((d) => (
            <button
              key={d.id}
              onClick={() => {
                setSelectedDomainId(d.id);
                setOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                d.id === selectedDomainId
                  ? "bg-[#3730A3] text-white"
                  : "text-slate-300 hover:bg-slate-700"
              }`}
            >
              {d.displayName}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
