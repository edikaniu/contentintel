"use client";

import { useState, useEffect } from "react";
import { CheckCircle, XCircle, Clock, Send } from "lucide-react";

interface WaitlistEntry {
  id: string;
  name: string;
  email: string;
  status: string;
  source: string;
  createdAt: string;
  invitedAt: string | null;
  signedUpAt: string | null;
}

const STATUS_BADGE: Record<string, { className: string; icon: typeof Clock }> = {
  waiting: { className: "bg-amber-100 text-amber-800", icon: Clock },
  invited: { className: "bg-blue-100 text-blue-800", icon: Send },
  signed_up: { className: "bg-emerald-100 text-emerald-800", icon: CheckCircle },
  rejected: { className: "bg-red-100 text-red-800", icon: XCircle },
};

export default function AdminWaitlistPage() {
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [approving, setApproving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchEntries();
  }, []);

  async function fetchEntries() {
    try {
      const res = await fetch("/api/waitlist");
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries);
      }
    } catch {
      setError("Failed to load waitlist");
    } finally {
      setLoading(false);
    }
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    const waiting = entries.filter((e) => e.status === "waiting");
    if (selected.size === waiting.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(waiting.map((e) => e.id)));
    }
  }

  async function handleApprove(ids: string[]) {
    setApproving(true);
    setError("");
    try {
      const res = await fetch("/api/waitlist/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      if (res.ok) {
        setSelected(new Set());
        await fetchEntries();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to approve");
      }
    } catch {
      setError("Failed to approve entries");
    } finally {
      setApproving(false);
    }
  }

  if (loading) {
    return <div className="text-slate-500 p-8">Loading waitlist...</div>;
  }

  const waitingCount = entries.filter((e) => e.status === "waiting").length;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Waitlist</h1>
          <p className="text-sm text-slate-500 mt-1">
            {entries.length} total entries, {waitingCount} waiting
          </p>
        </div>
        {selected.size > 0 && (
          <button
            onClick={() => handleApprove(Array.from(selected))}
            disabled={approving}
            className="bg-[#059669] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
          >
            {approving ? "Approving..." : `Approve ${selected.size} selected`}
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="text-left px-4 py-3 w-10">
                <input
                  type="checkbox"
                  checked={selected.size === waitingCount && waitingCount > 0}
                  onChange={toggleSelectAll}
                  className="rounded border-slate-300"
                />
              </th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Name</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Email</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Date</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => {
              const badge = STATUS_BADGE[entry.status] || STATUS_BADGE.waiting;
              const BadgeIcon = badge.icon;
              return (
                <tr key={entry.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    {entry.status === "waiting" && (
                      <input
                        type="checkbox"
                        checked={selected.has(entry.id)}
                        onChange={() => toggleSelect(entry.id)}
                        className="rounded border-slate-300"
                      />
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900">{entry.name}</td>
                  <td className="px-4 py-3 text-slate-600">{entry.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.className}`}
                    >
                      <BadgeIcon className="w-3 h-3" />
                      {entry.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {new Date(entry.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    {entry.status === "waiting" && (
                      <button
                        onClick={() => handleApprove([entry.id])}
                        disabled={approving}
                        className="text-[#059669] hover:underline text-sm font-medium disabled:opacity-50"
                      >
                        Approve
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {entries.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  No waitlist entries yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
