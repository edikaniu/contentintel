import { getCredentials } from "@/lib/credentials/credential-store";

interface HubSpotResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface HubSpotBlog {
  id: string;
  name: string;
  slug: string;
  absoluteUrl: string;
}

interface HubSpotBlogPost {
  id: string;
  title: string;
  url: string;
  slug: string;
  publishDate: string;
  updated: string;
  authorName: string;
  htmlTitle: string;
  postBody: string;
  topicIds: string[];
  categoryId: string;
  state: string;
}

export async function getHubSpotClient(orgId: string) {
  const creds = await getCredentials(orgId, "hubspot");
  if (!creds) return null;

  const accessToken = creds.access_token;

  async function request<T>(url: string): Promise<HubSpotResult<T>> {
    try {
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        return {
          success: false,
          error: `HubSpot API error: ${res.status} ${res.statusText}${body ? ` — ${body}` : ""}`,
        };
      }

      const json = await res.json();
      return { success: true, data: json as T };
    } catch (err) {
      return {
        success: false,
        error:
          err instanceof Error
            ? err.message
            : "Failed to connect to HubSpot",
      };
    }
  }

  return {
    async testConnection(): Promise<
      HubSpotResult<{ portalId: number; appId: number }>
    > {
      const result = await request<{ portalId: number; appId: number }>(
        "https://api.hubapi.com/integrations/v1/me"
      );

      if (!result.success || !result.data) {
        return { success: false, error: result.error ?? "No data returned" };
      }

      return {
        success: true,
        data: {
          portalId: result.data.portalId,
          appId: result.data.appId,
        },
      };
    },

    async listBlogPosts(blogId?: string): Promise<HubSpotResult<HubSpotBlogPost[]>> {
      const allPosts: HubSpotBlogPost[] = [];
      let offset = 0;
      const limit = 100;

      while (true) {
        const params = new URLSearchParams({
          state: "PUBLISHED",
          limit: String(limit),
          offset: String(offset),
        });
        if (blogId) params.set("content_group_id", blogId);

        const result = await request<{
          objects?: Array<{
            id: string;
            name: string;
            url: string;
            slug: string;
            publish_date: string;
            updated: string;
            author_name: string;
            html_title: string;
            post_body: string;
            topic_ids: string[];
            category_id: string;
            state: string;
          }>;
          total?: number;
        }>(`https://api.hubapi.com/content/api/v2/blog-posts?${params.toString()}`);

        if (!result.success || !result.data) {
          return { success: false, error: result.error ?? "No data returned" };
        }

        const posts = (result.data.objects ?? []).map((p) => ({
          id: String(p.id),
          title: p.html_title || p.name,
          url: p.url,
          slug: p.slug,
          publishDate: p.publish_date,
          updated: p.updated,
          authorName: p.author_name,
          htmlTitle: p.html_title,
          postBody: p.post_body,
          topicIds: p.topic_ids ?? [],
          categoryId: String(p.category_id ?? ""),
          state: p.state,
        }));

        allPosts.push(...posts);

        if (posts.length < limit) break;
        offset += limit;
        // Safety cap at 1000 posts
        if (offset >= 1000) break;
      }

      return { success: true, data: allPosts };
    },

    async listBlogs(): Promise<HubSpotResult<HubSpotBlog[]>> {
      const result = await request<{
        objects?: Array<{
          id: string;
          name: string;
          slug: string;
          absolute_url: string;
        }>;
      }>("https://api.hubapi.com/content/api/v2/blogs");

      if (!result.success || !result.data) {
        return { success: false, error: result.error ?? "No data returned" };
      }

      const blogs: HubSpotBlog[] = (result.data.objects ?? []).map((blog) => ({
        id: blog.id,
        name: blog.name,
        slug: blog.slug,
        absoluteUrl: blog.absolute_url,
      }));

      return { success: true, data: blogs };
    },
  };
}
