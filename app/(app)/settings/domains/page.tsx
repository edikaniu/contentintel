"use client";

import { useState, useEffect } from "react";
import { Globe, Plus, X, ChevronDown, MoreVertical, CheckCircle, HelpCircle, ArrowRight, RefreshCw, Loader2, FileText } from "lucide-react";
import { SettingsSubNav } from "@/components/settings-sub-nav";

interface Competitor {
  id: string;
  competitorDomain: string;
}

interface Domain {
  id: string;
  domain: string;
  displayName: string;
  vertical: string | null;
  gscProperty: string | null;
  ga4AccountId: string | null;
  hubspotBlogId: string | null;
  dataforseoLocation: number;
  dataforseoLanguage: number;
  contentCategoriesJson: string[] | null;
  competitors: Competitor[];
}

interface HubSpotBlog {
  id: string;
  name: string;
  slug: string;
  absoluteUrl: string;
}

export default function DomainsPage() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  // Add domain form
  const [domainUrl, setDomainUrl] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [vertical, setVertical] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Competitor add
  const [addingComp, setAddingComp] = useState<string | null>(null);
  const [compInput, setCompInput] = useState("");

  // HubSpot blog selector
  const [hubspotBlogs, setHubspotBlogs] = useState<HubSpotBlog[]>([]);
  const [loadingBlogs, setLoadingBlogs] = useState(false);
  const [selectingBlog, setSelectingBlog] = useState<string | null>(null);
  const [blogError, setBlogError] = useState("");

  // Sync
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => { fetchDomains(); }, []);

  async function fetchDomains() {
    try {
      const res = await fetch("/api/domains");
      if (res.ok) {
        const data = await res.json();
        setDomains(data.domains);
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }

  async function handleAddDomain() {
    if (!domainUrl || !displayName) { setError("Domain and display name are required"); return; }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/domains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: domainUrl, displayName, vertical }),
      });
      if (res.ok) {
        setShowAdd(false);
        setDomainUrl("");
        setDisplayName("");
        setVertical("");
        await fetchDomains();
      } else {
        const d = await res.json();
        setError(d.error || "Failed to add domain");
      }
    } finally { setSaving(false); }
  }

  async function handleAddCompetitor(domainId: string) {
    if (!compInput.trim()) return;
    try {
      const res = await fetch(`/api/domains/${domainId}/competitors`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ competitorDomain: compInput.trim() }),
      });
      if (res.ok) {
        setCompInput("");
        setAddingComp(null);
        await fetchDomains();
      }
    } catch { /* ignore */ }
  }

  async function handleRemoveCompetitor(domainId: string, competitorId: string) {
    try {
      await fetch(`/api/domains/${domainId}/competitors`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ competitorId }),
      });
      await fetchDomains();
    } catch { /* ignore */ }
  }

  async function fetchHubSpotBlogs(domainId: string) {
    setSelectingBlog(domainId);
    setBlogError("");
    if (hubspotBlogs.length > 0) return; // already loaded
    setLoadingBlogs(true);
    try {
      const res = await fetch("/api/hubspot/blogs");
      if (res.ok) {
        const data = await res.json();
        setHubspotBlogs(data.blogs);
      } else {
        const data = await res.json();
        setBlogError(data.error || "Failed to fetch blogs");
      }
    } catch {
      setBlogError("Failed to fetch HubSpot blogs");
    } finally { setLoadingBlogs(false); }
  }

  async function handleSelectBlog(domainId: string, blogId: string) {
    try {
      const res = await fetch(`/api/domains/${domainId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hubspotBlogId: blogId }),
      });
      if (res.ok) {
        setSelectingBlog(null);
        await fetchDomains();
      }
    } catch { /* ignore */ }
  }

  async function handleSync() {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch("/api/batch/run", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setSyncResult({ success: true, message: `Sync complete. ${data.summary?.contentSynced ?? 0} content items synced.` });
      } else {
        setSyncResult({ success: false, message: data.error || "Sync failed" });
      }
    } catch {
      setSyncResult({ success: false, message: "Sync request failed" });
    } finally { setSyncing(false); }
  }

  if (loading) return <div className="p-8 text-slate-500">Loading...</div>;

  return (
    <div className="flex flex-col h-full">
      <SettingsSubNav />

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Section Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex flex-col gap-1">
              <h2 className="text-xl font-bold text-slate-900">Domains</h2>
              <p className="text-slate-500 text-sm">Manage your tracked domains and their associated data sources.</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleSync}
                disabled={syncing}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-lg flex items-center gap-2 hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                {syncing ? <Loader2 className="w-[18px] h-[18px] animate-spin" /> : <RefreshCw className="w-[18px] h-[18px]" />}
                {syncing ? "Syncing..." : "Sync Now"}
              </button>
              <button
                onClick={() => setShowAdd(!showAdd)}
                className="px-4 py-2 bg-[#3730A3] text-white text-sm font-bold rounded-lg flex items-center gap-2 hover:bg-indigo-800 transition-colors shadow-sm"
              >
                <Plus className="w-[18px] h-[18px]" />
                Add Domain
              </button>
            </div>
          </div>

          {/* Sync Result Banner */}
          {syncResult && (
            <div className={`px-4 py-3 rounded-lg text-sm font-medium ${syncResult.success ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
              {syncResult.message}
            </div>
          )}

          {/* Add Domain Form */}
          {showAdd && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-base font-semibold text-slate-900 mb-4">Add New Domain</h3>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Domain URL</label>
                  <input type="text" value={domainUrl} onChange={(e) => setDomainUrl(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3730A3]" placeholder="example.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Display Name</label>
                  <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3730A3]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Vertical</label>
                  <input type="text" value={vertical} onChange={(e) => setVertical(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3730A3]" placeholder="finance" />
                </div>
              </div>
              {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
              <div className="flex gap-2">
                <button onClick={handleAddDomain} disabled={saving} className="px-4 py-2 bg-[#3730A3] text-white rounded-lg text-sm font-bold hover:bg-indigo-800 disabled:opacity-50">
                  {saving ? "Adding..." : "Add Domain"}
                </button>
                <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-slate-600 text-sm hover:text-slate-900">Cancel</button>
              </div>
            </div>
          )}

          {/* Domain Cards */}
          <div className="space-y-4">
            {domains.map((d) => (
              <div key={d.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {/* Card Header */}
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="size-12 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0 border border-indigo-100">
                      <Globe className="w-7 h-7 text-indigo-600" />
                    </div>
                    <div>
                      <h4 className="text-base font-semibold text-slate-900">{d.displayName}</h4>
                      <p className="text-sm text-slate-500">{d.domain}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    {d.vertical && (
                      <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 cursor-pointer">
                        <span className="text-sm font-medium text-slate-700">{d.vertical}</span>
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-slate-400 uppercase">Active</span>
                      <div className="w-10 h-5 bg-indigo-600 rounded-full relative cursor-pointer">
                        <div className="absolute right-0.5 top-0.5 size-4 bg-white rounded-full"></div>
                      </div>
                    </div>
                    <button className="text-slate-400 hover:text-slate-600">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-6 space-y-8">
                  {/* Mapped Sources */}
                  <div className="space-y-4">
                    <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Mapped Sources</h5>
                    <div className="space-y-3">
                      {d.ga4AccountId && (
                        <div className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <CheckCircle className="w-[18px] h-[18px] text-emerald-500" />
                            <span className="text-sm text-slate-700">GA4 Property: <span className="font-medium">{d.ga4AccountId}</span></span>
                          </div>
                          <button className="text-xs font-bold text-indigo-600 hover:underline">Change</button>
                        </div>
                      )}
                      {d.gscProperty && (
                        <div className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <CheckCircle className="w-[18px] h-[18px] text-emerald-500" />
                            <span className="text-sm text-slate-700">Google Search Console: <span className="font-medium">{d.gscProperty}</span></span>
                          </div>
                          <button className="text-xs font-bold text-indigo-600 hover:underline">Change</button>
                        </div>
                      )}

                      {/* HubSpot Blog — with selector */}
                      {d.hubspotBlogId && selectingBlog !== d.id && (
                        <div className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <CheckCircle className="w-[18px] h-[18px] text-emerald-500" />
                            <span className="text-sm text-slate-700">HubSpot Blog: <span className="font-medium">
                              {hubspotBlogs.find(b => b.id === d.hubspotBlogId)?.name || d.hubspotBlogId}
                            </span></span>
                          </div>
                          <button onClick={() => fetchHubSpotBlogs(d.id)} className="text-xs font-bold text-indigo-600 hover:underline">Change</button>
                        </div>
                      )}
                      {!d.hubspotBlogId && selectingBlog !== d.id && (
                        <button
                          onClick={() => fetchHubSpotBlogs(d.id)}
                          className="flex items-center gap-3 py-2 px-3 rounded-lg border border-dashed border-slate-300 hover:border-indigo-300 hover:bg-indigo-50/50 transition-colors w-full text-left"
                        >
                          <FileText className="w-[18px] h-[18px] text-slate-400" />
                          <span className="text-sm text-slate-500">Connect HubSpot Blog</span>
                        </button>
                      )}

                      {/* Blog selector dropdown */}
                      {selectingBlog === d.id && (
                        <div className="py-3 px-3 bg-indigo-50/50 rounded-lg border border-indigo-200 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-500 uppercase">Select HubSpot Blog</span>
                            <button onClick={() => { setSelectingBlog(null); setBlogError(""); }} className="text-xs text-slate-400 hover:text-slate-600">Cancel</button>
                          </div>
                          {loadingBlogs && (
                            <div className="flex items-center gap-2 py-2 text-sm text-slate-500">
                              <Loader2 className="w-4 h-4 animate-spin" /> Loading blogs from HubSpot...
                            </div>
                          )}
                          {blogError && <p className="text-xs text-red-600">{blogError}</p>}
                          {!loadingBlogs && hubspotBlogs.length === 0 && !blogError && (
                            <p className="text-xs text-slate-500 py-1">No blogs found. Make sure HubSpot is connected and your account has blog content.</p>
                          )}
                          {hubspotBlogs.map((blog) => (
                            <button
                              key={blog.id}
                              onClick={() => handleSelectBlog(d.id, blog.id)}
                              className={`w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-white transition-colors border ${
                                d.hubspotBlogId === blog.id ? "border-indigo-400 bg-white" : "border-transparent"
                              }`}
                            >
                              <span className="font-medium text-slate-800">{blog.name}</span>
                              {blog.absoluteUrl && <span className="text-slate-400 ml-2 text-xs">{blog.absoluteUrl}</span>}
                            </button>
                          ))}
                          {d.hubspotBlogId && (
                            <button
                              onClick={() => handleSelectBlog(d.id, "")}
                              className="text-xs font-bold text-rose-600 hover:text-rose-700 mt-1"
                            >
                              Disconnect Blog
                            </button>
                          )}
                        </div>
                      )}

                      {!d.ga4AccountId && !d.gscProperty && !d.hubspotBlogId && selectingBlog !== d.id && (
                        <p className="text-sm text-slate-400 italic py-2 px-3">No data sources mapped yet.</p>
                      )}
                    </div>
                  </div>

                  {/* Competitors & Categories Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Competitors */}
                    <div className="space-y-3">
                      <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Competitors</h5>
                      <div className="flex flex-wrap gap-2 items-center">
                        {d.competitors.map((c) => (
                          <span key={c.id} className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium border border-slate-200">
                            {c.competitorDomain}
                            <button onClick={() => handleRemoveCompetitor(d.id, c.id)} className="hover:text-rose-500">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </span>
                        ))}
                        {d.competitors.length < 10 && (
                          addingComp === d.id ? (
                            <div className="flex gap-1 items-center">
                              <input
                                type="text" value={compInput}
                                onChange={(e) => setCompInput(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleAddCompetitor(d.id)}
                                className="px-2 py-1 border border-slate-300 rounded-lg text-xs w-40 focus:outline-none focus:ring-1 focus:ring-[#3730A3]"
                                placeholder="competitor.com"
                                autoFocus
                              />
                              <button onClick={() => handleAddCompetitor(d.id)} className="text-xs font-bold text-indigo-600">Add</button>
                              <button onClick={() => { setAddingComp(null); setCompInput(""); }} className="text-xs text-slate-400">Cancel</button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setAddingComp(d.id)}
                              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 ml-2"
                            >
                              <Plus className="w-3.5 h-3.5" /> Add competitor
                            </button>
                          )
                        )}
                      </div>
                    </div>

                    {/* Content Categories */}
                    <div className="space-y-3">
                      <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Content Categories</h5>
                      <div className="flex flex-wrap gap-2 items-center">
                        {d.contentCategoriesJson && Array.isArray(d.contentCategoriesJson) && d.contentCategoriesJson.map((cat, i) => (
                          <span key={i} className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium border border-indigo-100">
                            {String(cat)}
                            <X className="w-3.5 h-3.5 cursor-pointer" />
                          </span>
                        ))}
                        <button className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 ml-2">
                          <Plus className="w-3.5 h-3.5" /> Add category
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                  <button className="px-6 py-2 bg-[#3730A3] text-white text-sm font-bold rounded-lg hover:bg-indigo-800 transition-colors shadow-sm">
                    Save Changes
                  </button>
                </div>
              </div>
            ))}

            {domains.length === 0 && (
              <div className="text-center py-12 text-slate-500">
                No domains configured yet. Add your first domain above.
              </div>
            )}
          </div>

          {/* Help Section */}
          <div className="mt-8 border-2 border-dashed border-slate-200 rounded-xl p-12 flex flex-col items-center text-center bg-slate-50/50">
            <div className="size-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <HelpCircle className="w-6 h-6 text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Need help with mapping?</h3>
            <p className="text-slate-500 text-sm max-w-md mb-4">
              Check out our guide on how to correctly map your data sources for maximum insights.
            </p>
            <a className="text-indigo-600 font-bold text-sm flex items-center gap-1 hover:gap-2 transition-all" href="#">
              View Documentation <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
