"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  CheckCircle,
  XCircle,
  Loader2,
  ArrowRight,
  ArrowLeft,
  SkipForward,
  Database,
  BarChart3,
  FileText,
  Brain,
  TrendingUp,
  Globe,
  Users,
  RefreshCw,
  Info,
  HelpCircle,
  Shield,
} from "lucide-react";

type StepStatus = "idle" | "testing" | "success" | "error";

const STEPS = [
  { label: "SEO", icon: Database, required: true },
  { label: "Windsor", icon: BarChart3, required: true },
  { label: "HubSpot", icon: FileText, required: true },
  { label: "AI", icon: Brain, required: true },
  { label: "SEMrush", icon: TrendingUp, required: false },
  { label: "Domain", icon: Globe, required: true },
  { label: "Team", icon: Users, required: false },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [currentStep, setCurrentStep] = useState(0);

  // Step 1: DataforSEO
  const [dfLogin, setDfLogin] = useState("");
  const [dfPassword, setDfPassword] = useState("");
  const [dfStatus, setDfStatus] = useState<StepStatus>("idle");
  const [dfMeta, setDfMeta] = useState<Record<string, unknown> | null>(null);
  const [dfError, setDfError] = useState("");

  // Step 2: Windsor
  const [windsorKey, setWindsorKey] = useState("");
  const [windsorStatus, setWindsorStatus] = useState<StepStatus>("idle");
  const [windsorMeta, setWindsorMeta] = useState<Record<string, unknown> | null>(null);
  const [windsorError, setWindsorError] = useState("");

  // Step 3: HubSpot
  const [hubspotToken, setHubspotToken] = useState("");
  const [hubspotStatus, setHubspotStatus] = useState<StepStatus>("idle");
  const [hubspotMeta, setHubspotMeta] = useState<Record<string, unknown> | null>(null);
  const [hubspotError, setHubspotError] = useState("");

  // Step 4: Anthropic
  const [anthropicKey, setAnthropicKey] = useState("");
  const [anthropicStatus, setAnthropicStatus] = useState<StepStatus>("idle");
  const [anthropicError, setAnthropicError] = useState("");

  // Step 5: SEMrush
  const [semrushKey, setSemrushKey] = useState("");
  const [semrushStatus, setSemrushStatus] = useState<StepStatus>("idle");
  const [semrushMeta, setSemrushMeta] = useState<Record<string, unknown> | null>(null);
  const [semrushError, setSemrushError] = useState("");

  // Step 6: Domain
  const [domainUrl, setDomainUrl] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [vertical, setVertical] = useState("");
  const [location, setLocation] = useState("2566");
  const [language, setLanguage] = useState("1000");
  const [gscProperty, setGscProperty] = useState("");
  const [ga4AccountId, setGa4AccountId] = useState("");
  const [hubspotBlogId, setHubspotBlogId] = useState("");
  const [competitorInput, setCompetitorInput] = useState("");
  const [competitors, setCompetitors] = useState<string[]>([]);
  const [categoriesInput, setCategoriesInput] = useState("");
  const [domainError, setDomainError] = useState("");

  // Step 7: Invite Team
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("editor");
  const [invites, setInvites] = useState<{ email: string; role: string }[]>([]);
  const [inviteError, setInviteError] = useState("");
  const [inviting, setInviting] = useState(false);

  const [saving, setSaving] = useState(false);

  async function saveAndTest(
    provider: string,
    credentials: Record<string, string>,
    setStatus: (s: StepStatus) => void,
    setMeta: ((m: Record<string, unknown> | null) => void) | null,
    setErr: (e: string) => void
  ) {
    setStatus("testing");
    setErr("");
    try {
      const saveRes = await fetch("/api/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, credentials }),
      });
      if (!saveRes.ok) {
        const d = await saveRes.json();
        setErr(d.error || "Failed to save");
        setStatus("error");
        return false;
      }
      const testRes = await fetch("/api/connections/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
      });
      const result = await testRes.json();
      if (result.success) {
        setStatus("success");
        if (setMeta) setMeta(result.metadata || null);
        return true;
      } else {
        setStatus("error");
        setErr(result.error || "Connection test failed");
        return false;
      }
    } catch {
      setStatus("error");
      setErr("Connection failed");
      return false;
    }
  }

  async function handleNext() {
    setSaving(true);
    try {
      if (currentStep === 0) {
        if (!dfLogin || !dfPassword) { setDfError("Login and password are required"); setSaving(false); return; }
        const ok = await saveAndTest("dataforseo", { login: dfLogin, password: dfPassword }, setDfStatus, setDfMeta, setDfError);
        if (ok) setCurrentStep(1);
      } else if (currentStep === 1) {
        if (!windsorKey) { setWindsorError("API key is required"); setSaving(false); return; }
        const ok = await saveAndTest("windsor", { api_key: windsorKey }, setWindsorStatus, setWindsorMeta, setWindsorError);
        if (ok) setCurrentStep(2);
      } else if (currentStep === 2) {
        if (!hubspotToken) { setHubspotError("Access token is required"); setSaving(false); return; }
        const ok = await saveAndTest("hubspot", { access_token: hubspotToken }, setHubspotStatus, setHubspotMeta, setHubspotError);
        if (ok) setCurrentStep(3);
      } else if (currentStep === 3) {
        if (!anthropicKey) { setAnthropicError("API key is required"); setSaving(false); return; }
        const ok = await saveAndTest("anthropic", { api_key: anthropicKey }, setAnthropicStatus, null, setAnthropicError);
        if (ok) setCurrentStep(4);
      } else if (currentStep === 4) {
        if (semrushKey) {
          const ok = await saveAndTest("semrush", { api_key: semrushKey }, setSemrushStatus, setSemrushMeta, setSemrushError);
          if (ok) setCurrentStep(5);
        } else {
          setCurrentStep(5);
        }
      } else if (currentStep === 5) {
        if (!domainUrl || !displayName) { setDomainError("Domain URL and display name are required"); setSaving(false); return; }
        const res = await fetch("/api/onboarding/domain", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            domain: domainUrl, displayName, vertical,
            dataforseoLocation: parseInt(location), dataforseoLanguage: parseInt(language),
            gscProperty, ga4AccountId, hubspotBlogId,
            competitors, contentCategories: categoriesInput.split(",").map(c => c.trim()).filter(Boolean),
          }),
        });
        if (res.ok) {
          setCurrentStep(6);
        } else {
          const d = await res.json();
          setDomainError(d.error || "Failed to save domain");
        }
      } else if (currentStep === 6) {
        await fetch("/api/onboarding/complete", { method: "POST" });
        router.push("/dashboard");
      }
    } finally {
      setSaving(false);
    }
  }

  function addCompetitor() {
    const c = competitorInput.trim();
    if (c && competitors.length < 10 && !competitors.includes(c)) {
      setCompetitors([...competitors, c]);
      setCompetitorInput("");
    }
  }

  async function sendInvite() {
    if (!inviteEmail) return;
    setInviting(true);
    setInviteError("");
    try {
      const res = await fetch("/api/team/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      if (res.ok) {
        setInvites([...invites, { email: inviteEmail, role: inviteRole }]);
        setInviteEmail("");
      } else {
        const d = await res.json();
        setInviteError(d.error || "Failed to send invite");
      }
    } catch {
      setInviteError("Failed to send invite");
    } finally {
      setInviting(false);
    }
  }

  function StatusBadge({ status, error, successText }: { status: StepStatus; error?: string; successText?: string }) {
    if (status === "testing") return (
      <div className="flex items-center gap-2 text-gray-500 text-sm">
        <Loader2 className="w-4 h-4 animate-spin" />
        Testing connection...
      </div>
    );
    if (status === "success") return (
      <div className="flex items-center gap-2 text-[#A3E635] text-sm font-medium">
        <CheckCircle className="w-4 h-4" />
        {successText || "Connected successfully"}
      </div>
    );
    if (status === "error") return (
      <div className="flex items-center gap-2 text-red-400 text-sm">
        <XCircle className="w-4 h-4" />
        {error || "Connection failed"}
      </div>
    );
    return (
      <div className="flex items-center gap-2 text-gray-600 text-sm">
        <Info className="w-4 h-4" />
        Not connected yet
      </div>
    );
  }

  const progressWidth = `${(currentStep / (STEPS.length - 1)) * 100}%`;

  // Step titles and descriptions
  const stepTitles = [
    { title: "Step 1: Connect DataforSEO", desc: "To provide accurate keyword and SEO data, please connect your DataforSEO account credentials." },
    { title: "Step 2: Connect Windsor.ai", desc: "Windsor connects to your Google Search Console and GA4 data. You'll map specific properties to your domain in Step 6." },
    { title: "Step 3: Connect HubSpot", desc: "Connect your HubSpot account to sync your content inventory automatically." },
    { title: "Step 4: Connect Anthropic", desc: "Required for AI-powered topic angles, outlines, and content analysis." },
    { title: "Step 5: Connect SEMrush", desc: "Optional — adds competitor enrichment data for deeper insights." },
    { title: "Step 6: Add Your Domain", desc: "Configure your first domain for content intelligence analysis." },
    { title: "Step 7: Invite Your Team", desc: "Optional — you can always invite team members later from Settings." },
  ];

  const isRequired = STEPS[currentStep].required;

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* Radial violet glow */}
      <div className="fixed pointer-events-none z-0" style={{ top: "-30%", left: "50%", transform: "translateX(-50%)", width: "1000px", height: "1000px", background: "radial-gradient(ellipse at center, rgba(45,27,105,0.25) 0%, rgba(45,27,105,0.05) 40%, transparent 70%)" }} />

      {/* Top Navigation Bar */}
      <header className="w-full bg-[#111111] border-b border-[#222] px-6 py-3 sticky top-0 z-50">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-[#8B5CF6]" />
            <h1 className="text-xl font-headline font-bold tracking-tight text-white">ContentIntel</h1>
            <div className="h-4 w-px bg-[#333] mx-2" />
            <span className="text-sm font-medium text-gray-500">{session?.user?.name || "Setup"}</span>
          </div>
        </div>
      </header>

      <main className="py-12 px-4 relative z-10">
        <div className="max-w-[680px] mx-auto">
          {/* Horizontal Stepper */}
          <div className="mb-10">
            <div className="flex items-center justify-between relative">
              {/* Progress Line Background */}
              <div className="absolute top-4 left-0 w-full h-0.5 bg-[#222] z-0" />
              {/* Active Progress Line */}
              <div className="absolute top-4 left-0 h-0.5 bg-[#8B5CF6] z-0 transition-all duration-500" style={{ width: progressWidth }} />
              {/* Steps */}
              {STEPS.map((step, i) => (
                <div key={i} className="relative z-10 flex flex-col items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ring-4 ring-[#050505] ${
                    i < currentStep
                      ? "bg-[#8B5CF6] text-white"
                      : i === currentStep
                      ? "bg-[#050505] border-2 border-[#8B5CF6] text-[#8B5CF6]"
                      : "bg-[#050505] border-2 border-[#333] text-gray-600"
                  }`}>
                    {i < currentStep ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : i === currentStep ? (
                      <div className="w-2 h-2 rounded-full bg-[#8B5CF6]" />
                    ) : (
                      i + 1
                    )}
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${
                    i === currentStep ? "text-[#8B5CF6]" : "text-gray-600"
                  }`}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Step Card */}
          <div className="bg-[#111111] rounded-xl border border-[#222] overflow-hidden">
            <div className="p-8">
              {/* Step Header */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-headline font-semibold text-white">{stepTitles[currentStep].title}</h2>
                  <p className="text-gray-500 font-body mt-1">{stepTitles[currentStep].desc}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  isRequired
                    ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    : "bg-[#1a1a1a] text-gray-600 border border-[#333]"
                }`}>
                  {isRequired ? "Required" : "Optional"}
                </span>
              </div>

              {/* Step Forms */}
              <div className="space-y-6">
                {/* Step 1: DataforSEO */}
                {currentStep === 0 && (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-400 font-body">Account Email</label>
                      <input type="email" value={dfLogin} onChange={(e) => setDfLogin(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-[#222] bg-[#0a0a0a] text-white placeholder-gray-600 focus:ring-1 focus:ring-violet-500/30 focus:border-violet-500/50 transition-all outline-none text-sm" placeholder="email@example.com" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-400 font-body">API Password</label>
                      <input type="password" value={dfPassword} onChange={(e) => setDfPassword(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-[#222] bg-[#0a0a0a] text-white placeholder-gray-600 focus:ring-1 focus:ring-violet-500/30 focus:border-violet-500/50 transition-all outline-none text-sm" placeholder="••••••••••••" />
                    </div>
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-[#0a0a0a] border border-[#1a1a1a]">
                      <button type="button" onClick={() => saveAndTest("dataforseo", { login: dfLogin, password: dfPassword }, setDfStatus, setDfMeta, setDfError)} className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] border border-[#333] text-white rounded-lg text-sm font-semibold hover:bg-[#222] transition-colors">
                        <RefreshCw className="w-4 h-4" />Test Connection
                      </button>
                      <StatusBadge status={dfStatus} error={dfError} successText={dfMeta ? `Connected! Balance: $${String(dfMeta.balance ?? "N/A")}` : undefined} />
                    </div>
                  </div>
                )}

                {/* Step 2: Windsor */}
                {currentStep === 1 && (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-400 font-body">API Key</label>
                      <input type="text" value={windsorKey} onChange={(e) => setWindsorKey(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-[#222] bg-[#0a0a0a] text-white placeholder-gray-600 focus:ring-1 focus:ring-violet-500/30 focus:border-violet-500/50 transition-all outline-none font-mono text-sm" placeholder="Enter your Windsor.ai API key" />
                    </div>
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-[#0a0a0a] border border-[#1a1a1a]">
                      <button type="button" onClick={() => saveAndTest("windsor", { api_key: windsorKey }, setWindsorStatus, setWindsorMeta, setWindsorError)} className="flex items-center gap-2 px-4 py-2 bg-transparent border border-[#8B5CF6] text-[#8B5CF6] rounded-lg text-sm font-semibold hover:bg-[#8B5CF6]/10 transition-colors">
                        <RefreshCw className="w-4 h-4" />Test Connection
                      </button>
                      <StatusBadge status={windsorStatus} error={windsorError} successText={windsorMeta ? `Success! ${String(windsorMeta.connectors ?? 0)} connectors found` : undefined} />
                    </div>
                  </div>
                )}

                {/* Step 3: HubSpot */}
                {currentStep === 2 && (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-400 font-body">Private App Access Token</label>
                      <input type="password" value={hubspotToken} onChange={(e) => setHubspotToken(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-[#222] bg-[#0a0a0a] text-white placeholder-gray-600 focus:ring-1 focus:ring-violet-500/30 focus:border-violet-500/50 transition-all outline-none text-sm" placeholder="pat-na1-..." />
                      <p className="text-xs text-gray-600 mt-1">Create a private app in HubSpot &gt; Settings &gt; Private Apps</p>
                    </div>
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-[#0a0a0a] border border-[#1a1a1a]">
                      <button type="button" onClick={() => saveAndTest("hubspot", { access_token: hubspotToken }, setHubspotStatus, setHubspotMeta, setHubspotError)} className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] border border-[#333] text-white rounded-lg text-sm font-semibold hover:bg-[#222] transition-colors">
                        <RefreshCw className="w-4 h-4" />Test Connection
                      </button>
                      <StatusBadge status={hubspotStatus} error={hubspotError} successText={hubspotMeta ? `Connected! Portal ID: ${String(hubspotMeta.portalId ?? "N/A")}` : undefined} />
                    </div>
                  </div>
                )}

                {/* Step 4: Anthropic */}
                {currentStep === 3 && (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-400 font-body">API Key</label>
                      <input type="password" value={anthropicKey} onChange={(e) => setAnthropicKey(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-[#222] bg-[#0a0a0a] text-white placeholder-gray-600 focus:ring-1 focus:ring-violet-500/30 focus:border-violet-500/50 transition-all outline-none text-sm" placeholder="sk-ant-..." />
                    </div>
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-[#0a0a0a] border border-[#1a1a1a]">
                      <button type="button" onClick={() => saveAndTest("anthropic", { api_key: anthropicKey }, setAnthropicStatus, null, setAnthropicError)} className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] border border-[#333] text-white rounded-lg text-sm font-semibold hover:bg-[#222] transition-colors">
                        <RefreshCw className="w-4 h-4" />Test Connection
                      </button>
                      <StatusBadge status={anthropicStatus} error={anthropicError} />
                    </div>
                  </div>
                )}

                {/* Step 5: SEMrush */}
                {currentStep === 4 && (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-400 font-body">API Key</label>
                      <input type="password" value={semrushKey} onChange={(e) => setSemrushKey(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-[#222] bg-[#0a0a0a] text-white placeholder-gray-600 focus:ring-1 focus:ring-violet-500/30 focus:border-violet-500/50 transition-all outline-none text-sm" placeholder="Leave empty to skip" />
                    </div>
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-[#0a0a0a] border border-[#1a1a1a]">
                      <button type="button" onClick={() => { if (semrushKey) saveAndTest("semrush", { api_key: semrushKey }, setSemrushStatus, setSemrushMeta, setSemrushError); }} className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] border border-[#333] text-white rounded-lg text-sm font-semibold hover:bg-[#222] transition-colors">
                        <RefreshCw className="w-4 h-4" />Test Connection
                      </button>
                      <StatusBadge status={semrushStatus} error={semrushError} successText={semrushMeta ? `Connected! Units: ${String(semrushMeta.unitsRemaining ?? "N/A")}` : undefined} />
                    </div>
                  </div>
                )}

                {/* Step 6: Domain */}
                {currentStep === 5 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-400 font-body">Domain URL</label>
                        <input type="text" value={domainUrl} onChange={(e) => setDomainUrl(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-[#222] bg-[#0a0a0a] text-white placeholder-gray-600 focus:ring-1 focus:ring-violet-500/30 focus:border-violet-500/50 transition-all outline-none text-sm" placeholder="example.com" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-400 font-body">Display Name</label>
                        <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-[#222] bg-[#0a0a0a] text-white placeholder-gray-600 focus:ring-1 focus:ring-violet-500/30 focus:border-violet-500/50 transition-all outline-none text-sm" placeholder="My Site" />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-400 font-body">Vertical</label>
                        <input type="text" value={vertical} onChange={(e) => setVertical(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-[#222] bg-[#0a0a0a] text-white placeholder-gray-600 focus:ring-1 focus:ring-violet-500/30 focus:border-violet-500/50 transition-all outline-none text-sm" placeholder="finance" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-400 font-body">Location ID</label>
                        <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-[#222] bg-[#0a0a0a] text-white placeholder-gray-600 focus:ring-1 focus:ring-violet-500/30 focus:border-violet-500/50 transition-all outline-none text-sm" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-400 font-body">Language ID</label>
                        <input type="text" value={language} onChange={(e) => setLanguage(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-[#222] bg-[#0a0a0a] text-white placeholder-gray-600 focus:ring-1 focus:ring-violet-500/30 focus:border-violet-500/50 transition-all outline-none text-sm" />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-400 font-body">GSC Property</label>
                        <input type="text" value={gscProperty} onChange={(e) => setGscProperty(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-[#222] bg-[#0a0a0a] text-white placeholder-gray-600 focus:ring-1 focus:ring-violet-500/30 focus:border-violet-500/50 transition-all outline-none text-sm" placeholder="sc-domain:..." />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-400 font-body">GA4 Account ID</label>
                        <input type="text" value={ga4AccountId} onChange={(e) => setGa4AccountId(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-[#222] bg-[#0a0a0a] text-white placeholder-gray-600 focus:ring-1 focus:ring-violet-500/30 focus:border-violet-500/50 transition-all outline-none text-sm" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-400 font-body">HubSpot Blog ID</label>
                        <input type="text" value={hubspotBlogId} onChange={(e) => setHubspotBlogId(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-[#222] bg-[#0a0a0a] text-white placeholder-gray-600 focus:ring-1 focus:ring-violet-500/30 focus:border-violet-500/50 transition-all outline-none text-sm" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-400 font-body">Competitors (up to 10)</label>
                      <div className="flex gap-2">
                        <input type="text" value={competitorInput} onChange={(e) => setCompetitorInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCompetitor())} className="flex-1 px-4 py-2.5 rounded-lg border border-[#222] bg-[#0a0a0a] text-white placeholder-gray-600 focus:ring-1 focus:ring-violet-500/30 focus:border-violet-500/50 transition-all outline-none text-sm" placeholder="competitor.com" />
                        <button type="button" onClick={addCompetitor} className="px-4 py-2.5 bg-[#1a1a1a] border border-[#333] text-white rounded-lg text-sm font-semibold hover:bg-[#222] transition-colors">Add</button>
                      </div>
                      {competitors.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {competitors.map((c, i) => (
                            <span key={i} className="inline-flex items-center gap-1 px-3 py-1 bg-[#1a1a1a] border border-[#333] rounded-lg text-sm">
                              {c}
                              <button onClick={() => setCompetitors(competitors.filter((_, j) => j !== i))} className="text-gray-600 hover:text-red-400 ml-1">&times;</button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-400 font-body">Content Categories</label>
                      <input type="text" value={categoriesInput} onChange={(e) => setCategoriesInput(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-[#222] bg-[#0a0a0a] text-white placeholder-gray-600 focus:ring-1 focus:ring-violet-500/30 focus:border-violet-500/50 transition-all outline-none text-sm" placeholder="loans, investments, crypto (comma-separated)" />
                    </div>
                    {domainError && <p className="text-sm text-red-400">{domainError}</p>}
                  </div>
                )}

                {/* Step 7: Invite Team */}
                {currentStep === 6 && (
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} className="flex-1 px-4 py-2.5 rounded-lg border border-[#222] bg-[#0a0a0a] text-white placeholder-gray-600 focus:ring-1 focus:ring-violet-500/30 focus:border-violet-500/50 transition-all outline-none text-sm" placeholder="team@example.com" />
                      <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)} className="px-3 py-2.5 rounded-lg border border-[#222] bg-[#0a0a0a] text-white placeholder-gray-600 focus:ring-1 focus:ring-violet-500/30 focus:border-violet-500/50 outline-none text-sm">
                        <option value="admin">Admin</option>
                        <option value="editor">Editor</option>
                        <option value="viewer">Viewer</option>
                      </select>
                      <button type="button" onClick={sendInvite} disabled={inviting} className="px-5 py-2.5 bg-[#8B5CF6] text-white rounded-lg text-sm font-semibold hover:bg-[#8B5CF6]/90 disabled:opacity-50 transition-colors">
                        {inviting ? "..." : "Send"}
                      </button>
                    </div>
                    {inviteError && <p className="text-sm text-red-400">{inviteError}</p>}
                    {invites.length > 0 && (
                      <div className="space-y-2">
                        {invites.map((inv, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm text-gray-400 p-3 rounded-lg border border-[#222] bg-[#0a0a0a]">
                            <CheckCircle className="w-4 h-4 text-[#A3E635]" />
                            {inv.email} — <span className="capitalize">{inv.role}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Footer Navigation */}
            <div className="px-8 py-5 bg-[#0a0a0a] border-t border-[#222] flex items-center justify-between">
              <button
                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                disabled={currentStep === 0}
                className="px-5 py-2 text-gray-600 font-semibold text-sm flex items-center gap-1 disabled:cursor-not-allowed hover:text-gray-300 transition-colors disabled:hover:text-gray-600"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <div className="flex items-center gap-3">
                {!STEPS[currentStep].required && (
                  <button
                    onClick={() => setCurrentStep(currentStep + 1)}
                    className="px-5 py-2 text-gray-600 hover:text-gray-300 font-semibold text-sm transition-colors"
                  >
                    Skip for now
                  </button>
                )}
                <button
                  onClick={handleNext}
                  disabled={saving}
                  className="landing-gradient-border-btn !px-6 !py-2.5 text-white font-semibold rounded-lg text-sm transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : currentStep === 6 ? (
                    "Finish Setup"
                  ) : (
                    <>Continue <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Hint Section */}
          {currentStep < 5 && (
            <div className="mt-8 grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-[#8B5CF6]/5 border border-[#8B5CF6]/10 flex gap-3">
                <HelpCircle className="w-5 h-5 text-[#8B5CF6] flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-[#8B5CF6]">Where to find API?</h4>
                  <p className="text-xs text-[#8B5CF6]/70 leading-relaxed mt-0.5">
                    Log in to your provider dashboard and look for &apos;API Credentials&apos; in Account Settings.
                  </p>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-[#A3E635]/5 border border-[#A3E635]/10 flex gap-3">
                <Shield className="w-5 h-5 text-[#A3E635] flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-[#A3E635]">Secure Encryption</h4>
                  <p className="text-xs text-[#A3E635]/70 leading-relaxed mt-0.5">
                    Your credentials are encrypted and stored securely using enterprise-grade AES-256 standards.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <footer className="mt-12 text-center">
            <p className="text-gray-600 text-sm">Step {currentStep + 1} of {STEPS.length} — Estimated time: 5 minutes</p>
          </footer>
        </div>
      </main>
    </div>
  );
}
