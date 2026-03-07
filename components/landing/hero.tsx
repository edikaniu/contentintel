import { PlayCircle } from "lucide-react";

export function Hero() {
  return (
    <main className="relative z-10 max-w-[1200px] mx-auto px-6 pt-12 pb-32">
      <div className="grid lg:grid-cols-12 gap-16 items-center">
        <div className="lg:col-span-6 space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#3730A3]/5 border border-[#3730A3]/10">
            <span className="flex h-2 w-2 rounded-full bg-[#3730A3] animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-widest text-[#3730A3]">Now in Beta</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 leading-[1.1] tracking-[-0.02em]">
            Content <span className="text-[#3730A3]">Intelligence</span> for the Modern Era.
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed max-w-xl">
            Stop guessing and start scaling. ContentIntel uses AI and real search data to discover topics,
            monitor content health, and optimize your entire content lifecycle.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <a
              href="#waitlist"
              className="bg-[#3730A3] text-white px-8 py-4 rounded-xl text-lg font-bold shadow-xl shadow-[#3730A3]/25 hover:-translate-y-1 transition-all text-center"
            >
              Join the Waitlist
            </a>
            <a
              href="#features"
              className="bg-white border border-slate-200 text-slate-700 px-8 py-4 rounded-xl text-lg font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
            >
              <PlayCircle className="w-5 h-5" />
              See How It Works
            </a>
          </div>
          <div className="flex items-center gap-6 pt-8 border-t border-slate-200">
            <div className="flex -space-x-3">
              <div className="w-10 h-10 rounded-full border-2 border-white bg-indigo-200" />
              <div className="w-10 h-10 rounded-full border-2 border-white bg-emerald-200" />
              <div className="w-10 h-10 rounded-full border-2 border-white bg-amber-200" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">Trusted by growing teams</p>
              <p className="text-xs text-slate-500">From startups to enterprise content teams</p>
            </div>
          </div>
        </div>

        {/* 3D Mockup Container */}
        <div className="lg:col-span-6 relative">
          <div className="bg-white rounded-2xl overflow-hidden border border-slate-200/50 aspect-[4/3] relative shadow-2xl" style={{ transform: "perspective(1200px) rotateX(6deg) rotateY(-8deg) rotateZ(1deg)" }}>
            {/* Browser UI */}
            <div className="h-10 border-b border-slate-100 flex items-center px-4 gap-2 bg-slate-50/50">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              </div>
              <div className="mx-auto bg-white border border-slate-200 rounded-md px-3 py-1 text-[10px] text-slate-400 w-1/2 text-center">
                app.contentintel.io/dashboard
              </div>
            </div>
            <div className="flex h-full">
              {/* Sidebar Mockup */}
              <div className="w-16 md:w-20 border-r border-slate-100 bg-slate-50/30 flex flex-col items-center py-6 gap-6">
                <div className="w-8 h-8 rounded-lg bg-[#3730A3]/10 flex items-center justify-center">
                  <div className="w-4 h-4 rounded bg-[#3730A3]/30" />
                </div>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center">
                  <div className="w-4 h-4 rounded bg-slate-200" />
                </div>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center">
                  <div className="w-4 h-4 rounded bg-slate-200" />
                </div>
              </div>
              {/* Main View Mockup */}
              <div className="flex-1 p-6 space-y-6">
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <div className="h-4 w-32 bg-slate-100 rounded" />
                    <div className="h-6 w-48 bg-slate-200 rounded" />
                  </div>
                  <div className="h-8 w-24 bg-[#3730A3]/10 rounded-lg border border-[#3730A3]/20" />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="h-24 bg-slate-50 rounded-xl border border-slate-100 p-4 space-y-3">
                    <div className="h-2 w-12 bg-slate-200 rounded" />
                    <div className="h-5 w-20 bg-slate-300 rounded" />
                    <div className="h-4 w-full bg-[#3730A3]/5 rounded" />
                  </div>
                  <div className="h-24 bg-slate-50 rounded-xl border border-slate-100 p-4 space-y-3">
                    <div className="h-2 w-12 bg-slate-200 rounded" />
                    <div className="h-5 w-20 bg-slate-300 rounded" />
                    <div className="h-4 w-full bg-[#059669]/5 rounded" />
                  </div>
                  <div className="h-24 bg-slate-50 rounded-xl border border-slate-100 p-4 space-y-3">
                    <div className="h-2 w-12 bg-slate-200 rounded" />
                    <div className="h-5 w-20 bg-slate-300 rounded" />
                    <div className="h-4 w-full bg-amber-500/5 rounded" />
                  </div>
                </div>
                <div className="h-40 bg-slate-50 rounded-xl border border-slate-100 relative overflow-hidden">
                  <div className="absolute inset-0 flex items-end p-0">
                    <div className="w-full h-1/2 bg-gradient-to-t from-[#3730A3]/10 to-transparent" />
                  </div>
                  <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 400 100">
                    <path d="M0,80 Q50,20 100,50 T200,30 T300,70 T400,10" fill="none" stroke="#3730A3" strokeWidth="2" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
          {/* Floating Elements */}
          <div className="absolute -top-6 -right-6 bg-white/70 backdrop-blur-xl border border-white/30 p-4 rounded-2xl shadow-xl animate-bounce" style={{ animationDuration: "4s" }}>
            <div className="flex items-center gap-3">
              <div className="bg-[#059669]/10 text-[#059669] p-2 rounded-lg">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Opportunity Score</p>
                <p className="text-lg font-black text-slate-900">+142%</p>
              </div>
            </div>
          </div>
          <div className="absolute -bottom-10 -left-10 bg-white/70 backdrop-blur-xl border border-white/30 p-4 rounded-2xl shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="bg-[#3730A3]/10 text-[#3730A3] p-2 rounded-lg">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">AI Analysis</p>
                <p className="text-sm font-bold text-slate-900">Completed in 2.4s</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
