import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { dataSourceCredentials } from "@/lib/db/schema";
import { encrypt, decrypt } from "./encryption";

export type Provider =
  | "dataforseo"
  | "windsor"
  | "hubspot"
  | "semrush"
  | "anthropic";

export interface CredentialRecord {
  id: string;
  orgId: string;
  provider: Provider;
  isConnected: boolean;
  lastTestedAt: Date | null;
  lastTestStatus: string | null;
  lastTestError: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Get decrypted credentials for a provider in an org.
 * Returns null if not configured.
 */
export async function getCredentials(
  orgId: string,
  provider: Provider
): Promise<Record<string, string> | null> {
  const row = await db
    .select()
    .from(dataSourceCredentials)
    .where(
      and(
        eq(dataSourceCredentials.orgId, orgId),
        eq(dataSourceCredentials.provider, provider)
      )
    )
    .then((rows) => rows[0] ?? null);

  if (!row) return null;

  try {
    const decrypted = decrypt(row.credentialsEncrypted);
    return JSON.parse(decrypted);
  } catch {
    return null;
  }
}

/**
 * Save (upsert) encrypted credentials for a provider.
 */
export async function saveCredentials(
  orgId: string,
  provider: Provider,
  credentials: Record<string, string>
): Promise<void> {
  const encrypted = encrypt(JSON.stringify(credentials));
  const now = new Date();

  const existing = await db
    .select({ id: dataSourceCredentials.id })
    .from(dataSourceCredentials)
    .where(
      and(
        eq(dataSourceCredentials.orgId, orgId),
        eq(dataSourceCredentials.provider, provider)
      )
    )
    .then((rows) => rows[0] ?? null);

  if (existing) {
    await db
      .update(dataSourceCredentials)
      .set({
        credentialsEncrypted: encrypted,
        updatedAt: now,
      })
      .where(eq(dataSourceCredentials.id, existing.id));
  } else {
    await db.insert(dataSourceCredentials).values({
      orgId,
      provider,
      credentialsEncrypted: encrypted,
      isConnected: false,
      createdAt: now,
      updatedAt: now,
    });
  }
}

/**
 * Update the connection test status for a provider.
 */
export async function updateTestStatus(
  orgId: string,
  provider: Provider,
  status: "success" | "error",
  error?: string
): Promise<void> {
  const now = new Date();

  await db
    .update(dataSourceCredentials)
    .set({
      isConnected: status === "success",
      lastTestedAt: now,
      lastTestStatus: status,
      lastTestError: error ?? null,
      updatedAt: now,
    })
    .where(
      and(
        eq(dataSourceCredentials.orgId, orgId),
        eq(dataSourceCredentials.provider, provider)
      )
    );
}

/**
 * Delete credentials for a provider.
 */
export async function deleteCredentials(
  orgId: string,
  provider: Provider
): Promise<void> {
  await db
    .delete(dataSourceCredentials)
    .where(
      and(
        eq(dataSourceCredentials.orgId, orgId),
        eq(dataSourceCredentials.provider, provider)
      )
    );
}

/**
 * Get all credential records for an org (without decrypted values).
 */
export async function listCredentials(
  orgId: string
): Promise<CredentialRecord[]> {
  const rows = await db
    .select({
      id: dataSourceCredentials.id,
      orgId: dataSourceCredentials.orgId,
      provider: dataSourceCredentials.provider,
      isConnected: dataSourceCredentials.isConnected,
      lastTestedAt: dataSourceCredentials.lastTestedAt,
      lastTestStatus: dataSourceCredentials.lastTestStatus,
      lastTestError: dataSourceCredentials.lastTestError,
      createdAt: dataSourceCredentials.createdAt,
      updatedAt: dataSourceCredentials.updatedAt,
    })
    .from(dataSourceCredentials)
    .where(eq(dataSourceCredentials.orgId, orgId));

  return rows as CredentialRecord[];
}
