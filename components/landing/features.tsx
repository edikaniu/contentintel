export function Features() {
  return (
    <section id="features" className="max-w-[1200px] mx-auto px-6 py-32">
      <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
        <h2 className="text-4xl font-black text-slate-900 tracking-[-0.02em]">Beyond Static Dashboards: Real Insight</h2>
        <p className="text-lg text-slate-600">
          Why settle for basic metrics when you can have live behavioral tracking? Our platform provides
          real-time feedback loops for every piece of content.
        </p>
      </div>
      <div className="grid md:grid-cols-3 gap-8">
        {/* Card 1: Micro-Charts */}
        <div className="p-8 bg-white border border-slate-200 rounded-3xl shadow-[0_0_20px_rgba(55,48,163,0.15)] border-[#3730A3]/30 transition-all group">
          <div className="mb-6 h-12 w-full bg-slate-50 rounded-lg flex items-center px-4 overflow-hidden relative">
            <div className="absolute inset-y-0 left-0 w-1/3 bg-[#3730A3]/10" />
            <span className="text-[10px] font-bold text-[#3730A3] relative z-10">ENGAGEMENT VELOCITY</span>
          </div>
          <div className="h-32 mb-6 flex items-end gap-1">
            <div className="flex-1 bg-slate-100 h-1/4 rounded-t-sm group-hover:bg-[#3730A3]/20 transition-colors" />
            <div className="flex-1 bg-slate-100 h-2/4 rounded-t-sm group-hover:bg-[#3730A3]/40 transition-colors" />
            <div className="flex-1 bg-slate-100 h-1/3 rounded-t-sm group-hover:bg-[#3730A3]/20 transition-colors" />
            <div className="flex-1 bg-slate-100 h-3/4 rounded-t-sm group-hover:bg-[#3730A3]/60 transition-colors" />
            <div className="flex-1 bg-slate-100 h-1/2 rounded-t-sm group-hover:bg-[#3730A3]/30 transition-colors" />
            <div className="flex-1 bg-[#3730A3] h-full rounded-t-sm shadow-lg shadow-[#3730A3]/20" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Topic Discovery</h3>
          <p className="text-slate-600 text-sm leading-relaxed">
            Integrated sparklines for instant trend recognition. Spot emerging content opportunities before your competitors.
          </p>
        </div>

        {/* Card 2: Status Indicators */}
        <div className="p-8 bg-white border border-slate-200 rounded-3xl hover:border-[#3730A3]/20 transition-all group">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#059669]" />
              <span className="text-[10px] font-bold text-slate-400">STATUS: LIVE MONITORING</span>
            </div>
            <span className="text-[10px] font-bold text-[#059669]">98.4% HEALTHY</span>
          </div>
          <div className="space-y-4 mb-6 pt-4">
            <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full w-4/5 bg-[#059669]" />
            </div>
            <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full w-2/3 bg-[#059669]/60" />
            </div>
            <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full w-1/2 bg-[#059669]/30" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Content Health</h3>
          <p className="text-slate-600 text-sm leading-relaxed">
            Live status updates for your content portfolio. Always know which pages need attention before traffic drops.
          </p>
        </div>

        {/* Card 3: Deep Indigo Accents */}
        <div className="p-8 bg-white border border-slate-200 rounded-3xl hover:border-[#3730A3]/20 transition-all group">
          <div className="mb-6 flex justify-center">
            <div className="relative w-24 h-24 rounded-full border-[6px] border-[#3730A3]/10 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-[6px] border-[#3730A3] border-t-transparent -rotate-45" />
              <span className="text-lg font-black text-[#3730A3]">82%</span>
            </div>
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">On-Demand Validation</h3>
          <p className="text-slate-600 text-sm leading-relaxed">
            Validate any topic idea instantly against keyword metrics, competitor analysis, and AI-generated angles.
          </p>
        </div>
      </div>
    </section>
  );
}
