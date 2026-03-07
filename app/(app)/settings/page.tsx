"use client";

import Link from "next/link";
import { Database, GitBranch, Globe, Users } from "lucide-react";

const SETTINGS_ITEMS = [
  {
    href: "/settings/connections",
    label: "Data Source Connections",
    description: "Manage API credentials and test connections",
    icon: Database,
  },
  {
    href: "/settings/domains",
    label: "Domains & Competitors",
    description: "Configure domains, competitors, and content categories",
    icon: Globe,
  },
  {
    href: "/settings/team",
    label: "Team Management",
    description: "Invite members, manage roles, remove users",
    icon: Users,
  },
  {
    href: "/settings/workflow",
    label: "Approval Workflow",
    description: "Configure approval pipeline stages and automation",
    icon: GitBranch,
  },
];

export default function SettingsPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Settings</h1>
      <div className="grid gap-4 max-w-2xl">
        {SETTINGS_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-4 p-5 bg-white rounded-xl border border-slate-200 hover:border-[#3730A3]/30 hover:shadow-sm transition-all"
          >
            <div className="w-10 h-10 rounded-lg bg-[#3730A3]/10 flex items-center justify-center">
              <item.icon className="w-5 h-5 text-[#3730A3]" />
            </div>
            <div>
              <h3 className="font-medium text-slate-900">{item.label}</h3>
              <p className="text-sm text-slate-500">{item.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
