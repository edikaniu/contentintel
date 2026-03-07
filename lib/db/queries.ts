import { eq, and, SQL } from "drizzle-orm";
import { db } from "./index";
import {
  organisations,
  users,
  invites,
  dataSourceCredentials,
  domains,
  competitors,
  contentInventory,
  contentSnapshots,
  topicRecommendations,
  contentAlerts,
  approvalStages,
  weeklyBatches,
} from "./schema";

/**
 * Creates an org-scoped query helper.
 * Every query through this helper automatically includes org_id filtering.
 */
export function scopedByOrg(orgId: string) {
  return {
    // Organisation
    async getOrganisation() {
      return db
        .select()
        .from(organisations)
        .where(eq(organisations.id, orgId))
        .then((rows) => rows[0] ?? null);
    },

    // Users
    async getUsers() {
      return db.select().from(users).where(eq(users.orgId, orgId));
    },

    async getUserById(userId: string) {
      return db
        .select()
        .from(users)
        .where(and(eq(users.id, userId), eq(users.orgId, orgId)))
        .then((rows) => rows[0] ?? null);
    },

    // Invites
    async getInvites() {
      return db.select().from(invites).where(eq(invites.orgId, orgId));
    },

    // Data Source Credentials
    async getCredentials() {
      return db
        .select()
        .from(dataSourceCredentials)
        .where(eq(dataSourceCredentials.orgId, orgId));
    },

    async getCredentialByProvider(provider: string) {
      return db
        .select()
        .from(dataSourceCredentials)
        .where(
          and(
            eq(dataSourceCredentials.orgId, orgId),
            eq(dataSourceCredentials.provider, provider)
          )
        )
        .then((rows) => rows[0] ?? null);
    },

    // Domains
    async getDomains() {
      return db.select().from(domains).where(eq(domains.orgId, orgId));
    },

    async getDomainById(domainId: string) {
      return db
        .select()
        .from(domains)
        .where(and(eq(domains.id, domainId), eq(domains.orgId, orgId)))
        .then((rows) => rows[0] ?? null);
    },

    // Competitors (via domain ownership check)
    async getCompetitors(domainId: string) {
      // First verify domain belongs to this org
      const domain = await this.getDomainById(domainId);
      if (!domain) return [];
      return db
        .select()
        .from(competitors)
        .where(eq(competitors.domainId, domainId));
    },

    // Content Inventory (via domain ownership check)
    async getContentInventory(domainId: string) {
      const domain = await this.getDomainById(domainId);
      if (!domain) return [];
      return db
        .select()
        .from(contentInventory)
        .where(eq(contentInventory.domainId, domainId));
    },

    // Topic Recommendations (via domain ownership check)
    async getTopicRecommendations(domainId: string) {
      const domain = await this.getDomainById(domainId);
      if (!domain) return [];
      return db
        .select()
        .from(topicRecommendations)
        .where(eq(topicRecommendations.domainId, domainId));
    },

    // Content Alerts (via content -> domain ownership)
    async getContentAlerts(domainId: string) {
      const domain = await this.getDomainById(domainId);
      if (!domain) return [];
      // Join through content_inventory to verify domain ownership
      return db
        .select({
          alert: contentAlerts,
          content: contentInventory,
        })
        .from(contentAlerts)
        .innerJoin(
          contentInventory,
          eq(contentAlerts.contentId, contentInventory.id)
        )
        .where(eq(contentInventory.domainId, domainId));
    },

    // Approval Stages (via domain ownership)
    async getApprovalStages(domainId: string) {
      const domain = await this.getDomainById(domainId);
      if (!domain) return [];
      return db
        .select()
        .from(approvalStages)
        .where(eq(approvalStages.domainId, domainId));
    },

    // Weekly Batches (via domain ownership)
    async getWeeklyBatches(domainId: string) {
      const domain = await this.getDomainById(domainId);
      if (!domain) return [];
      return db
        .select()
        .from(weeklyBatches)
        .where(eq(weeklyBatches.domainId, domainId));
    },
  };
}
