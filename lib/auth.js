import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

// Plain instance — safe because server.js loads `import "dotenv/config"` first,
// so CONVEX_URL is already set by the time this module is evaluated.
export const db = new ConvexHttpClient(process.env.CONVEX_URL);

/**
 * Extracts and validates the org API key from the Authorization header.
 * Returns the org record, or sends a 401 and returns null.
 *
 * Usage in any route:
 *   const org = await requireAuth(request, reply);
 *   if (!org) return;
 */
export async function requireAuth(request, reply) {
  const authHeader = request.headers["authorization"] || "";
  const apiKey = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : authHeader;

  if (!apiKey.startsWith("sk_live_")) {
    reply.code(401).send({ error: "Invalid API key" });
    return null;
  }

  const org = await db.query(api.agents.getOrgByApiKey, { apiKey });

  if (!org) {
    reply.code(401).send({ error: "Invalid API key" });
    return null;
  }

  return org;
}
