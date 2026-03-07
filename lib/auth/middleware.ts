import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "./config";

export type Role = "owner" | "admin" | "editor" | "viewer";

const ROLE_HIERARCHY: Record<Role, number> = {
  owner: 4,
  admin: 3,
  editor: 2,
  viewer: 1,
};

/**
 * Get the authenticated session with org context.
 * Returns null if not authenticated.
 */
export async function getAuthSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  return session;
}

/**
 * Require authentication. Returns the session or a 401 response.
 */
export async function requireAuth() {
  const session = await getAuthSession();
  if (!session) {
    return {
      session: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { session, error: null };
}

/**
 * Require specific role(s). Checks if the user has at least one of the specified roles.
 * Uses role hierarchy: owner > admin > editor > viewer.
 */
export async function requireRole(...allowedRoles: Role[]) {
  const { session, error } = await requireAuth();
  if (error) return { session: null, error };

  const userRole = session!.user.role as Role;
  const hasRole = allowedRoles.some(
    (role) => ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[role]
  );

  if (!hasRole) {
    return {
      session: null,
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { session: session!, error: null };
}

/**
 * Check if the user is a platform admin (based on ADMIN_EMAIL env var).
 */
export async function requirePlatformAdmin() {
  const { session, error } = await requireAuth();
  if (error) return { session: null, error };

  if (session!.user.email !== process.env.ADMIN_EMAIL) {
    return {
      session: null,
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { session: session!, error: null };
}
