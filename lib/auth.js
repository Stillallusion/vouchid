import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

const db = new ConvexHttpClient(process.env.CONVEX_URL);

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

  // Reject anything that doesn't look like a real key before hitting the DB
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

export { db };
