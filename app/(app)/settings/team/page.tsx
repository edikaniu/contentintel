"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { UserPlus, Users, Trash2, Shield } from "lucide-react";
import { SettingsSubNav } from "@/components/settings-sub-nav";

interface Member {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  status?: "active" | "pending";
}

const ROLE_LABELS: Record<string, string> = {
  owner: "Owner",
  admin: "Administrator",
  editor: "Editor",
  viewer: "Viewer",
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase())
    .slice(0, 2)
    .join("");
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function TeamPage() {
  const { data: session } = useSession();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("editor");
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState("");
  const [changingRole, setChangingRole] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

  const isAdminOrOwner = session?.user.role === "admin" || session?.user.role === "owner";

  useEffect(() => { fetchMembers(); }, []);

  async function fetchMembers() {
    try {
      const res = await fetch("/api/team");
      if (res.ok) {
        const data = await res.json();
        setMembers(data.members);
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }

  async function handleInvite() {
    if (!inviteEmail) return;
    setInviting(true);
    setInviteError("");
    setInviteSuccess("");
    try {
      const res = await fetch("/api/team/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      const data = await res.json();
      if (res.ok) {
        setInviteSuccess(`Invite sent to ${inviteEmail}`);
        setInviteEmail("");
      } else {
        setInviteError(data.error || "Failed to send invite");
      }
    } catch {
      setInviteError("Failed to send invite");
    } finally { setInviting(false); }
  }

  async function handleChangeRole(userId: string, newRole: string) {
    try {
      const res = await fetch("/api/team", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      });
      if (res.ok) {
        setChangingRole(null);
        await fetchMembers();
      }
    } catch { /* ignore */ }
  }

  async function handleRemove(userId: string) {
    try {
      await fetch("/api/team", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      setConfirmRemove(null);
      await fetchMembers();
    } catch { /* ignore */ }
  }

  if (loading) return <div className="p-8 text-slate-500">Loading...</div>;

  const isCurrentUser = (m: Member) => m.id === session?.user.id;
  const isPending = (m: Member) => m.status === "pending";
  const isActive = (m: Member) => !isPending(m);

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <SettingsSubNav />

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Section Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex flex-col gap-1">
              <h2 className="text-xl font-bold">Team</h2>
              <p className="text-slate-500 text-sm">Manage your team members and their access permissions.</p>
            </div>
            {isAdminOrOwner && (
              <button
                onClick={() => setShowInvite(!showInvite)}
                className="px-4 py-2 bg-[#3730A3] text-white text-sm font-bold rounded-lg flex items-center gap-2 hover:bg-indigo-800 transition-colors shadow-sm"
              >
                <UserPlus className="w-[18px] h-[18px]" />
                Invite Member
              </button>
            )}
          </div>

          {/* Invite Form */}
          {showInvite && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <h3 className="font-medium text-slate-900 mb-4">Send Invite</h3>
              <div className="flex gap-3 mb-3">
                <input
                  type="email" value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="team@example.com"
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3730A3]"
                />
                <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#3730A3]">
                  <option value="admin">Admin</option>
                  <option value="editor">Editor</option>
                  <option value="viewer">Viewer</option>
                </select>
                <button onClick={handleInvite} disabled={inviting} className="px-4 py-2 bg-[#3730A3] text-white rounded-lg text-sm font-medium hover:bg-indigo-800 disabled:opacity-50">
                  {inviting ? "Sending..." : "Send"}
                </button>
              </div>
              {inviteError && <p className="text-sm text-red-600">{inviteError}</p>}
              {inviteSuccess && <p className="text-sm text-[#059669]">{inviteSuccess}</p>}
            </div>
          )}

          {/* Team Table */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Member</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Joined Date</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {members.map((m) => {
                  const isSelf = isCurrentUser(m);
                  const memberIsPending = isPending(m);
                  const memberIsActive = isActive(m);
                  const isOwnerOrSelf = m.role === "owner" || isSelf;
                  const canChangeRole = isAdminOrOwner && memberIsActive && !isOwnerOrSelf;

                  return (
                    <tr key={m.id}>
                      {/* Member */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {isSelf ? (
                            <div className="size-8 rounded-full bg-[#3730A3] flex items-center justify-center">
                              <span className="text-xs font-bold text-white">{getInitials(m.name)}</span>
                            </div>
                          ) : memberIsPending ? (
                            <div className="size-8 rounded-full bg-slate-100 flex items-center justify-center">
                              <span className="text-xs font-bold text-slate-400">{getInitials(m.name)}</span>
                            </div>
                          ) : (
                            <div className="size-8 rounded-full bg-indigo-100 flex items-center justify-center">
                              <span className="text-xs font-bold text-indigo-600">{getInitials(m.name)}</span>
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-semibold">{m.name}</p>
                            {isSelf && <p className="text-xs text-indigo-600 font-medium">You</p>}
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-6 py-4 text-sm text-slate-600">{m.email}</td>

                      {/* Role */}
                      <td className="px-6 py-4">
                        {canChangeRole ? (
                          <select
                            defaultValue={m.role}
                            onChange={(e) => handleChangeRole(m.id, e.target.value)}
                            className="bg-transparent border-none text-sm text-slate-700 focus:ring-0 p-0 cursor-pointer"
                          >
                            <option value="admin">Administrator</option>
                            <option value="editor">Editor</option>
                            <option value="viewer">Viewer</option>
                          </select>
                        ) : (
                          <span className="text-sm text-slate-700">{ROLE_LABELS[m.role] || m.role}</span>
                        )}
                      </td>

                      {/* Joined Date */}
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {memberIsPending ? "\u2014" : formatDate(m.createdAt)}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        {memberIsPending ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                            Pending
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                            Active
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        {isAdminOrOwner && !isSelf && m.role !== "owner" && (
                          memberIsPending ? (
                            <div className="flex items-center justify-end gap-3">
                              <button className="text-xs font-bold text-indigo-600 hover:underline">Resend Invite</button>
                              <button
                                onClick={() => handleRemove(m.id)}
                                className="text-xs font-bold text-slate-400 hover:text-slate-600"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : confirmRemove === m.id ? (
                            <div className="flex items-center justify-end gap-3">
                              <button onClick={() => handleRemove(m.id)} className="text-xs font-bold text-rose-600 hover:text-rose-700">Confirm</button>
                              <button onClick={() => setConfirmRemove(null)} className="text-xs font-bold text-slate-400 hover:text-slate-600">Cancel</button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmRemove(m.id)}
                              className="text-xs font-bold text-rose-600 hover:text-rose-700"
                            >
                              Remove
                            </button>
                          )
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
