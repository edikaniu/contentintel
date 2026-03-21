"use client";

import { useEffect, useRef } from "react";

export function Hero() {
  const typewriterRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const target = typewriterRef.current;
    if (!target) return;
    const text = "next.";
    let i = 0;
    const timer = setTimeout(() => {
      const interval = setInterval(() => {
        if (i < text.length) {
          target.textContent += text.charAt(i);
          i++;
        } else {
          clearInterval(interval);
        }
      }, 120);
      return () => clearInterval(interval);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center pt-24 pb-16 px-4 z-10">
      <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
        {/* Left */}
        <div className="landing-scale-reveal">
          <h1 className="font-headline font-extrabold text-4xl sm:text-5xl lg:text-6xl text-white leading-[1.1] tracking-tight mb-6">
            Know exactly what<br />to write{" "}
            <span ref={typewriterRef} className="landing-gradient-text" />
            <span className="landing-typewriter-cursor" />
          </h1>
          <p className="text-lg sm:text-xl text-gray-300 max-w-xl mb-4 leading-relaxed font-light font-body">
            ContentIntel uses AI and real search data to tell your marketing team what content to create, what to refresh, and what&apos;s working &mdash; every week, automatically.
          </p>
          <p className="text-gray-600 mb-8 max-w-lg font-body">
            Connect your existing tools. Get actionable recommendations. Stop guessing.
          </p>
          <div className="flex flex-wrap gap-4 mb-10">
            <a href="/#waitlist" className="landing-gradient-border-btn text-base">Join the Waitlist</a>
            <a href="#how-it-works" className="border border-[#222] hover:border-[#444] text-gray-400 hover:text-white font-medium px-7 py-3.5 rounded-xl text-base transition-colors">
              See how it works <span className="inline-block ml-1">&#8595;</span>
            </a>
          </div>
          {/* Social Proof */}
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-violet-700 border-2 border-[#050505] flex items-center justify-center text-xs text-white font-semibold">S</div>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-lime-400 to-lime-600 border-2 border-[#050505] flex items-center justify-center text-xs text-white font-semibold">M</div>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-purple-600 border-2 border-[#050505] flex items-center justify-center text-xs text-white font-semibold">E</div>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 border-2 border-[#050505] flex items-center justify-center text-xs text-white font-semibold">J</div>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-300 to-violet-500 border-2 border-[#050505] flex items-center justify-center text-xs text-white font-semibold">+</div>
            </div>
            <span className="text-sm text-gray-600 font-body">Trusted by growing teams</span>
          </div>
        </div>

        {/* Right — Dashboard Mockup */}
        <div className="landing-scale-reveal relative" style={{ transitionDelay: "0.15s" }}>
          <div className="landing-dark-card p-5 relative overflow-hidden">
            {/* Mockup title bar */}
            <div className="flex items-center gap-2 mb-5">
              <div className="w-3 h-3 rounded-full bg-red-500/60" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
              <div className="w-3 h-3 rounded-full bg-green-500/60" />
              <span className="ml-3 text-xs text-gray-600 font-mono">contentintel.io/dashboard</span>
            </div>
            {/* Metric cards */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="bg-[#0a0a0a] rounded-lg p-3 border border-[#1a1a1a]">
                <div className="text-xs text-gray-600 mb-1 font-body">Topics Found</div>
                <div className="text-xl font-headline font-bold text-white">142</div>
                <div className="text-xs text-[#A3E635] mt-0.5">+18 this week</div>
              </div>
              <div className="bg-[#0a0a0a] rounded-lg p-3 border border-[#1a1a1a]">
                <div className="text-xs text-gray-600 mb-1 font-body">Health Score</div>
                <div className="text-xl font-headline font-bold text-[#8B5CF6]">87%</div>
                <div className="text-xs text-[#A3E635] mt-0.5">+3.2%</div>
              </div>
              <div className="bg-[#0a0a0a] rounded-lg p-3 border border-[#1a1a1a]">
                <div className="text-xs text-gray-600 mb-1 font-body">Approved</div>
                <div className="text-xl font-headline font-bold text-white">24</div>
                <div className="text-xs text-gray-600 mt-0.5">of 30 this week</div>
              </div>
            </div>
            {/* Chart */}
            <div className="bg-[#0a0a0a] rounded-lg p-4 border border-[#1a1a1a]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-gray-600 font-body">Organic Traffic — Last 12 Weeks</span>
                <span className="text-xs text-[#A3E635] font-medium">+24.5%</span>
              </div>
              <svg viewBox="0 0 400 120" className="w-full h-auto" preserveAspectRatio="none">
                <line x1="0" y1="30" x2="400" y2="30" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                <line x1="0" y1="60" x2="400" y2="60" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                <line x1="0" y1="90" x2="400" y2="90" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                <defs>
                  <linearGradient id="chartFillV" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#A3E635" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#A3E635" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d="M0,95 L33,88 L66,82 L100,78 L133,70 L166,65 L200,58 L233,50 L266,45 L300,38 L333,30 L366,25 L400,18 L400,120 L0,120 Z" fill="url(#chartFillV)" />
                <polyline points="0,95 33,88 66,82 100,78 133,70 166,65 200,58 233,50 266,45 300,38 333,30 366,25 400,18" fill="none" stroke="#A3E635" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="landing-chart-line-animate" />
                <circle cx="400" cy="18" r="4" fill="#A3E635" />
                <circle cx="400" cy="18" r="8" fill="#A3E635" opacity="0.2" />
              </svg>
            </div>
          </div>
          {/* Glow behind mockup */}
          <div className="absolute -inset-4 bg-gradient-to-br from-violet-600/10 via-transparent to-lime-500/5 rounded-2xl blur-2xl -z-10" />
        </div>
      </div>
    </section>
  );
}
