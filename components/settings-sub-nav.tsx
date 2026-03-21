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
    <div className="bg-white px-8 border-b border-gray-100">
      <div className="flex gap-8">
        {TABS.map((tab) => {
          const isActive = pathname === tab.href || pathname.startsWith(tab.href + "/");
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`py-4 border-b-2 text-sm font-medium font-body transition-all ${
                isActive
                  ? "border-[#8B5CF6] text-[#8B5CF6] font-bold"
                  : "border-transparent text-gray-500 hover:text-gray-900"
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
