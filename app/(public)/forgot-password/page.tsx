"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setSent(true);
      } else {
        const data = await res.json();
        setError(data.error || "Something went wrong");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen flex flex-col bg-[#050505] relative overflow-hidden">
        {/* Radial glow */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.08),transparent_60%)]" />
        {/* Noise overlay */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E\")", backgroundRepeat: "repeat" }} />

        <header className="relative z-10 flex items-center px-6 py-6 lg:px-10">
          <Link href="/" className="flex items-center gap-2.5 text-white">
            <div className="w-2 h-2 rounded-full bg-[#8B5CF6]" />
            <span className="text-xl font-headline tracking-tight">ContentIntel</span>
          </Link>
        </header>

        <main className="relative z-10 flex-1 flex items-center justify-center px-4 pb-20">
          <div className="w-full max-w-[420px] bg-[#111111] border border-[#222222] rounded-2xl p-8">
            <div className="flex flex-col items-center text-center mb-8">
              <div className="w-12 h-12 bg-[#A3E635]/10 rounded-full flex items-center justify-center text-[#A3E635] mb-4">
                <Mail className="w-6 h-6" />
              </div>
              <h1 className="font-headline text-white text-2xl font-bold mb-2">Check your email</h1>
              <p className="font-body text-gray-500 text-sm leading-relaxed">
                If an account exists with that email, we&apos;ve sent a password reset link.
              </p>
            </div>
            <div className="text-center">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-sm font-medium text-[#8B5CF6] hover:text-[#8B5CF6]/80 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to sign in
              </Link>
            </div>
          </div>
        </main>

        <footer className="relative z-10 py-6 text-center text-gray-600 text-xs">
          <p>&copy; {new Date().getFullYear()} ContentIntel. All rights reserved.</p>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#050505] relative overflow-hidden">
      {/* Radial glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.08),transparent_60%)]" />
      {/* Noise overlay */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E\")", backgroundRepeat: "repeat" }} />

      <header className="relative z-10 flex items-center px-6 py-6 lg:px-10">
        <Link href="/" className="flex items-center gap-2.5 text-white">
          <div className="w-2 h-2 rounded-full bg-[#8B5CF6]" />
          <span className="text-xl font-headline tracking-tight">ContentIntel</span>
        </Link>
      </header>

      <main className="relative z-10 flex-1 flex items-center justify-center px-4 pb-20">
        <div className="w-full max-w-[420px] bg-[#111111] border border-[#222222] rounded-2xl p-8">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-12 h-12 bg-[#8B5CF6]/10 rounded-full flex items-center justify-center text-[#8B5CF6] mb-4">
              <Mail className="w-6 h-6" />
            </div>
            <h1 className="font-headline text-white text-2xl font-bold mb-2">Reset your password</h1>
            <p className="font-body text-gray-500 text-sm leading-relaxed">
              Enter your email and we&apos;ll send you a reset link.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium font-body text-gray-500">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="block w-full px-4 py-3 rounded-xl border border-[#222] bg-[#0a0a0a] text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all text-sm"
                placeholder="you@company.com"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="landing-gradient-border-btn w-full !py-3 disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send reset link"}
            </button>
          </form>

          <div className="mt-8 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-sm font-medium text-[#8B5CF6] hover:text-[#8B5CF6]/80 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to sign in
            </Link>
          </div>
        </div>
      </main>

      <footer className="relative z-10 py-6 text-center text-gray-600 text-xs">
        <p>&copy; {new Date().getFullYear()} ContentIntel. All rights reserved.</p>
      </footer>
    </div>
  );
}
