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
      <div className="px-4 py-2 text-xs text-gray-600 font-body">No domains configured</div>
    );
  }

  return (
    <div ref={ref} className="relative px-4">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-2 px-3 py-3 rounded-lg bg-white/5 border border-[#222] text-sm text-gray-300 hover:bg-white/10 transition-colors focus:border-[#8B5CF6] focus:outline-none"
      >
        <div className="flex flex-col items-start">
          <span className="text-[10px] text-gray-600 uppercase font-bold tracking-wider font-body">Project</span>
          <span className="text-white text-sm font-medium font-body">{selected?.displayName ?? "Select domain"}</span>
        </div>
        <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute left-4 right-4 mt-1 bg-[#111] border border-[#222] rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
          {domains.map((d) => (
            <button
              key={d.id}
              onClick={() => {
                setSelectedDomainId(d.id);
                setOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-sm font-body transition-colors ${
                d.id === selectedDomainId
                  ? "text-[#8B5CF6] bg-[#8B5CF6]/10"
                  : "text-gray-300 hover:bg-white/5"
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
