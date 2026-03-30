/**
 * Reactor API Client
 * Shared client for CLI and MCP server
 */

const API_BASE = process.env.REACTOR_API_URL || "https://reactor-api.keugenek.workers.dev";
const API_KEY = process.env.REACTOR_API_KEY || "";

/**
 * Make an API call to the Reactor backend
 */
async function callAPI(endpoint, body = null, apiKeyOverride = null) {
  const key = apiKeyOverride || API_KEY;
  const headers = {
    "Content-Type": "application/json",
  };
  if (key) {
    headers["Authorization"] = `Bearer ${key}`;
  }

  const options = {
    method: body ? "POST" : "GET",
    headers,
  };
  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, options);
  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.error || `API error: ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

/**
 * Predict LinkedIn post performance
 * @param {string} post - The full post text
 * @param {object} opts - Optional: content_type, hour, weekday
 */
export async function predict(post, opts = {}) {
  return callAPI("/v1/predict", {
    post,
    content_type: opts.type || opts.content_type,
    hour: opts.hour,
    weekday: opts.weekday,
  });
}

/**
 * Analyze the hook (opening lines) of a post
 * @param {string} post - The post text (hook extracted automatically)
 */
export async function analyzeHook(post) {
  return callAPI("/v1/analyze-hook", { post });
}

/**
 * Get best posting times
 */
export async function bestTimes() {
  return callAPI("/v1/best-times");
}

/**
 * Get available content types
 */
export async function contentTypes() {
  return callAPI("/v1/content-types");
}

/**
 * Register for a free API key
 * @param {string} email - User's email address
 */
export async function register(email, apiKeyOverride = null) {
  return callAPI("/v1/register", { email }, apiKeyOverride);
}

/**
 * Join the Pro waitlist
 * @param {string} email - User's email address
 * @param {string} source - Where user found Reactor (cli, mcp, github)
 */
export async function joinWaitlist(email, source = "cli") {
  return callAPI("/v1/waitlist", { email, source });
}

export { API_BASE, API_KEY };
