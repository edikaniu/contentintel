export interface TestResult {
  success: boolean;
  error?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Test DataforSEO credentials by fetching account balance.
 */
export async function testDataforSEO(creds: {
  login: string;
  password: string;
}): Promise<TestResult> {
  try {
    const auth = Buffer.from(`${creds.login}:${creds.password}`).toString(
      "base64"
    );
    const res = await fetch("https://api.dataforseo.com/v3/appendix/user_data", {
      method: "GET",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
    });

    const data = await res.json();

    if (data.status_code === 20000 && data.tasks?.[0]?.result?.[0]) {
      const result = data.tasks[0].result[0];
      return {
        success: true,
        metadata: {
          balance: result.money?.balance,
          login: result.login,
        },
      };
    }

    return {
      success: false,
      error: data.status_message || "Invalid credentials",
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Connection failed",
    };
  }
}

/**
 * Test Windsor.ai credentials by fetching connectors list.
 */
export async function testWindsor(creds: {
  api_key: string;
}): Promise<TestResult> {
  try {
    const res = await fetch(
      `https://connectors.windsor.ai/all?api_key=${encodeURIComponent(creds.api_key)}`,
      { method: "GET" }
    );

    if (!res.ok) {
      return {
        success: false,
        error: `HTTP ${res.status}: ${res.statusText}`,
      };
    }

    const data = await res.json();
    return {
      success: true,
      metadata: {
        connectors: Array.isArray(data) ? data.length : 0,
      },
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Connection failed",
    };
  }
}

/**
 * Test HubSpot credentials by fetching account info.
 */
export async function testHubSpot(creds: {
  access_token: string;
}): Promise<TestResult> {
  try {
    const res = await fetch(
      "https://api.hubapi.com/integrations/v1/me",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${creds.access_token}`,
        },
      }
    );

    if (!res.ok) {
      return {
        success: false,
        error: `HTTP ${res.status}: ${res.statusText}`,
      };
    }

    const data = await res.json();
    return {
      success: true,
      metadata: {
        portalId: data.portalId,
        appId: data.appId,
      },
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Connection failed",
    };
  }
}

/**
 * Test Anthropic credentials by listing models.
 */
export async function testAnthropic(creds: {
  api_key: string;
}): Promise<TestResult> {
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": creds.api_key,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1,
        messages: [{ role: "user", content: "Hi" }],
      }),
    });

    if (res.ok || res.status === 200) {
      return {
        success: true,
        metadata: { verified: true },
      };
    }

    // 401 means bad key, other errors might be rate limits (key is valid)
    if (res.status === 401) {
      return { success: false, error: "Invalid API key" };
    }

    // 429 or other status means key is valid but rate limited
    if (res.status === 429) {
      return {
        success: true,
        metadata: { verified: true, note: "Rate limited but key is valid" },
      };
    }

    const data = await res.json().catch(() => null);
    return {
      success: false,
      error: data?.error?.message || `HTTP ${res.status}`,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Connection failed",
    };
  }
}

/**
 * Test SEMrush credentials by checking API units balance.
 */
export async function testSemrush(creds: {
  api_key: string;
}): Promise<TestResult> {
  try {
    const res = await fetch(
      `https://api.semrush.com/management/v1/units?key=${encodeURIComponent(creds.api_key)}`,
      { method: "GET" }
    );

    const text = await res.text();

    if (res.ok) {
      const units = parseInt(text, 10);
      if (!isNaN(units)) {
        return {
          success: true,
          metadata: { unitsRemaining: units },
        };
      }
      return { success: true, metadata: { raw: text } };
    }

    return {
      success: false,
      error: text || `HTTP ${res.status}`,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Connection failed",
    };
  }
}
