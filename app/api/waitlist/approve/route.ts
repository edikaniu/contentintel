import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { waitlist } from "@/lib/db/schema";
import { requirePlatformAdmin } from "@/lib/auth/middleware";
import { generateToken } from "@/lib/auth/invite";
import { sendBetaInviteEmail } from "@/lib/email/transactional";

export async function POST(req: NextRequest) {
  const { session, error } = await requirePlatformAdmin();
  if (error) return error;

  try {
    const { ids } = await req.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "ids must be a non-empty array of waitlist entry IDs" },
        { status: 400 }
      );
    }

    let approvedCount = 0;

    for (const id of ids) {
      // Fetch the waitlist entry
      const entry = await db
        .select()
        .from(waitlist)
        .where(eq(waitlist.id, id))
        .then((rows) => rows[0] ?? null);

      if (!entry || entry.status !== "waiting") {
        continue;
      }

      const token = generateToken();

      await db
        .update(waitlist)
        .set({
          status: "invited",
          inviteToken: token,
          invitedAt: new Date(),
        })
        .where(eq(waitlist.id, id));

      await sendBetaInviteEmail({
        to: entry.email,
        name: entry.name,
        token,
      });

      approvedCount++;
    }

    return NextResponse.json(
      { message: `${approvedCount} waitlist entries approved and invited` },
      { status: 200 }
    );
  } catch (error) {
    console.error("Waitlist approve error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
