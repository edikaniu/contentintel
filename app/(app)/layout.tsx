"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Lightbulb,
  Activity,
  CheckSquare,
  Settings,
  LogOut,
  Bell,
  Menu,
  X,
} from "lucide-react";
import { DomainProvider } from "@/components/domain-context";
import { DomainSelector } from "@/components/domain-selector";

const MAIN_NAV = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/topics", label: "Recommendations", icon: Lightbulb },
  { href: "/content-health", label: "Content Health", icon: Activity },
  { href: "/validate", label: "Validate Topic", icon: CheckSquare },
];

const MANAGE_NAV = [
  { href: "/settings", label: "Settings", icon: Settings },
];

const PAGE_NAMES: Record<string, string> = {
  "/dashboard": "Overview",
  "/topics": "Recommendations",
  "/content-health": "Content Health",
  "/validate": "Validate Topic",
  "/settings": "Settings",
};

const SETTINGS_SUB: Record<string, string> = {
  "/settings/connections": "Connections",
  "/settings/domains": "Domains",
  "/settings/team": "Team",
  "/settings/workflow": "Workflow",
};

function getPageName(pathname: string): string {
  for (const [path, name] of Object.entries(PAGE_NAMES)) {
    if (pathname === path || pathname.startsWith(path + "/")) return name;
  }
  return "Dashboard";
}

function getSettingsSubPage(pathname: string): string | null {
  for (const [path, name] of Object.entries(SETTINGS_SUB)) {
    if (pathname === path || pathname.startsWith(path + "/")) return name;
  }
  return null;
}

function NavItem({
  href,
  label,
  icon: Icon,
  active,
  onClick,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
        active
          ? "bg-[#3730A3] text-white"
          : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
      }`}
    >
      <Icon className="w-5 h-5" />
      {label}
    </Link>
  );
}

function SidebarContent({
  pathname,
  session,
  onNavClick,
}: {
  pathname: string;
  session: { user: { name?: string | null; role?: string } };
  onNavClick?: () => void;
}) {
  return (
    <>
      {/* Logo */}
      <div className="p-4">
        <Link href="/dashboard" className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-lg bg-[#3730A3] flex items-center justify-center">
            <LayoutDashboard className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-semibold text-lg">ContentIntel</span>
        </Link>
      </div>

      {/* Domain selector */}
      <div className="mb-4">
        <DomainSelector />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-6 overflow-y-auto">
        {/* MAIN section */}
        <div>
          <p className="px-3 mb-2 text-[10px] text-slate-500 uppercase tracking-widest font-semibold">
            Main
          </p>
          <div className="space-y-1">
            {MAIN_NAV.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <NavItem
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  icon={item.icon}
                  active={isActive}
                  onClick={onNavClick}
                />
              );
            })}
          </div>
        </div>

        {/* MANAGE section */}
        <div>
          <p className="px-3 mb-2 text-[10px] text-slate-500 uppercase tracking-widest font-semibold">
            Manage
          </p>
          <div className="space-y-1">
            {MANAGE_NAV.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <NavItem
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  icon={item.icon}
                  active={isActive}
                  onClick={onNavClick}
                />
              );
            })}
          </div>
        </div>
      </nav>

      {/* User area */}
      <div className="p-4 border-t border-slate-700">
        <div className="flex items-center gap-3 px-2 py-3 bg-slate-800/30 rounded-xl">
          <div className="w-9 h-9 rounded-full bg-slate-500 flex items-center justify-center text-white text-xs font-semibold shrink-0 ring-2 ring-slate-700">
            {session.user.name?.charAt(0).toUpperCase() ?? "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-semibold truncate">
              {session.user.name}
            </p>
            <p className="text-slate-400 text-[10px] uppercase tracking-wider truncate">
              {session.user.role}
            </p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="ml-auto text-slate-400 hover:text-white transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </>
  );
}

function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-500">Loading...</div>
      </div>
    );
  }

  if (!session) return null;

  const pageName = getPageName(pathname);
  const settingsSubPage = getSettingsSubPage(pathname);

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 bg-[#1E293B] flex-col shrink-0 border-r border-slate-700">
        <SidebarContent
          pathname={pathname}
          session={session}
        />
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative w-64 h-full bg-[#1E293B] flex flex-col z-50">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <SidebarContent
              pathname={pathname}
              session={session}
              onNavClick={() => setMobileOpen(false)}
            />
          </aside>
        </div>
      )}

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 shrink-0">
          {/* Left: hamburger + breadcrumb */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden text-slate-500 hover:text-slate-700"
            >
              <Menu className="w-6 h-6" />
            </button>
            {settingsSubPage ? (
              <div className="flex items-center gap-2 text-sm font-medium">
                <span className="font-bold text-slate-800">Settings</span>
                <span className="text-slate-300">/</span>
                <span className="text-indigo-600 font-medium">{settingsSubPage}</span>
              </div>
            ) : (
              <h1 className="text-lg font-semibold text-slate-900">{pageName}</h1>
            )}
          </div>

          {/* Right: date pill, bell, avatar */}
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline-flex items-center px-3 py-1.5 rounded-full bg-slate-100 text-xs font-medium text-slate-600">
              Last 4 weeks
            </span>
            <button className="relative text-slate-400 hover:text-slate-600">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <div className="w-8 h-8 rounded-full bg-[#3730A3] flex items-center justify-center text-white text-xs font-medium">
              {session.user.name?.charAt(0).toUpperCase() ?? "U"}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <DomainProvider>
      <AppShell>{children}</AppShell>
    </DomainProvider>
  );
}
