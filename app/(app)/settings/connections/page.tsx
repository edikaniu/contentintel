"use client";

import { useState, useEffect } from "react";
import {
  Loader2,
  Database,
  BarChart3,
  FileText,
  Brain,
  TrendingUp,
  AlertCircle,
  Info,
} from "lucide-react";
import { ConnectionStatusBadge } from "@/components/connection-status-badge";
import { CredentialForm } from "@/components/credential-form";
import { SettingsSubNav } from "@/components/settings-sub-nav";

interface CredentialInfo {
  provider: string;
  isConnected: boolean;
  lastTestedAt: string | null;
  lastTestStatus: string | null;
  lastTestError: string | null;
}

const PROVIDERS = [
  { key: "dataforseo", label: "DataforSEO", icon: Database, description: "SEO & SEM data provider for SERP analysis and keyword research.", iconBg: "bg-violet-50", iconBorder: "border-violet-100", iconColor: "text-violet-600", fields: [
    { name: "login", label: "Login Email", type: "email" },
    { name: "password", label: "Password", type: "password" },
  ]},
  { key: "windsor", label: "Windsor.ai", icon: BarChart3, description: "Multi-touch attribution and marketing data integration platform.", iconBg: "bg-orange-50", iconBorder: "border-orange-100", iconColor: "text-orange-600", fields: [
    { name: "api_key", label: "API Key", type: "password" },
  ]},
  { key: "hubspot", label: "HubSpot", icon: FileText, description: "Sync your CRM data, deals, and customer contacts for attribution analysis.", iconBg: "bg-orange-50", iconBorder: "border-orange-100", iconColor: "text-orange-500", fields: [
    { name: "access_token", label: "Private App Access Token", type: "password" },
  ]},
  { key: "anthropic", label: "Anthropic", icon: Brain, description: "Connect Claude for advanced content generation and semantic analysis.", iconBg: "bg-gray-50", iconBorder: "border-gray-100", iconColor: "text-gray-700", fields: [
    { name: "api_key", label: "API Key", type: "password" },
  ]},
  { key: "semrush", label: "SEMrush", icon: TrendingUp, description: "Import domain analytics, backlinks, and organic performance metrics.", iconBg: "bg-orange-50", iconBorder: "border-orange-100", iconColor: "text-orange-600", fields: [
    { name: "api_key", label: "API Key", type: "password" },
  ]},
];

