"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { User, Mail, Lock, Building2, ArrowRight } from "lucide-react";

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#050505]"><p className="text-gray-500 font-body">Loading...</p></div>}>
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
      <div className="min-h-screen flex items-center justify-center bg-[#050505]">
        <p className="text-gray-500 font-body">Loading...</p>
      </div>
    );
  }

  // If no invite token and closed beta, show waitlist message
  if (!inviteToken && closedBeta) {
    return (
      <div className="min-h-screen flex flex-col bg-[#050505] relative overflow-hidden">
        {/* Radial violet glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#8B5CF6]/10 rounded-full blur-[120px] pointer-events-none" />
        {/* Noise texture overlay */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")", backgroundRepeat: "repeat" }} />

        <header className="w-full flex justify-center py-8 relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#8B5CF6]" />
            <span className="text-xl font-headline tracking-tight text-white">ContentIntel</span>
          </div>
        </header>
        <main className="flex-1 flex items-start justify-center px-4 pb-12 relative z-10">
          <div className="w-full max-w-[420px] bg-[#111111] border border-[#222222] rounded-2xl p-8 text-center">
            <h1 className="text-2xl font-headline text-white mb-4">Closed Beta</h1>
            <p className="text-gray-500 font-body mb-6">
              We&apos;re currently in closed beta. Join the waitlist to get early access.
            </p>
            <Link
              href="/#waitlist"
              className="landing-gradient-border-btn inline-flex items-center justify-center"
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
    if (password.length < 12) return { width: "w-2/3", label: "Strong", color: "bg-[#8B5CF6] text-[#8B5CF6]" };
    return { width: "w-full", label: "Very strong", color: "bg-[#A3E635] text-[#A3E635]" };
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
    <div className="min-h-screen flex flex-col bg-[#050505] text-white relative overflow-hidden">
      {/* Radial violet glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#8B5CF6]/10 rounded-full blur-[120px] pointer-events-none" />
      {/* Noise texture overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")", backgroundRepeat: "repeat" }} />

      <header className="w-full flex justify-center py-8 relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#8B5CF6]" />
          <span className="text-xl font-headline tracking-tight text-white">ContentIntel</span>
        </div>
      </header>

      <main className="flex-1 flex items-start justify-center px-4 pb-12 relative z-10">
        <div className="w-full max-w-[420px] bg-[#111111] border border-[#222222] rounded-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-headline text-white mb-2">Create your account</h1>
            <p className="text-sm text-gray-500 font-body">Set up your ContentIntel workspace</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-500 font-body">Full name</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-600 group-focus-within:text-[#8B5CF6] transition-colors">
                  <User className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="block w-full pl-11 pr-4 py-2.5 bg-[#0a0a0a] border border-[#222] rounded-xl text-white placeholder-gray-600 focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 outline-none transition-all text-sm"
                  placeholder="Jane Smith"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-500 font-body">Email address</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-600 group-focus-within:text-[#8B5CF6] transition-colors">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="block w-full pl-11 pr-4 py-2.5 bg-[#0a0a0a] border border-[#222] rounded-xl text-white placeholder-gray-600 focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 outline-none transition-all text-sm"
                  placeholder="you@company.com"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-500 font-body">Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-600 group-focus-within:text-[#8B5CF6] transition-colors">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="block w-full pl-11 pr-4 py-2.5 bg-[#0a0a0a] border border-[#222] rounded-xl text-white placeholder-gray-600 focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 outline-none transition-all text-sm"
                  placeholder="••••••••"
                />
              </div>
              {/* Password Strength */}
              {password.length > 0 && (
                <div className="pt-1.5">
                  <div className="h-1 w-full bg-[#1a1a1a] rounded-full overflow-hidden">
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
              <label className="text-sm font-medium text-gray-500 font-body">Organisation name</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-600 group-focus-within:text-[#8B5CF6] transition-colors">
                  <Building2 className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  required
                  className="block w-full pl-11 pr-4 py-2.5 bg-[#0a0a0a] border border-[#222] rounded-xl text-white placeholder-gray-600 focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 outline-none transition-all text-sm"
                  placeholder="Acme Marketing Co."
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="landing-gradient-border-btn w-full !py-3 flex items-center justify-center gap-2 group disabled:opacity-50"
            >
              {loading ? "Creating account..." : "Create account"}
              {!loading && <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />}
            </button>

            {/* Legal */}
            <p className="text-[12px] text-center text-gray-600 font-body leading-relaxed px-2">
              By creating an account, you agree to our{" "}
              <Link href="/terms" className="text-[#8B5CF6] hover:underline underline-offset-4">Terms of Service</Link> and{" "}
              <Link href="/privacy" className="text-[#8B5CF6] hover:underline underline-offset-4">Privacy Policy</Link>
            </p>
          </form>

          <div className="mt-8 pt-6 border-t border-[#222] text-center">
            <p className="text-sm text-gray-600 font-body">
              Already have an account?{" "}
              <Link href="/login" className="text-[#8B5CF6] font-semibold hover:underline underline-offset-4">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </main>

      <footer className="w-full py-6 text-center relative z-10">
        <p className="text-xs text-gray-600 font-body">
          &copy; {new Date().getFullYear()} ContentIntel. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
