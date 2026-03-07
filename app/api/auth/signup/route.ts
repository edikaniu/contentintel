import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { organisations, users } from "@/lib/db/schema";
import { validateWaitlistInvite, markWaitlistSignedUp } from "@/lib/auth/invite";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password, orgName, inviteToken } = body;

    if (!name || !email || !password || !orgName) {
      return NextResponse.json(
        { error: "Name, email, password, and organisation name are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if open signup is disabled (closed beta)
    const openSignup = process.env.OPEN_SIGNUP === "true";
    if (!openSignup) {
      if (!inviteToken) {
        return NextResponse.json(
          {
            error:
              "We're currently in closed beta. Join the waitlist to get early access.",
          },
          { status: 403 }
        );
      }

      // Validate waitlist invite token
      const waitlistEntry = await validateWaitlistInvite(inviteToken);
      if (!waitlistEntry) {
        return NextResponse.json(
          { error: "Invalid or expired invite token" },
          { status: 400 }
        );
      }
    }

    // Check if email already exists
    const existingUser = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .then((rows) => rows[0] ?? null);

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // Create slug from org name
    const slug = orgName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    // Check slug uniqueness
    const existingOrg = await db
      .select({ id: organisations.id })
      .from(organisations)
      .where(eq(organisations.slug, slug))
      .then((rows) => rows[0] ?? null);

    if (existingOrg) {
      return NextResponse.json(
        { error: "An organisation with a similar name already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await hash(password, 12);

    // Create org and user in a transaction
    const result = await db.transaction(async (tx) => {
      const [org] = await tx
        .insert(organisations)
        .values({
          name: orgName,
          slug,
          plan: "beta",
        })
        .returning();

      const [user] = await tx
        .insert(users)
        .values({
          orgId: org.id,
          email: normalizedEmail,
          passwordHash,
          name,
          role: "owner",
        })
        .returning({ id: users.id, email: users.email, role: users.role });

      return { org, user };
    });

    // Mark waitlist invite as used (if applicable)
    if (inviteToken) {
      await markWaitlistSignedUp(inviteToken);
    }

    return NextResponse.json(
      {
        user: {
          id: result.user.id,
          email: result.user.email,
          role: result.user.role,
        },
        organisation: {
          id: result.org.id,
          name: result.org.name,
          slug: result.org.slug,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