export default function ConnectionsPage() {
  const [credentials, setCredentials] = useState<CredentialInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProvider, setEditingProvider] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ provider: string; success: boolean; error?: string } | null>(null);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);

  useEffect(() => { fetchCredentials(); }, []);

  async function fetchCredentials() {
    try {
      const res = await fetch("/api/connections");
      if (res.ok) {
        const data = await res.json();
        setCredentials(data.credentials);
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }

  async function handleSave(provider: string) {
    setSaving(true);
    try {
      const res = await fetch("/api/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, credentials: formValues }),
      });
      if (res.ok) {
        setEditingProvider(null);
        setFormValues({});
        await fetchCredentials();
        handleTest(provider);
      }
    } finally { setSaving(false); }
  }

  async function handleTest(provider: string) {
    setTesting(provider);
    setTestResult(null);
    try {
      const res = await fetch("/api/connections/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
      });
      const data = await res.json();
      setTestResult({ provider, success: data.success, error: data.error });
      await fetchCredentials();
    } catch {
      setTestResult({ provider, success: false, error: "Connection failed" });
    } finally { setTesting(null); }
  }

  async function handleDisconnect(provider: string) {
    if (!confirm(`Are you sure you want to disconnect ${provider}? This will delete the saved credentials.`)) return;
    setDisconnecting(provider);
    try {
      const res = await fetch("/api/connections", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
      });
      if (res.ok) {
        setTestResult(null);
        await fetchCredentials();
      } else {
        const data = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        setTestResult({ provider, success: false, error: data.error ?? `Failed to disconnect (${res.status})` });
      }
    } catch {
      setTestResult({ provider, success: false, error: "Network error while disconnecting" });
    }
    finally { setDisconnecting(null); }
  }

  function getCredInfo(provider: string): CredentialInfo | undefined {
    return credentials.find((c) => c.provider === provider);
  }

  function getStatus(provider: string): "connected" | "error" | "not_configured" {
    const info = getCredInfo(provider);
    if (!info) return "not_configured";
    if (info.isConnected) return "connected";
    return "error";
  }

  function formatLastSynced(dateStr: string | null): string {
    if (!dateStr) return "Never";
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days === 1 ? "" : "s"} ago`;
  }

  if (loading) return <div className="p-8 font-body text-gray-500">Loading...</div>;

  return (
    <>
      <SettingsSubNav />

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-8 bg-gray-50">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Section Header */}
          <div className="flex flex-col gap-1 mb-2">
            <h3 className="text-xl font-headline font-bold text-gray-900">External Connections</h3>
            <p className="font-body text-gray-500 text-sm">Manage API integrations and third-party data providers for your marketing stack.</p>
          </div>

          {/* Connection Cards Grid */}
          <div className="grid grid-cols-1 gap-4">
            {PROVIDERS.map((provider) => {
              const info = getCredInfo(provider.key);
              const status = getStatus(provider.key);
              const isEditing = editingProvider === provider.key;
              const Icon = provider.icon;

              return (
                <div
                  key={provider.key}
                  className={`bg-white rounded-2xl shadow-sm border p-6 hover:border-[#8B5CF6]/20 transition-all ${
                    status === "error" ? "border-red-200" : "border-gray-100"
                  } ${status === "not_configured" && !isEditing ? "opacity-75 hover:opacity-100 transition-opacity" : ""}`}
                >
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-6">
                    <div className="flex items-start gap-4 flex-1">
                      {/* Icon */}
                      <div className={`size-12 rounded-xl ${provider.iconBg} flex items-center justify-center shrink-0 border ${provider.iconBorder}`}>
                        <Icon className={`w-7 h-7 ${provider.iconColor}`} />
                      </div>

                      <div className="space-y-3 flex-1">
                        {/* Name + Status Badge */}
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-headline font-bold text-lg text-gray-900">{provider.label}</h4>
                            <ConnectionStatusBadge status={status} />
                          </div>
                          <p className="font-body text-gray-500 text-sm">{provider.description}</p>
                        </div>

                        {/* Connected: API Balance + Last Synced */}
                        {status === "connected" && !isEditing && (
                          <div className="flex items-center gap-6">
                            <div className="bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
                              <p className="text-[10px] text-gray-400 uppercase font-bold tracking-tight font-body">Last Tested</p>
                              <p className="text-sm font-bold text-gray-700 font-body">{info?.lastTestStatus === "success" ? "Passed" : "N/A"}</p>
                            </div>
                            <div className="text-sm">
                              <p className="font-body text-gray-400">Last Synced</p>
                              <p className="font-body font-medium text-gray-700">{formatLastSynced(info?.lastTestedAt ?? null)}</p>
                            </div>
                          </div>
                        )}

                        {/* Error: Show error message */}
                        {status === "error" && !isEditing && info?.lastTestError && (
                          <div className="max-w-md">
                            <p className="text-red-400 text-[11px] mt-1.5 flex items-center gap-1 font-body">
                              <AlertCircle className="w-3.5 h-3.5" />
                              {info.lastTestError}
                            </p>
                          </div>
                        )}

                        {/* Editing: Input fields */}
                        {isEditing && (
                          <CredentialForm
                            fields={provider.fields}
                            values={formValues}
                            onChange={setFormValues}
                          />
                        )}

                        {/* Test result message */}
                        {testResult?.provider === provider.key && (
                          <div className={`px-3 py-2 rounded-lg text-xs font-medium font-body ${testResult.success ? "bg-lime-50 text-lime-800" : "bg-red-50 text-red-700"}`}>
                            {testResult.success ? "Connection successful!" : testResult.error || "Connection failed"}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 shrink-0">
                      {isEditing ? (
                        <>
                          <button
                            onClick={() => { setEditingProvider(null); setFormValues({}); }}
                            className="px-4 py-2 text-sm font-body font-semibold border border-gray-100 text-gray-600 hover:bg-gray-50 rounded-xl transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSave(provider.key)}
                            disabled={saving}
                            className="px-4 py-2 text-sm font-body font-semibold text-white rounded-xl transition-colors shadow-sm bg-[#8B5CF6] hover:bg-[#7C3AED] disabled:opacity-50"
                          >
                            {saving ? "Saving..." : "Save"}
                          </button>
                        </>
                      ) : status === "connected" ? (
                        <>
                          <button
                            onClick={() => handleTest(provider.key)}
                            disabled={testing === provider.key}
                            className="px-4 py-2 text-sm font-body font-semibold border border-[#8B5CF6]/20 text-[#8B5CF6] hover:bg-[#8B5CF6]/5 rounded-xl transition-colors flex items-center gap-1"
                          >
                            {testing === provider.key && <Loader2 className="w-3 h-3 animate-spin" />}
                            Test
                          </button>
                          <button
                            onClick={() => { setEditingProvider(provider.key); setFormValues({}); }}
                            className="px-4 py-2 text-sm font-body font-semibold text-white rounded-xl transition-colors shadow-sm bg-[#8B5CF6] hover:bg-[#7C3AED]"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDisconnect(provider.key)}
                            disabled={disconnecting === provider.key}
                            className="px-4 py-2 text-sm font-body font-semibold text-red-500 hover:bg-red-50 rounded-xl transition-colors disabled:opacity-50"
                          >
                            {disconnecting === provider.key ? "Disconnecting..." : "Disconnect"}
                          </button>
                        </>
                      ) : status === "error" ? (
                        <button
                          onClick={() => { setEditingProvider(provider.key); setFormValues({}); }}
                          className="px-4 py-2 text-sm font-body font-semibold text-white rounded-xl transition-colors bg-[#8B5CF6] hover:bg-[#7C3AED]"
                        >
                          Reconnect
                        </button>
                      ) : (
                        <button
                          onClick={() => { setEditingProvider(provider.key); setFormValues({}); }}
                          className="px-6 py-2 text-sm font-body font-semibold bg-white border border-gray-100 text-gray-600 hover:bg-gray-50 rounded-xl transition-colors"
                        >
                          Configure
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer Help Section */}
          <div className="p-6 rounded-2xl border border-[#8B5CF6]/20 flex items-center justify-between bg-violet-50">
            <div className="flex items-center gap-3">
              <Info className="w-5 h-5 text-[#8B5CF6]" />
              <p className="font-body text-sm text-gray-700 font-medium">Missing a provider? We&apos;re constantly adding new integrations.</p>
            </div>
            <a className="text-sm font-body font-bold hover:underline text-[#8B5CF6] cursor-pointer" href="#">Request an Integration</a>
          </div>
        </div>
      </div>
    </>
  );
}
