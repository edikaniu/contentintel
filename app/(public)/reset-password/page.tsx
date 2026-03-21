"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#050505]">
        <p className="font-body text-gray-500">Loading...</p>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!token) {
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
          <div className="w-full max-w-[420px] bg-[#111111] border border-[#222222] rounded-2xl p-8 text-center">
            <h2 className="font-headline text-white text-xl font-bold mb-2">Invalid Link</h2>
            <p className="font-body text-gray-500 mb-4">This password reset link is invalid or has expired.</p>
            <Link href="/forgot-password" className="text-[#8B5CF6] hover:text-[#8B5CF6]/80 text-sm transition-colors">
              Request a new reset link
            </Link>
          </div>
        </main>

        <footer className="relative z-10 py-6 text-center text-gray-600 text-xs">
          <p>&copy; {new Date().getFullYear()} ContentIntel. All rights reserved.</p>
        </footer>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
      } else {
        setError(data.error || "Something went wrong");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
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
          <div className="w-full max-w-[420px] bg-[#111111] border border-[#222222] rounded-2xl p-8 text-center">
            <h2 className="font-headline text-white text-xl font-bold mb-2">Password Updated</h2>
            <p className="font-body text-gray-500 mb-6">Your password has been reset successfully.</p>
            <Link
              href="/login"
              className="landing-gradient-border-btn inline-block"
            >
              Sign In
            </Link>
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
        <div className="w-full max-w-[420px]">
          <div className="text-center mb-8">
            <h1 className="font-headline text-white text-2xl font-bold">Set a new password</h1>
          </div>

          <div className="bg-[#111111] border border-[#222222] rounded-2xl p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="password" className="block text-sm font-medium font-body text-gray-500 mb-2">
                  New Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full px-4 py-3 rounded-xl border border-[#222] bg-[#0a0a0a] text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all text-sm"
                  placeholder="Minimum 8 characters"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium font-body text-gray-500 mb-2">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full px-4 py-3 rounded-xl border border-[#222] bg-[#0a0a0a] text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="landing-gradient-border-btn w-full !py-3 disabled:opacity-50"
              >
                {loading ? "Resetting..." : "Reset Password"}
              </button>
            </form>
          </div>
        </div>
      </main>

      <footer className="relative z-10 py-6 text-center text-gray-600 text-xs">
        <p>&copy; {new Date().getFullYear()} ContentIntel. All rights reserved.</p>
      </footer>
    </div>
  );
}
