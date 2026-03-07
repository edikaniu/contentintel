import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/middleware";
import { getCredentials, updateTestStatus } from "@/lib/credentials/credential-store";
import type { Provider } from "@/lib/credentials/credential-store";
import {
  testDataforSEO,
  testWindsor,
  testHubSpot,
  testAnthropic,
  testSemrush,
} from "@/lib/credentials/connection-tester";

const testers: Record<Provider, (creds: Record<string, string>) => Promise<{ success: boolean; error?: string; metadata?: Record<string, unknown> }>> = {
  dataforseo: (c) => testDataforSEO(c as { login: string; password: string }),
  windsor: (c) => testWindsor(c as { api_key: string }),
  hubspot: (c) => testHubSpot(c as { access_token: string }),
  anthropic: (c) => testAnthropic(c as { api_key: string }),
  semrush: (c) => testSemrush(c as { api_key: string }),
};

export async function POST(req: NextRequest) {
  const { session, error } = await requireRole("admin");
  if (error) return error;

  try {
    const { provider } = await req.json();

    if (!provider || !testers[provider as Provider]) {
      return NextResponse.json(
        { error: "Invalid provider" },
        { status: 400 }
      );
    }

    const creds = await getCredentials(session!.user.orgId, provider as Provider);
    if (!creds) {
      return NextResponse.json(
        { error: "No credentials configured for this provider" },
        { status: 404 }
      );
    }

    const result = await testers[provider as Provider](creds);

    await updateTestStatus(
      session!.user.orgId,
      provider as Provider,
      result.success ? "success" : "error",
      result.error
    );

    return NextResponse.json(result);
  } catch (err) {
    console.error("Connection test error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
