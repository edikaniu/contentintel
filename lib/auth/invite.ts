import crypto from "crypto";
import { eq, and, isNull, gt } from "drizzle-orm";
import { db } from "@/lib/db";
import { invites, waitlist } from "@/lib/db/schema";

/**
 * Generate a secure random token.
 */
export function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Create a team invite for an existing org.
 */
export async function createTeamInvite(params: {
  orgId: string;
  email: string;
  role: string;
  invitedBy: string;
}): Promise<{ token: string; expiresAt: Date }> {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await db.insert(invites).values({
    orgId: params.orgId,
    email: params.email.toLowerCase(),
    role: params.role,
    token,
    invitedBy: params.invitedBy,
    expiresAt,
  });

  return { token, expiresAt };
}

/**
 * Validate a team invite token.
 * Returns the invite if valid, null otherwise.
 */
export async function validateTeamInvite(token: string) {
  const invite = await db
    .select()
    .from(invites)
    .where(
      and(
        eq(invites.token, token),
        isNull(invites.acceptedAt),
        gt(invites.expiresAt, new Date())
      )
    )
    .then((rows) => rows[0] ?? null);

  return invite;
}

/**
 * Mark a team invite as accepted.
 */
export async function markInviteAccepted(token: string): Promise<void> {
  await db
    .update(invites)
    .set({ acceptedAt: new Date() })
    .where(eq(invites.token, token));
}

/**
 * Validate a waitlist invite token (for beta sign-up).
 */
export async function validateWaitlistInvite(token: string) {
  const entry = await db
    .select()
    .from(waitlist)
    .where(
      and(
        eq(waitlist.inviteToken, token),
        eq(waitlist.status, "invited")
      )
    )
    .then((rows) => rows[0] ?? null);

  return entry;
}

/**
 * Mark a waitlist entry as signed up.
 */
export async function markWaitlistSignedUp(token: string): Promise<void> {
  await db
    .update(waitlist)
    .set({
      status: "signed_up",
      signedUpAt: new Date(),
    })
    .where(eq(waitlist.inviteToken, token));
}
