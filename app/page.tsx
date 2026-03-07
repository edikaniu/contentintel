import Link from "next/link";
import { Star } from "lucide-react";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Features } from "@/components/landing/features";
import { Pricing } from "@/components/landing/pricing";
import { WaitlistForm } from "@/components/landing/waitlist-form";

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#F8FAFC] text-slate-900" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Grain overlay */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none z-0" />

      {/* Hero gradient background */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background: "radial-gradient(circle at 0% 0%, rgba(55,48,163,0.08) 0%, transparent 50%), radial-gradient(circle at 100% 100%, rgba(5,150,105,0.05) 0%, transparent 50%), #F8FAFC",
        }}
      />

      {/* Navigation */}
      <header className="relative z-50 max-w-[1200px] mx-auto px-6 py-6">
        <nav className="flex items-center justify-between bg-white/70 backdrop-blur-xl border border-white/30 px-6 py-3 rounded-full shadow-sm">
          <div className="flex items-center gap-2">
            <div className="bg-[#3730A3] p-1.5 rounded-lg">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 48 48">
                <path clipRule="evenodd" d="M24 4H6V17.3333V30.6667H24V44H42V30.6667V17.3333H24V4Z" fill="currentColor" fillRule="evenodd" />
              </svg>
            </div>
            <span className="text-xl font-extrabold tracking-tight text-slate-900">ContentIntel</span>
          </div>
          <div className="hidden md:flex items-center gap-10">
            <a className="text-sm font-semibold text-slate-600 hover:text-[#3730A3] transition-colors" href="#features">Features</a>
            <a className="text-sm font-semibold text-slate-600 hover:text-[#3730A3] transition-colors" href="#how-it-works">How It Works</a>
            <a className="text-sm font-semibold text-slate-600 hover:text-[#3730A3] transition-colors" href="#pricing">Pricing</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="px-5 py-2 text-sm font-bold text-slate-700 hover:text-[#3730A3] transition-colors">
              Sign In
            </Link>
            <a href="#waitlist" className="bg-[#3730A3] hover:bg-[#3730A3]/90 text-white px-6 py-2.5 rounded-full text-sm font-bold shadow-lg shadow-[#3730A3]/20 transition-all active:scale-95">
              Join Waitlist
            </a>
          </div>
        </nav>
      </header>

      <Hero />

      {/* Stats Section */}
      <section className="max-w-[1200px] mx-auto px-6 py-20 border-y border-slate-200 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="space-y-2">
            <p className="text-4xl font-black text-slate-900 tracking-[-0.02em]">5+</p>
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest">Data Sources</p>
            <div className="h-1 w-12 bg-[#3730A3] rounded-full" />
          </div>
          <div className="space-y-2">
            <p className="text-4xl font-black text-slate-900 tracking-[-0.02em]">AI</p>
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest">Powered Insights</p>
            <div className="h-1 w-12 bg-[#059669] rounded-full" />
          </div>
          <div className="space-y-2">
            <p className="text-4xl font-black text-slate-900 tracking-[-0.02em]">Weekly</p>
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest">Recommendations</p>
            <div className="h-1 w-12 bg-[#3730A3] rounded-full" />
          </div>
          <div className="space-y-2">
            <p className="text-4xl font-black text-slate-900 tracking-[-0.02em]">1-Click</p>
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest">Integrations</p>
            <div className="h-1 w-12 bg-[#059669] rounded-full" />
          </div>
        </div>
      </section>

      <Features />
      <HowItWorks />
      <Pricing />

      {/* Testimonials */}
      <section className="max-w-[1200px] mx-auto px-6 py-24 border-t border-slate-100 relative z-10">
        <div className="text-center mb-16 space-y-4">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#3730A3]">Testimonials</span>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900">Trusted by the best content teams</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {[
            {
              quote: "ContentIntel has completely transformed our editorial workflow. We no longer guess what topics will perform; we have the data to back every decision.",
              author: "Sarah Chen",
              role: "Head of Content at TechFlow",
            },
            {
              quote: "The content health alerts are incredibly valuable. We caught a traffic decline within hours and fixed it before it snowballed. Best investment this year.",
              author: "Marcus Thorne",
              role: "VP Marketing at SaaS Corp",
            },
            {
              quote: "Integrations were seamless. We were up and running with our GA4 and Search Console data in under 15 minutes. The onboarding wizard is brilliant.",
              author: "Elena Rodriguez",
              role: "Growth Director at Pulse Media",
            },
          ].map((testimonial, i) => (
            <div key={i} className="bg-white p-8 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="space-y-4">
                <div className="flex gap-0.5 text-[#059669]">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <p className="text-slate-600 leading-relaxed italic">&ldquo;{testimonial.quote}&rdquo;</p>
              </div>
              <div className="mt-8 flex items-center gap-4 border-t border-slate-50 pt-6">
                <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-sm font-bold text-slate-500">
                  {testimonial.author.split(" ").map(n => n[0]).join("")}
                </div>
                <div>
                  <p className="font-bold text-slate-900">{testimonial.author}</p>
                  <p className="text-xs text-slate-500">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <WaitlistForm />

      {/* Footer */}
      <footer className="max-w-[1200px] mx-auto px-6 py-12 border-t border-slate-200 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="bg-[#3730A3] p-1 rounded-lg">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 48 48">
                <path clipRule="evenodd" d="M24 4H6V17.3333V30.6667H24V44H42V30.6667V17.3333H24V4Z" fill="currentColor" fillRule="evenodd" />
              </svg>
            </div>
            <span className="text-lg font-extrabold tracking-tight text-slate-900">ContentIntel</span>
          </div>
          <div className="flex gap-10">
            <Link href="/terms" className="text-sm font-semibold text-slate-500 hover:text-[#3730A3]">Terms</Link>
            <Link href="/privacy" className="text-sm font-semibold text-slate-500 hover:text-[#3730A3]">Privacy</Link>
          </div>
          <p className="text-sm text-slate-400 font-medium">
            &copy; {new Date().getFullYear()} ContentIntel Inc.
          </p>
        </div>
      </footer>
    </div>
  );
}
