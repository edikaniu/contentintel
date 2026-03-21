"use client";

import { useState, useEffect, useRef, FormEvent, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Search, Loader2, Link2, Lock } from "lucide-react";
import { BriefDisplay } from "@/components/brief-display";
import { useDomain } from "@/components/domain-context";

interface Brief {
  keyword: string;
  primaryMetrics: {
    searchVolume: number;
    keywordDifficulty: number;
    cpc: number;
    trendData: Array<{ month: number; year: number; search_volume: number }>;
  };
  relatedKeywords: Array<{
    keyword: string;
    searchVolume: number;
    keywordDifficulty: number;
    cpc: number;
  }>;
  serpLandscape: {
    topResults: Array<{ title: string; url: string; domain: string; position: number }>;
    serpFeatures: string[];
  };
  competitorCheck: {
    competitors: Array<{ domain: string; position: number; title: string; url: string }>;
    hasCompetitorPresence: boolean;
  };
  cannibalisationCheck: {
    risk: boolean;
    overlappingContent: Array<{ title: string; url: string }>;
  };
  aiAnalysis: {
    angles: Array<{ angle: string; rationale: string }>;
    outline: string[];
    contentType: string;
    opportunityScore: number;
    verdict: string;
  };
  generatedAt: string;
  warnings?: string[];
}

const PROGRESS_STEPS = [
  "Extracting keywords...",
  "Fetching search volume & difficulty...",
  "Analyzing SERP results...",
  "Checking for cannibalisation...",
  "Generating AI analysis...",
];

