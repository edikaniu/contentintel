"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/settings/connections", label: "Connections" },
  { href: "/settings/domains", label: "Domains" },
  { href: "/settings/team", label: "Team" },
  { href: "/settings/workflow", label: "Workflow" },
];

export function SettingsSubNav() {
  const pathname = usePathname();

  return (
    <div className="bg-white px-8 border-b border-slate-200">
      <div className="flex gap-8">
        {TABS.map((tab) => {
          const isActive = pathname === tab.href || pathname.startsWith(tab.href + "/");
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`py-4 border-b-2 text-sm font-medium transition-all ${
                isActive
                  ? "border-indigo-600 text-indigo-600 font-bold"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
