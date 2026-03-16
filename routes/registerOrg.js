import { api } from "../convex/_generated/api.js";
import { v4 as uuidv4 } from "uuid";
import { db } from "../lib/auth.js";

// Org name: lowercase letters, numbers, hyphens, underscores only. Max 64 chars.
const NAME_PATTERN = /^[a-z0-9_-]+$/i;

const RATE_LIMIT = 5;
const WINDOW_MS = 60 * 60 * 1000;
const _ipWindows = new Map();

function isRateLimited(ip) {
  const now = Date.now();
  const entry = _ipWindows.get(ip);
  if (!entry || now - entry.windowStart > WINDOW_MS) {
    _ipWindows.set(ip, { count: 1, windowStart: now });
    return false;
  }
  if (entry.count >= RATE_LIMIT) return true;
  entry.count++;
  return false;
}

function registerOrg(fastify, options, done) {
  fastify.post("/v1/orgs/register", async (request, reply) => {
    const ip = request.ip;

    if (isRateLimited(ip)) {
      return reply
        .code(429)
        .send({ error: "Too many signup attempts. Try again later." });
    }

    const body = request.body;

    if (!body.name || typeof body.name !== "string") {
      return reply.code(400).send({ error: "name is required" });
    }

    // FIX: validate name length and characters
    const name = body.name.trim();
    if (name.length === 0) {
      return reply.code(400).send({ error: "name cannot be blank" });
    }
    if (name.length > 64) {
      return reply
        .code(400)
        .send({ error: "name must be 64 characters or fewer" });
    }
    if (!NAME_PATTERN.test(name)) {
      return reply.code(400).send({
        error:
          "name may only contain letters, numbers, hyphens, and underscores",
      });
    }

    const existing = await db.query(api.agents.getOrgByName, { name });
    if (existing) {
      return reply
        .code(409)
        .send({ error: "An org with that name already exists" });
    }

    const orgId = `org_${uuidv4().replace(/-/g, "").slice(0, 20)}`;
    const apiKey = `sk_live_${uuidv4().replace(/-/g, "").slice(0, 32)}`;

    await db.mutation(api.agents.createOrg, {
      name,
      apiKey,
      orgId,
      plan: "free",
    });

    return reply.code(201).send({
      org_id: orgId,
      api_key: apiKey,
      name,
      plan: "free",
      message: "Store your api_key somewhere safe.",
    });
  });

  done();
}

export default registerOrg;
