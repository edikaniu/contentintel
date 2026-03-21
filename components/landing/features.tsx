export function Features() {
  return (
    <section id="features" className="py-20 px-4 relative z-10">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16 landing-scale-reveal">
          <h2 className="font-headline font-bold text-3xl sm:text-4xl text-white mb-4">
            Everything your content team needs<br className="hidden sm:block" /> to make <span className="landing-gradient-text">smarter decisions.</span>
          </h2>
        </div>

        {/* 3 main feature cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-6">
          {/* Topic Discovery */}
          <div className="landing-dark-card p-6 landing-scale-reveal hover:scale-[1.02] transition-transform">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-4">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M9 3a6 6 0 104.32 10.13l3.27 3.28a1 1 0 001.42-1.42l-3.28-3.27A6 6 0 009 3z" fill="#8B5CF6" />
              </svg>
            </div>
            <h3 className="font-headline font-bold text-lg text-white mb-2">Topic Discovery Engine</h3>
            <p className="text-sm text-gray-500 mb-5 leading-relaxed font-body">Find what to write next &mdash; backed by data. Our engine analyses search trends, competitor gaps, and keyword clusters to surface high-opportunity topics your team hasn&apos;t covered yet.</p>
            {/* Mini bar chart */}
            <div className="bg-[#0a0a0a] rounded-lg p-3 border border-[#1a1a1a]">
              <div className="flex items-end gap-2 h-20">
                <div className="flex-1 landing-chart-bar rounded-t" style={{ height: "45%", background: "linear-gradient(to top,#6D28D9,#8B5CF6)", animationDelay: "0.1s" }} />
                <div className="flex-1 landing-chart-bar rounded-t" style={{ height: "65%", background: "linear-gradient(to top,#6D28D9,#8B5CF6)", animationDelay: "0.2s" }} />
                <div className="flex-1 landing-chart-bar rounded-t" style={{ height: "40%", background: "linear-gradient(to top,#6D28D9,#8B5CF6)", animationDelay: "0.3s" }} />
                <div className="flex-1 landing-chart-bar rounded-t" style={{ height: "85%", background: "linear-gradient(to top,#7C3AED,#A78BFA)", animationDelay: "0.4s" }} />
                <div className="flex-1 landing-chart-bar rounded-t" style={{ height: "55%", background: "linear-gradient(to top,#6D28D9,#8B5CF6)", animationDelay: "0.5s" }} />
                <div className="flex-1 landing-chart-bar rounded-t" style={{ height: "90%", background: "linear-gradient(to top,#65A30D,#A3E635)", animationDelay: "0.6s" }} />
                <div className="flex-1 landing-chart-bar rounded-t" style={{ height: "70%", background: "linear-gradient(to top,#7C3AED,#A78BFA)", animationDelay: "0.7s" }} />
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-[10px] text-gray-700">Lower opp.</span>
                <span className="text-[10px] text-[#A3E635]/70">Higher opp.</span>
              </div>
            </div>
          </div>

          {/* Content Health */}
          <div className="landing-dark-card p-6 landing-scale-reveal hover:scale-[1.02] transition-transform" style={{ transitionDelay: "0.1s" }}>
            <div className="w-10 h-10 rounded-xl bg-lime-400/10 border border-lime-400/20 flex items-center justify-center mb-4">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M3 10h2l2-6 3 12 2-8 2 4h3" stroke="#A3E635" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </svg>
            </div>
            <h3 className="font-headline font-bold text-lg text-white mb-2">Content Health Monitor</h3>
            <p className="text-sm text-gray-500 mb-5 leading-relaxed font-body">Catch declining content before it costs you traffic. Track every page&apos;s organic performance over time and get alerts when content needs a refresh.</p>
            {/* Progress bars */}
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-[11px] mb-1"><span className="text-gray-600">/blog/seo-guide</span><span className="text-[#A3E635]">Healthy</span></div>
                <div className="h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden"><div className="h-full bg-[#A3E635] rounded-full landing-progress-animate" style={{ width: "92%" }} /></div>
              </div>
              <div>
                <div className="flex justify-between text-[11px] mb-1"><span className="text-gray-600">/blog/content-tips</span><span className="text-yellow-400">Declining</span></div>
                <div className="h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden"><div className="h-full bg-yellow-500 rounded-full landing-progress-animate" style={{ width: "54%", animationDelay: "0.2s" }} /></div>
              </div>
              <div>
                <div className="flex justify-between text-[11px] mb-1"><span className="text-gray-600">/blog/keyword-research</span><span className="text-[#A3E635]">Healthy</span></div>
                <div className="h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden"><div className="h-full bg-[#A3E635] rounded-full landing-progress-animate" style={{ width: "78%", animationDelay: "0.4s" }} /></div>
              </div>
            </div>
          </div>

          {/* Topic Validator */}
          <div className="landing-dark-card p-6 landing-scale-reveal hover:scale-[1.02] transition-transform" style={{ transitionDelay: "0.2s" }}>
            <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mb-4">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M7 10l2 2 4-4" stroke="#A3E635" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="10" cy="10" r="7" stroke="#A3E635" strokeWidth="2" fill="none" />
              </svg>
            </div>
            <h3 className="font-headline font-bold text-lg text-white mb-2">On-Demand Topic Validator</h3>
            <p className="text-sm text-gray-500 mb-5 leading-relaxed font-body">Got a topic idea? Validate it in seconds. Get search volume, difficulty, competitor analysis, and an AI-generated brief before you commit resources.</p>
            {/* Score gauge */}
            <div className="flex items-center justify-center py-2">
              <svg width="100" height="100" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="38" stroke="rgba(255,255,255,0.04)" strokeWidth="6" fill="none" />
                <circle cx="50" cy="50" r="38" stroke="url(#scoreGradV)" strokeWidth="6" fill="none"
                  strokeDasharray="220" strokeDashoffset="44" strokeLinecap="round"
                  transform="rotate(-90 50 50)" className="landing-score-ring" />
                <text x="50" y="46" textAnchor="middle" className="font-headline" fontSize="22" fontWeight="700" fill="white">82</text>
                <text x="50" y="60" textAnchor="middle" fontSize="8" fill="#9ca3af">Opportunity</text>
                <defs>
                  <linearGradient id="scoreGradV" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#8B5CF6" />
                    <stop offset="100%" stopColor="#A3E635" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>
        </div>

        {/* 3 smaller feature cards */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="landing-dark-card p-5 landing-scale-reveal hover:scale-[1.02] transition-transform">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="1" width="6" height="6" rx="1.5" stroke="#8B5CF6" strokeWidth="1.5" fill="none" /><rect x="9" y="1" width="6" height="6" rx="1.5" stroke="#8B5CF6" strokeWidth="1.5" fill="none" /><rect x="1" y="9" width="6" height="6" rx="1.5" stroke="#8B5CF6" strokeWidth="1.5" fill="none" /><rect x="9" y="9" width="6" height="6" rx="1.5" stroke="#8B5CF6" strokeWidth="1.5" fill="none" /></svg>
              </div>
              <h3 className="font-headline font-bold text-white text-sm">Multi-Domain Support</h3>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed font-body">One dashboard for all your websites. Manage multiple domains with isolated data, custom competitors, and independent recommendation pipelines.</p>
          </div>
          <div className="landing-dark-card p-5 landing-scale-reveal hover:scale-[1.02] transition-transform" style={{ transitionDelay: "0.1s" }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-lime-400/10 border border-lime-400/20 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 4h12M2 8h12M2 12h8" stroke="#A3E635" strokeWidth="1.5" strokeLinecap="round" /><path d="M12 10l2 2-2 2" stroke="#A3E635" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" /></svg>
              </div>
              <h3 className="font-headline font-bold text-white text-sm">Approval Workflow</h3>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed font-body">From recommendation to assignment in two clicks. Review, approve, or reject topics with your team on a shared dashboard with full audit trail.</p>
          </div>
          <div className="landing-dark-card p-5 landing-scale-reveal hover:scale-[1.02] transition-transform" style={{ transitionDelay: "0.2s" }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1v4l3-1.5M8 1L5 3.5 8 5" stroke="#fb7185" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" /><rect x="2" y="7" width="12" height="7" rx="2" stroke="#fb7185" strokeWidth="1.5" fill="none" /><path d="M6 10h4" stroke="#fb7185" strokeWidth="1.5" strokeLinecap="round" /></svg>
              </div>
              <h3 className="font-headline font-bold text-white text-sm">No Vendor Lock-In</h3>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed font-body">Your tools, your data. ContentIntel integrates with your existing stack and lets you export everything. Switch data sources anytime.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
