import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { requireRole } from "@/lib/auth/middleware";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

export async function GET() {
  const { session, error } = await requireRole("viewer");
  if (error) return error;

  try {
    const members = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.orgId, session!.user.orgId));

    return NextResponse.json({ members });
  } catch (err) {
    console.error("List team error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const { session, error } = await requireRole("admin");
  if (error) return error;

  try {
    const { userId, role } = await req.json();

    if (!userId || !role) {
      return NextResponse.json({ error: "User ID and role are required" }, { status: 400 });
    }

    const validRoles = ["admin", "editor", "viewer"];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Can't change own role
    if (userId === session!.user.id) {
      return NextResponse.json({ error: "Cannot change your own role" }, { status: 400 });
    }

    // Verify user belongs to same org
    const user = await db
      .select({ id: users.id, role: users.role, orgId: users.orgId })
      .from(users)
      .where(eq(users.id, userId))
      .then((rows) => rows[0] ?? null);

    if (!user || user.orgId !== session!.user.orgId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Can't change owner's role
    if (user.role === "owner") {
      return NextResponse.json({ error: "Cannot change the owner's role" }, { status: 400 });
    }

    await db.update(users).set({ role, updatedAt: new Date() }).where(eq(users.id, userId));

    return NextResponse.json({ message: "Role updated" });
  } catch (err) {
    console.error("Update role error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { session, error } = await requireRole("admin");
  if (error) return error;

  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    if (userId === session!.user.id) {
      return NextResponse.json({ error: "Cannot remove yourself" }, { status: 400 });
    }

    const user = await db
      .select({ id: users.id, role: users.role, orgId: users.orgId })
      .from(users)
      .where(eq(users.id, userId))
      .then((rows) => rows[0] ?? null);

    if (!user || user.orgId !== session!.user.orgId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.role === "owner") {
      return NextResponse.json({ error: "Cannot remove the owner" }, { status: 400 });
    }

    await db.delete(users).where(eq(users.id, userId));

    return NextResponse.json({ message: "Member removed" });
  } catch (err) {
    console.error("Remove member error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
