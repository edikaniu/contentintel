import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, organisations } from "@/lib/db/schema";
import { requireRole } from "@/lib/auth/middleware";
import { createTeamInvite } from "@/lib/auth/invite";
import { sendTeamInviteEmail } from "@/lib/email/transactional";

export async function POST(req: NextRequest) {
  const { session, error } = await requireRole("admin");
  if (error) return error;

  try {
    const { email, role } = await req.json();

    if (!email || !role) {
      return NextResponse.json(
        { error: "Email and role are required" },
        { status: 400 }
      );
    }

    const validRoles = ["admin", "editor", "viewer"];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: "Invalid role. Must be admin, editor, or viewer" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists in this org
    const existingUser = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .then((rows) => rows[0] ?? null);

    if (existingUser) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 409 }
      );
    }

    // Get org name for the email
    const org = await db
      .select({ name: organisations.name })
      .from(organisations)
      .where(eq(organisations.id, session!.user.orgId))
      .then((rows) => rows[0] ?? null);

    const { token, expiresAt } = await createTeamInvite({
      orgId: session!.user.orgId,
      email: normalizedEmail,
      role,
      invitedBy: session!.user.id,
    });

    await sendTeamInviteEmail({
      to: normalizedEmail,
      inviterName: session!.user.name,
      orgName: org?.name ?? "your team",
      role,
      token,
    });

    return NextResponse.json(
      {
        message: "Invite sent successfully",
        invite: { email: normalizedEmail, role, expiresAt },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Team invite error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
