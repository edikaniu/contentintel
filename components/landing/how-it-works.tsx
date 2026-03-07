import { BarChart3, LineChart, FileText } from "lucide-react";

export function HowItWorks() {
  return (
    <section id="how-it-works" className="max-w-[1200px] mx-auto px-6 py-32 bg-slate-50/50 border-y border-slate-200">
      <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
        <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#3730A3]">How it Works</span>
        <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-[-0.02em] italic">
          From raw data to revenue-generating strategy in minutes.
        </h2>
      </div>
      <div className="grid lg:grid-cols-3 gap-8 relative">
        {/* Step 1 */}
        <div className="relative group">
          <div className="absolute -top-4 -left-4 w-10 h-10 rounded-full bg-[#3730A3] text-white flex items-center justify-center font-black z-10 shadow-lg">1</div>
          <div className="bg-white/70 backdrop-blur-xl border border-white/30 p-8 rounded-3xl h-full hover:border-[#3730A3]/30 transition-all hover:shadow-xl">
            <div className="mb-8 flex justify-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center border border-slate-100 group-hover:scale-110 transition-transform">
                <BarChart3 className="w-5 h-5 text-[#3730A3]" />
              </div>
              <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center border border-slate-100 group-hover:scale-110 transition-transform delay-75">
                <LineChart className="w-5 h-5 text-[#059669]" />
              </div>
              <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center border border-slate-100 group-hover:scale-110 transition-transform delay-150">
                <FileText className="w-5 h-5 text-amber-500" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Connect Your Stack</h3>
            <p className="text-slate-600 text-sm leading-relaxed">One-click integration with GSC, GA4, and your CMS. We ingest your data securely without manual exports.</p>
          </div>
          <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-0.5 bg-slate-200" />
        </div>

        {/* Step 2 */}
        <div className="relative group">
          <div className="absolute -top-4 -left-4 w-10 h-10 rounded-full bg-[#3730A3] text-white flex items-center justify-center font-black z-10 shadow-lg">2</div>
          <div className="bg-white/70 backdrop-blur-xl border border-white/30 p-8 rounded-3xl h-full hover:border-[#3730A3]/30 transition-all hover:shadow-xl">
            <div className="mb-8 space-y-4">
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full w-2/3 bg-[#3730A3] animate-pulse" />
              </div>
              <div className="flex justify-between text-[10px] font-bold text-slate-400">
                <span>ANALYZING HISTORICAL DATA...</span>
                <span className="text-[#3730A3]">68%</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                <div className="h-6 bg-slate-100 rounded animate-pulse" />
                <div className="h-6 bg-slate-100 rounded animate-pulse" style={{ animationDelay: "75ms" }} />
                <div className="h-6 bg-slate-100 rounded animate-pulse" style={{ animationDelay: "150ms" }} />
                <div className="h-6 bg-slate-100 rounded animate-pulse" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">AI Content Audit</h3>
            <p className="text-slate-600 text-sm leading-relaxed">Our AI scans every asset to identify content gaps, decaying traffic, and high-intent opportunities.</p>
          </div>
          <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-0.5 bg-slate-200" />
        </div>

        {/* Step 3 */}
        <div className="relative group">
          <div className="absolute -top-4 -left-4 w-10 h-10 rounded-full bg-[#059669] text-white flex items-center justify-center font-black z-10 shadow-lg">3</div>
          <div className="bg-white/70 backdrop-blur-xl border border-white/30 p-8 rounded-3xl h-full hover:border-[#3730A3]/30 transition-all hover:shadow-xl">
            <div className="mb-8 p-3 bg-white rounded-xl shadow-sm border border-slate-100 space-y-3">
              <div className="flex justify-between items-center">
                <div className="h-3 w-20 bg-slate-200 rounded" />
                <span className="px-3 py-1 bg-[#059669]/10 text-[#059669] text-[10px] font-bold rounded-full">APPROVE</span>
              </div>
              <div className="h-0.5 w-full bg-slate-50" />
              <div className="flex justify-between items-center">
                <div className="h-3 w-24 bg-slate-200 rounded" />
                <span className="px-3 py-1 bg-[#059669]/10 text-[#059669] text-[10px] font-bold rounded-full">APPROVE</span>
              </div>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Execute &amp; Scale</h3>
            <p className="text-slate-600 text-sm leading-relaxed">Receive an automated roadmap. Approve AI-generated briefs and see your content strategy come to life.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
