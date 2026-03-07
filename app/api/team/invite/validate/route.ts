import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { organisations } from "@/lib/db/schema";
import { validateTeamInvite } from "@/lib/auth/invite";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Token is required" }, { status: 400 });
  }

  const invite = await validateTeamInvite(token);
  if (!invite) {
    return NextResponse.json(
      { error: "Invalid or expired invite" },
      { status: 404 }
    );
  }

  const org = await db
    .select({ name: organisations.name })
    .from(organisations)
    .where(eq(organisations.id, invite.orgId))
    .then((rows) => rows[0] ?? null);

  return NextResponse.json({
    email: invite.email,
    role: invite.role,
    orgName: org?.name ?? "Unknown",
  });
}
