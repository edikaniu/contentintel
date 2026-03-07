"use client";

import { Info, Lock } from "lucide-react";
import { SettingsSubNav } from "@/components/settings-sub-nav";

const STAGES = [
  {
    name: "Pending",
    pillColor: "bg-amber-100/50 text-amber-600 border border-amber-200",
    sublabel: "Creation",
    description: "Initial stage for newly submitted content.",
    transitionDot: "bg-emerald-500",
    transitionText: "Auto-transition to 'Approved' on vote",
  },
  {
    name: "Approved",
    pillColor: "bg-emerald-100/50 text-emerald-600 border border-emerald-200",
    sublabel: "Live",
    description: "Success state. Content is ready for publishing.",
    transitionDot: "bg-blue-500",
    transitionText: "Manual re-evaluation enabled",
  },
  {
    name: "Rejected",
    pillColor: "bg-red-100/50 text-red-600 border border-red-200",
    sublabel: "Archived",
    description: "Terminal state for failed content items.",
    transitionDot: "bg-slate-400",
    transitionText: "Permanent archival on entry",
  },
];

export default function WorkflowSettingsPage() {
  return (
    <>
      <SettingsSubNav />

      {/* Content Area */}
      <div className="p-8 max-w-5xl">
        {/* Title section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900">Approval Workflow</h2>
          <p className="text-slate-500 mt-1">
            Manage your content approval pipeline and automated transitions.
          </p>
        </div>

        {/* Pipeline visualization */}
        <div className="bg-white p-8 rounded-xl border border-slate-200 mb-8">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            {STAGES.map((stage, i) => (
              <div key={stage.name} className="contents">
                <div className="flex flex-col items-center gap-3">
                  <div
                    className={`px-6 py-2 rounded-full font-bold text-sm ${stage.pillColor}`}
                  >
                    {stage.name}
                  </div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">
                    {stage.sublabel}
                  </span>
                </div>
                {i < STAGES.length - 1 && (
                  <div className="flex-1 flex justify-center text-slate-300">
                    <span className="text-4xl leading-none">&rarr;</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Info banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3 mb-8">
          <Info className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
          <p className="text-sm text-blue-800">
            v1 ships with a simple three-stage workflow. Custom stages and complex
            logic are coming in a future update.
          </p>
        </div>

        {/* Configuration cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {STAGES.map((stage) => (
            <div
              key={stage.name}
              className="bg-white rounded-xl border border-slate-200 overflow-hidden opacity-80"
            >
              <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-bold text-slate-900">Stage: {stage.name}</h3>
                <Lock className="w-4 h-4 text-slate-400" />
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    Description
                  </label>
                  <p className="text-sm text-slate-600 italic">{stage.description}</p>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    Transitions
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${stage.transitionDot}`}
                    />
                    <span className="text-xs text-slate-500">
                      {stage.transitionText}
                    </span>
                  </div>
                </div>
                <div className="pt-4">
                  <button
                    disabled
                    className="w-full py-2 bg-slate-100 text-slate-400 rounded-lg text-sm font-medium cursor-not-allowed"
                  >
                    Locked in v1
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
