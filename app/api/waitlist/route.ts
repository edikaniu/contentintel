import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { waitlist } from "@/lib/db/schema";
import { requirePlatformAdmin } from "@/lib/auth/middleware";
import { sendWaitlistConfirmationEmail } from "@/lib/email/transactional";

export async function POST(req: NextRequest) {
  try {
    const { name, email } = await req.json();

    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check for duplicate email
    const existing = await db
      .select({ id: waitlist.id })
      .from(waitlist)
      .where(eq(waitlist.email, normalizedEmail))
      .then((rows) => rows[0] ?? null);

    if (existing) {
      return NextResponse.json(
        { error: "This email is already on the waitlist" },
        { status: 409 }
      );
    }

    await db.insert(waitlist).values({
      name: name.trim(),
      email: normalizedEmail,
      source: "landing_page",
      status: "waiting",
    });

    await sendWaitlistConfirmationEmail({
      to: normalizedEmail,
      name: name.trim(),
    });

    return NextResponse.json(
      { message: "You've been added to the waitlist!" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Waitlist signup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  const { session, error } = await requirePlatformAdmin();
  if (error) return error;

  try {
    const entries = await db.select().from(waitlist);

    return NextResponse.json({ entries });
  } catch (error) {
    console.error("Waitlist fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
