import Link from "next/link";
import { Navbar } from "@/components/landing/navbar";
import { Hero } from "@/components/landing/hero";
import { Features } from "@/components/landing/features";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Pricing } from "@/components/landing/pricing";
import { WaitlistForm } from "@/components/landing/waitlist-form";
import { ScrollObserver } from "@/components/landing/scroll-observer";

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#050505] text-gray-400 font-body antialiased">
      {/* Background glow */}
      <div
        className="fixed pointer-events-none z-0"
        style={{
          top: "-20%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "1200px",
          height: "1200px",
          background: "radial-gradient(ellipse at center, rgba(45,27,105,0.35) 0%, rgba(45,27,105,0.1) 40%, transparent 70%)",
        }}
      />
      {/* Noise texture */}
      <div
        className="fixed inset-0 pointer-events-none z-[1] opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "256px 256px",
        }}
      />

      <ScrollObserver />
      <Navbar />
      <Hero />

      {/* Stats Section */}
      <section className="py-16 px-4 relative z-10">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          <div className="landing-scale-reveal text-center">
            <div className="font-headline font-extrabold text-3xl sm:text-4xl text-white mb-2">5+</div>
            <div className="text-sm text-gray-500 mb-3 font-body">Data Sources</div>
            <div className="landing-violet-bar w-12 mx-auto" />
          </div>
          <div className="landing-scale-reveal text-center" style={{ transitionDelay: "0.1s" }}>
            <div className="font-headline font-extrabold text-3xl sm:text-4xl landing-gradient-text mb-2">AI</div>
            <div className="text-sm text-gray-500 mb-3 font-body">Powered Insights</div>
            <div className="landing-violet-bar w-12 mx-auto" />
          </div>
          <div className="landing-scale-reveal text-center" style={{ transitionDelay: "0.2s" }}>
            <div className="font-headline font-extrabold text-3xl sm:text-4xl text-white mb-2">Weekly</div>
            <div className="text-sm text-gray-500 mb-3 font-body">Recommendations</div>
            <div className="landing-violet-bar w-12 mx-auto" />
          </div>
          <div className="landing-scale-reveal text-center" style={{ transitionDelay: "0.3s" }}>
            <div className="font-headline font-extrabold text-3xl sm:text-4xl text-white mb-2">1-Click</div>
            <div className="text-sm text-gray-500 mb-3 font-body">Integrations</div>
            <div className="landing-violet-bar w-12 mx-auto" />
          </div>
        </div>
      </section>

      <Features />
      <HowItWorks />

      {/* Built For Section */}
      <section className="py-20 px-4 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 landing-scale-reveal">
            <h2 className="font-headline font-bold text-3xl sm:text-4xl text-white mb-4">
              Built for marketing teams that<br className="hidden sm:block" /> <span className="landing-gradient-text">publish at scale.</span>
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            <div className="landing-dark-card p-6 landing-scale-reveal hover:scale-[1.02] transition-transform">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M4 15l3-3h6l3 3M10 3v9M7 6l3-3 3 3" stroke="#8B5CF6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" /></svg>
                </div>
                <h3 className="font-headline font-bold text-lg text-white">Content Teams</h3>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed font-body">Stop spending hours on keyword research. Get a prioritised list of what to write every Monday morning.</p>
            </div>

            <div className="landing-dark-card p-6 landing-scale-reveal hover:scale-[1.02] transition-transform" style={{ transitionDelay: "0.1s" }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-lime-400/10 border border-lime-400/20 flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="8" cy="8" r="5" stroke="#A3E635" strokeWidth="1.5" fill="none" /><path d="M12 12l5 5" stroke="#A3E635" strokeWidth="1.5" strokeLinecap="round" /><path d="M6 8h4M8 6v4" stroke="#A3E635" strokeWidth="1.5" strokeLinecap="round" /></svg>
                </div>
                <h3 className="font-headline font-bold text-lg text-white">SEO Teams</h3>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed font-body">Surface striking-distance keywords, track position changes, and spot content refresh opportunities automatically.</p>
            </div>

            <div className="landing-dark-card p-6 landing-scale-reveal hover:scale-[1.02] transition-transform" style={{ transitionDelay: "0.2s" }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 14l4-4 3 3 7-7" stroke="#A3E635" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" /><path d="M13 6h4v4" stroke="#A3E635" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" /></svg>
                </div>
                <h3 className="font-headline font-bold text-lg text-white">Marketing Leaders</h3>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed font-body">See the full picture &mdash; what&apos;s performing, what&apos;s declining, and where the biggest content opportunities are &mdash; without digging through five tools.</p>
            </div>

            <div className="landing-dark-card p-6 landing-scale-reveal hover:scale-[1.02] transition-transform" style={{ transitionDelay: "0.3s" }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="3" y="3" width="6" height="6" rx="1" stroke="#8B5CF6" strokeWidth="1.5" fill="none" /><rect x="11" y="3" width="6" height="6" rx="1" stroke="#8B5CF6" strokeWidth="1.5" fill="none" /><rect x="3" y="11" width="6" height="6" rx="1" stroke="#8B5CF6" strokeWidth="1.5" fill="none" /><rect x="11" y="11" width="6" height="6" rx="1" stroke="#8B5CF6" strokeWidth="1.5" fill="none" /></svg>
                </div>
                <h3 className="font-headline font-bold text-lg text-white">Agencies</h3>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed font-body">Manage multiple client domains from one workspace. Each client gets isolated data, custom competitors, and their own recommendation pipeline.</p>
            </div>
          </div>
        </div>
      </section>

      <Pricing />

      {/* Testimonials */}
      <section className="py-20 px-4 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14 landing-scale-reveal">
            <h2 className="font-headline font-bold text-3xl sm:text-4xl text-white">
              Trusted by the best <span className="landing-gradient-text">content teams</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                quote: "ContentIntel has completely transformed our editorial workflow. We used to spend an entire day every sprint planning what to write. Now we get a prioritised list every Monday morning. The team just picks topics and starts writing.",
                author: "Sarah Chen",
                role: "Head of Content at TechFlow",
                initials: "SC",
                gradient: "from-violet-500 to-purple-700",
              },
              {
                quote: "The content health alerts are incredibly valuable. Last month we caught three high-traffic posts that were starting to decline in rankings. We refreshed them in time and actually saw traffic go up. That's revenue we would have lost.",
                author: "Marcus Thorne",
                role: "VP Marketing at SaaS Corp",
                initials: "MT",
                gradient: "from-lime-400 to-green-600",
              },
              {
                quote: "Integrations were seamless. We connected DataforSEO and Search Console in about 10 minutes and had our first batch of recommendations the next Monday. The approval workflow means nothing gets published without sign-off.",
                author: "Elena Rodriguez",
                role: "Growth Director at Pulse Media",
                initials: "ER",
                gradient: "from-rose-500 to-pink-700",
              },
            ].map((t, i) => (
              <div key={i} className="landing-dark-card p-6 landing-scale-reveal hover:scale-[1.02] transition-transform" style={{ transitionDelay: `${i * 0.1}s` }}>
                <div className="flex gap-1 mb-4 landing-star-lime">
                  {[...Array(5)].map((_, j) => (
                    <svg key={j} width="16" height="16" viewBox="0 0 16 16"><path d="M8 1l2.24 4.54 5.01.73-3.63 3.53.86 4.99L8 12.27l-4.48 2.52.86-4.99L.75 6.27l5.01-.73L8 1z" /></svg>
                  ))}
                </div>
                <p className="text-sm text-gray-400 leading-relaxed mb-5 font-body">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${t.gradient} flex items-center justify-center text-xs text-white font-bold`}>{t.initials}</div>
                  <div>
                    <div className="text-sm text-white font-medium">{t.author}</div>
                    <div className="text-xs text-gray-600 font-body">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <WaitlistForm />

      {/* Footer */}
      <footer className="border-t border-[#181818] py-14 px-4 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="flex items-center gap-2 mb-4">
                <span className="w-2 h-2 rounded-full bg-[#8B5CF6] inline-block" />
                <span className="font-headline font-bold text-white text-base">ContentIntel</span>
              </Link>
              <p className="text-sm text-gray-600 leading-relaxed font-body">AI-powered content intelligence for marketing teams.</p>
            </div>
            <div>
              <h4 className="font-headline font-bold text-sm text-white mb-4">Product</h4>
              <ul className="space-y-2.5">
                <li><a href="#features" className="text-sm text-gray-600 hover:text-gray-400 transition-colors font-body">Features</a></li>
                <li><a href="#pricing" className="text-sm text-gray-600 hover:text-gray-400 transition-colors font-body">Pricing</a></li>
                <li><Link href="/login" className="text-sm text-gray-600 hover:text-gray-400 transition-colors font-body">Login</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-headline font-bold text-sm text-white mb-4">Legal</h4>
              <ul className="space-y-2.5">
                <li><Link href="/terms" className="text-sm text-gray-600 hover:text-gray-400 transition-colors font-body">Terms of Service</Link></li>
                <li><Link href="/privacy" className="text-sm text-gray-600 hover:text-gray-400 transition-colors font-body">Privacy Policy</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-headline font-bold text-sm text-white mb-4">Contact</h4>
              <a href="mailto:hello@contentintel.io" className="text-sm text-gray-600 hover:text-gray-400 transition-colors font-body">hello@contentintel.io</a>
            </div>
          </div>
          <div className="border-t border-[#181818] pt-6 text-center">
            <p className="text-xs text-gray-700 font-body">&copy; {new Date().getFullYear()} ContentIntel. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
