import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/middleware";
import {
  saveCredentials,
  listCredentials,
  deleteCredentials,
} from "@/lib/credentials/credential-store";
import type { Provider } from "@/lib/credentials/credential-store";

const VALID_PROVIDERS: Provider[] = [
  "dataforseo",
  "windsor",
  "hubspot",
  "semrush",
  "anthropic",
];

export async function GET() {
  const { session, error } = await requireRole("admin");
  if (error) return error;

  try {
    const credentials = await listCredentials(session!.user.orgId);
    return NextResponse.json({ credentials });
  } catch (err) {
    console.error("List credentials error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const { session, error } = await requireRole("admin");
  if (error) return error;

  try {
    const { provider, credentials } = await req.json();

    if (!provider || !VALID_PROVIDERS.includes(provider)) {
      return NextResponse.json(
        { error: "Invalid provider" },
        { status: 400 }
      );
    }

    if (!credentials || typeof credentials !== "object") {
      return NextResponse.json(
        { error: "Credentials object is required" },
        { status: 400 }
      );
    }

    await saveCredentials(session!.user.orgId, provider, credentials);

    return NextResponse.json({ message: "Credentials saved successfully" });
  } catch (err) {
    console.error("Save credentials error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const { session, error } = await requireRole("admin");
  if (error) return error;

  try {
    const { provider } = await req.json();

    if (!provider || !VALID_PROVIDERS.includes(provider)) {
      return NextResponse.json(
        { error: "Invalid provider" },
        { status: 400 }
      );
    }

    await deleteCredentials(session!.user.orgId, provider);

    return NextResponse.json({ message: "Credentials deleted successfully" });
  } catch (err) {
    console.error("Delete credentials error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
