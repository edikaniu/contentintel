import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { requireRole } from "@/lib/auth/middleware";
import { db } from "@/lib/db";
import { organisations } from "@/lib/db/schema";

export async function POST() {
  const { session, error } = await requireRole("admin");
  if (error) return error;

  try {
    await db
      .update(organisations)
      .set({ onboardingCompletedAt: new Date(), updatedAt: new Date() })
      .where(eq(organisations.id, session!.user.orgId));

    return NextResponse.json({ message: "Onboarding completed" });
  } catch (err) {
    console.error("Complete onboarding error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
