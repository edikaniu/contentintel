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
      <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
        <header className="flex items-center px-6 py-6 lg:px-10">
          <Link href="/" className="flex items-center gap-2 text-slate-900">
            <div className="w-8 h-8 bg-[#3730A3] rounded-lg flex items-center justify-center text-white">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 48 48">
                <path clipRule="evenodd" d="M24 4H6V17.3333V30.6667H24V44H42V30.6667V17.3333H24V4Z" fill="currentColor" fillRule="evenodd" />
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight">ContentIntel</span>
          </Link>
        </header>
        <main className="flex-1 flex items-center justify-center px-4 pb-20">
          <div className="w-full max-w-[420px] bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <div className="flex flex-col items-center text-center mb-8">
              <div className="w-12 h-12 bg-[#059669]/10 rounded-full flex items-center justify-center text-[#059669] mb-4">
                <Mail className="w-6 h-6" />
              </div>
              <h1 className="text-slate-900 text-2xl font-bold mb-2">Check your email</h1>
              <p className="text-slate-500 text-sm leading-relaxed">
                If an account exists with that email, we&apos;ve sent a password reset link.
              </p>
            </div>
            <div className="text-center">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-sm font-medium text-[#3730A3] hover:text-[#3730A3]/80 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to sign in
              </Link>
            </div>
          </div>
        </main>
        <footer className="py-6 text-center text-slate-400 text-xs">
          <p>&copy; {new Date().getFullYear()} ContentIntel. All rights reserved.</p>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <header className="flex items-center px-6 py-6 lg:px-10">
        <Link href="/" className="flex items-center gap-2 text-slate-900">
          <div className="w-8 h-8 bg-[#3730A3] rounded-lg flex items-center justify-center text-white">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 48 48">
              <path clipRule="evenodd" d="M24 4H6V17.3333V30.6667H24V44H42V30.6667V17.3333H24V4Z" fill="currentColor" fillRule="evenodd" />
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight">ContentIntel</span>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 pb-20">
        <div className="w-full max-w-[420px] bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-12 h-12 bg-[#3730A3]/10 rounded-full flex items-center justify-center text-[#3730A3] mb-4">
              <Mail className="w-6 h-6" />
            </div>
            <h1 className="text-slate-900 text-2xl font-bold mb-2">Reset your password</h1>
            <p className="text-slate-500 text-sm leading-relaxed">
              Enter your email and we&apos;ll send you a reset link.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="block w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#3730A3]/20 focus:border-[#3730A3] transition-all text-sm"
                placeholder="you@company.com"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center py-3 px-4 bg-[#3730A3] hover:bg-[#3730A3]/90 text-white text-sm font-semibold rounded-xl transition-colors shadow-md shadow-[#3730A3]/20 disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send reset link"}
            </button>
          </form>

          <div className="mt-8 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-sm font-medium text-[#3730A3] hover:text-[#3730A3]/80 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to sign in
            </Link>
          </div>
        </div>
      </main>

      <footer className="py-6 text-center text-slate-400 text-xs">
        <p>&copy; {new Date().getFullYear()} ContentIntel. All rights reserved.</p>
      </footer>
    </div>
  );
}
