"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";

export default function InviteAcceptPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [invite, setInvite] = useState<{
    email: string;
    role: string;
    orgName: string;
  } | null>(null);
  const [validating, setValidating] = useState(true);
  const [invalid, setInvalid] = useState(false);

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function validateInvite() {
      try {
        const res = await fetch(`/api/team/invite/validate?token=${token}`);
        if (res.ok) {
          const data = await res.json();
          setInvite(data);
        } else {
          setInvalid(true);
        }
      } catch {
        setInvalid(true);
      } finally {
        setValidating(false);
      }
    }
    validateInvite();
  }, [token]);

  if (validating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505]">
        <p className="font-body text-gray-500">Validating invite...</p>
      </div>
    );
  }

  if (invalid || !invite) {
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
            <h2 className="font-headline text-white text-xl font-bold mb-2">Invalid Invite</h2>
            <p className="font-body text-gray-500 mb-4">
              This invite link is invalid or has expired. Please ask your team admin for a new invite.
            </p>
            <Link href="/login" className="text-[#8B5CF6] hover:text-[#8B5CF6]/80 text-sm transition-colors">
              Go to login
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
    setLoading(true);

    try {
      const res = await fetch("/api/team/invite/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, name, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to accept invite");
        return;
      }

      // Auto-login
      const signInResult = await signIn("credentials", {
        email: invite!.email,
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
            <p className="font-body text-gray-500">
              Join <span className="text-white font-bold">{invite.orgName}</span> as {invite.role === "admin" ? "an" : "a"}{" "}
              <span className="text-white font-bold">{invite.role}</span>
            </p>
          </div>

          <div className="bg-[#111111] border border-[#222222] rounded-2xl p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium font-body text-gray-500 mb-2">Email</label>
                <input
                  type="email"
                  value={invite.email}
                  disabled
                  className="w-full px-4 py-3 rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] text-gray-600 text-sm"
                />
              </div>

              <div>
                <label htmlFor="name" className="block text-sm font-medium font-body text-gray-500 mb-2">
                  Your Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-[#222] bg-[#0a0a0a] text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all text-sm"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium font-body text-gray-500 mb-2">
                  Password
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

              <button
                type="submit"
                disabled={loading}
                className="landing-gradient-border-btn w-full !py-3 disabled:opacity-50"
              >
                {loading ? "Joining..." : "Accept Invite & Join"}
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