function ValidateTopicPageInner() {
  const searchParams = useSearchParams();
  const { selectedDomainId, domains } = useDomain();
  const selectedDomain = domains.find((d) => d.id === selectedDomainId) ?? null;
  const [activeTab, setActiveTab] = useState<"text" | "url">("text");
  const [topic, setTopic] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [progressStep, setProgressStep] = useState(0);
  const [brief, setBrief] = useState<Brief | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [adding, setAdding] = useState(false);
  const autoSubmitDone = useRef(false);

  // Handle URL params: topicId (load stored brief) or keyword (fresh validation)
  useEffect(() => {
    if (autoSubmitDone.current) return;

    const topicId = searchParams.get("topicId");
    const kw = searchParams.get("keyword");

    if (topicId) {
      // Load stored brief from database — no fresh API calls needed
      autoSubmitDone.current = true;
      setStatus("loading");
      setProgressStep(PROGRESS_STEPS.length - 1); // skip to end

      fetch(`/api/topics/${topicId}`)
        .then(async (res) => {
          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            setErrorMessage(data.error || "Failed to load topic brief.");
            setStatus("error");
            return;
          }
          const data = await res.json();
          setBrief(data.brief);
          setTopic(data.brief.keyword);
          setStatus("done");
        })
        .catch(() => {
          setErrorMessage("Network error. Please try again.");
          setStatus("error");
        });
    } else if (kw) {
      autoSubmitDone.current = true;
      setTopic(kw);
    }
  }, [searchParams]);

  // Auto-submit fresh validation when keyword is set from URL param and domain is ready
  useEffect(() => {
    if (autoSubmitDone.current && topic && selectedDomain && status === "idle" && !searchParams.get("topicId")) {
      // Trigger validation programmatically
      setStatus("loading");
      setProgressStep(0);
      setBrief(null);
      setErrorMessage("");

      const interval = setInterval(() => {
        setProgressStep((prev) => (prev < PROGRESS_STEPS.length - 1 ? prev + 1 : prev));
      }, 2000);

      fetch("/api/topics/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topic.trim(), domainId: selectedDomain.id }),
      })
        .then(async (res) => {
          clearInterval(interval);
          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            setErrorMessage(data.error || "Validation failed. Please try again.");
            setStatus("error");
            return;
          }
          const data = await res.json();
          setBrief(data.brief);
          setStatus("done");
        })
        .catch(() => {
          clearInterval(interval);
          setErrorMessage("Network error. Please try again.");
          setStatus("error");
        });
    }
  }, [topic, selectedDomain, status, searchParams]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!topic.trim() || !selectedDomain) return;

    setStatus("loading");
    setProgressStep(0);
    setBrief(null);
    setErrorMessage("");

    // Animate progress steps
    const interval = setInterval(() => {
      setProgressStep((prev) => {
        if (prev < PROGRESS_STEPS.length - 1) return prev + 1;
        return prev;
      });
    }, 2000);

    try {
      const res = await fetch("/api/topics/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topic.trim(), domainId: selectedDomain.id }),
      });

      clearInterval(interval);

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErrorMessage(data.error || "Validation failed. Please try again.");
        setStatus("error");
        return;
      }

      const data = await res.json();
      setBrief(data.brief);
      setStatus("done");
    } catch {
      clearInterval(interval);
      setErrorMessage("Network error. Please try again.");
      setStatus("error");
    }
  }

  async function handleAddToRecommendations() {
    if (!brief || !selectedDomain) return;
    setAdding(true);

    try {
      const res = await fetch("/api/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domainId: selectedDomain.id,
          primaryKeyword: brief.keyword,
          searchVolume: brief.primaryMetrics.searchVolume,
          keywordDifficulty: brief.primaryMetrics.keywordDifficulty,
          opportunityScore: brief.aiAnalysis.opportunityScore,
          suggestedContentType: brief.aiAnalysis.contentType,
          aiAngle: brief.aiAnalysis.angles.map((a) => a.angle).join(" | "),
          aiOutline: brief.aiAnalysis.outline.join("\n"),
          supportingKeywords: brief.relatedKeywords.map((k) => k.keyword),
          competitorData: brief.competitorCheck.competitors,
          serpFeatures: brief.serpLandscape.serpFeatures,
          source: "validator",
        }),
      });

      if (res.ok) {
        alert("Topic added to recommendations as Pending.");
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Failed to add topic.");
      }
    } catch {
      alert("Network error. Please try again.");
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="space-y-6 p-8 bg-[#F9FAFB] min-h-full">
      <div>
        <h1 className="text-2xl font-headline font-bold text-gray-900">Topic Validator</h1>
        <p className="text-sm font-body text-gray-500 mt-1">
          Validate any topic idea against keyword metrics, competitor analysis, and AI-generated recommendations.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-100 w-fit">
        <button
          onClick={() => setActiveTab("text")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold font-body transition-colors border-b-2 ${
            activeTab === "text"
              ? "text-[#8B5CF6] border-[#8B5CF6]"
              : "text-gray-500 border-transparent hover:text-gray-900"
          }`}
        >
          <Search className="w-4 h-4" />
          Text Input
        </button>
        <button
          onClick={() => setActiveTab("url")}
          disabled
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold font-body text-gray-400 cursor-not-allowed relative group border-b-2 border-transparent"
          title="Coming in v1.1"
        >
          <Link2 className="w-4 h-4" />
          URL Input
          <Lock className="w-3 h-3" />
          <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            Coming in v1.1
          </span>
        </button>
      </div>

      {/* Input Form */}
      {!selectedDomain ? (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
          <p className="text-sm font-body text-amber-800 font-medium">
            Please select a domain from the sidebar to use the Topic Validator.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <label className="block text-sm font-headline font-semibold text-gray-900 mb-2">
            Enter a topic or keyword
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder='e.g. "best personal loans for salary earners in Nigeria"'
              className="flex-1 w-full px-4 py-3 rounded-xl border border-gray-100 font-body text-lg focus:outline-none focus:ring-1 focus:ring-[#8B5CF6]/20 focus:border-[#8B5CF6] placeholder:text-gray-400"
              disabled={status === "loading"}
            />
            <button
              type="submit"
              disabled={status === "loading" || !topic.trim()}
              className="px-6 py-3 bg-[#8B5CF6] text-white text-sm font-semibold font-body rounded-xl hover:bg-[#7C3AED] disabled:opacity-50 transition-colors flex items-center justify-center gap-2 shrink-0"
            >
              {status === "loading" ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  Validate
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Loading Progress */}
      {status === "loading" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="space-y-3">
            {PROGRESS_STEPS.map((step, i) => (
              <div key={i} className="flex items-center gap-3">
                {i < progressStep ? (
                  <div className="w-5 h-5 rounded-full bg-[#A3E635] flex items-center justify-center">
                    <svg className="w-3 h-3 text-green-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                ) : i === progressStep ? (
                  <Loader2 className="w-5 h-5 text-[#8B5CF6] animate-spin" />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-gray-100" />
                )}
                <span
                  className={`text-sm font-body ${
                    i < progressStep
                      ? "text-gray-400 line-through"
                      : i === progressStep
                      ? "text-[#8B5CF6] font-semibold"
                      : "text-gray-300"
                  }`}
                >
                  {step}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {status === "error" && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
          <p className="text-sm font-body text-red-700 font-medium">{errorMessage}</p>
          <button
            onClick={() => setStatus("idle")}
            className="mt-2 text-sm font-body text-red-600 underline hover:no-underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Brief Display */}
      {status === "done" && brief && (
        <BriefDisplay
          brief={brief}
          onAddToRecommendations={handleAddToRecommendations}
          adding={adding}
        />
      )}
    </div>
  );
}

export default function ValidateTopicPage() {
  return (
    <Suspense fallback={null}>
      <ValidateTopicPageInner />
    </Suspense>
  );
}
