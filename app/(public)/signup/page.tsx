"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { User, Mail, Lock, Building2, ArrowRight } from "lucide-react";

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]"><p className="text-slate-500">Loading...</p></div>}>
      <SignupForm />
    </Suspense>
  );
}

function SignupForm() {
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("invite") || searchParams.get("token");
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [orgName, setOrgName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(!inviteToken);
  const [closedBeta, setClosedBeta] = useState(false);

  // Check signup access from server when no invite token
  useEffect(() => {
    if (inviteToken) return;
    fetch("/api/auth/signup-access")
      .then((res) => res.json())
      .then((data) => {
        setClosedBeta(!data.open);
      })
      .catch(() => {
        setClosedBeta(true);
      })
      .finally(() => setCheckingAccess(false));
  }, [inviteToken]);

  if (checkingAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <p className="text-slate-500">Loading...</p>
      </div>
    );
  }

  // If no invite token and closed beta, show waitlist message
  if (!inviteToken && closedBeta) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
        <header className="w-full flex justify-center py-8">
          <div className="flex items-center gap-2">
            <div className="bg-[#3730A3] p-1.5 rounded-lg text-white">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 48 48">
                <path clipRule="evenodd" d="M24 4H6V17.3333V30.6667H24V44H42V30.6667V17.3333H24V4Z" fill="currentColor" fillRule="evenodd" />
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">ContentIntel</span>
          </div>
        </header>
        <main className="flex-1 flex items-start justify-center px-4 pb-12">
          <div className="w-full max-w-[420px] bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
            <h1 className="text-2xl font-bold text-slate-900 mb-4">Closed Beta</h1>
            <p className="text-slate-600 mb-6">
              We&apos;re currently in closed beta. Join the waitlist to get early access.
            </p>
            <Link
              href="/#waitlist"
              className="inline-block bg-[#3730A3] text-white px-6 py-3 rounded-lg hover:bg-[#3730A3]/90 font-semibold transition-all"
            >
              Join the Waitlist
            </Link>
          </div>
        </main>
      </div>
    );
  }

  function getPasswordStrength(): { width: string; label: string; color: string } {
    if (password.length === 0) return { width: "w-0", label: "", color: "" };
    if (password.length < 6) return { width: "w-1/4", label: "Weak", color: "bg-red-500 text-red-500" };
    if (password.length < 8) return { width: "w-1/2", label: "Fair", color: "bg-amber-500 text-amber-500" };
    if (password.length < 12) return { width: "w-2/3", label: "Strong", color: "bg-[#3730A3] text-[#3730A3]" };
    return { width: "w-full", label: "Very strong", color: "bg-[#059669] text-[#059669]" };
  }

  const strength = getPasswordStrength();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          orgName,
          inviteToken,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Signup failed");
        return;
      }

      // Auto-login after signup
      const signInResult = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (signInResult?.ok) {
        router.push("/dashboard");
      } else {
        router.push("/login");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900">
      <header className="w-full flex justify-center py-8">
        <div className="flex items-center gap-2">
          <div className="bg-[#3730A3] p-1.5 rounded-lg text-white">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 48 48">
              <path clipRule="evenodd" d="M24 4H6V17.3333V30.6667H24V44H42V30.6667V17.3333H24V4Z" fill="currentColor" fillRule="evenodd" />
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">ContentIntel</span>
        </div>
      </header>

      <main className="flex-1 flex items-start justify-center px-4 pb-12">
        <div className="w-full max-w-[420px] bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Create your account</h1>
            <p className="text-sm text-slate-500">Set up your ContentIntel workspace</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Full name</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#3730A3] transition-colors">
                  <User className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="block w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-[#3730A3]/20 focus:border-[#3730A3] outline-none transition-all text-sm"
                  placeholder="Jane Smith"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Email address</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#3730A3] transition-colors">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="block w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-[#3730A3]/20 focus:border-[#3730A3] outline-none transition-all text-sm"
                  placeholder="you@company.com"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#3730A3] transition-colors">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="block w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-[#3730A3]/20 focus:border-[#3730A3] outline-none transition-all text-sm"
                  placeholder="••••••••"
                />
              </div>
              {/* Password Strength */}
              {password.length > 0 && (
                <div className="pt-1.5">
                  <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full ${strength.width} ${strength.color.split(" ")[0]} rounded-full transition-all`} />
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className={`text-[10px] uppercase font-bold tracking-wider ${strength.color.split(" ")[1]}`}>
                      {strength.label}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Organisation */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Organisation name</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#3730A3] transition-colors">
                  <Building2 className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  required
                  className="block w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-[#3730A3]/20 focus:border-[#3730A3] outline-none transition-all text-sm"
                  placeholder="Acme Marketing Co."
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#3730A3] hover:bg-[#3730A3]/90 text-white font-semibold py-3 px-4 rounded-lg shadow-sm shadow-[#3730A3]/20 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
            >
              {loading ? "Creating account..." : "Create account"}
              {!loading && <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />}
            </button>

            {/* Legal */}
            <p className="text-[12px] text-center text-slate-500 leading-relaxed px-2">
              By creating an account, you agree to our{" "}
              <Link href="/terms" className="text-[#3730A3] hover:underline underline-offset-4">Terms of Service</Link> and{" "}
              <Link href="/privacy" className="text-[#3730A3] hover:underline underline-offset-4">Privacy Policy</Link>
            </p>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-600">
              Already have an account?{" "}
              <Link href="/login" className="text-[#3730A3] font-semibold hover:underline underline-offset-4">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </main>

      <footer className="w-full py-6 text-center">
        <p className="text-xs text-slate-400">
          &copy; {new Date().getFullYear()} ContentIntel. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
