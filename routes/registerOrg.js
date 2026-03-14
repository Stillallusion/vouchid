import { api } from "../convex/_generated/api.js";
import { v4 as uuidv4 } from "uuid";
import { db } from "../lib/auth.js";

// Simple in-memory rate limiter for org registration.
// Limits each IP to 5 signups per hour.
// For production scale, replace with @fastify/rate-limit + Redis.
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

    const existing = await db.query(api.agents.getOrgByName, {
      name: body.name,
    });

    if (existing) {
      return reply
        .code(409)
        .send({ error: "An org with that name already exists" });
    }

    const orgId = `org_${uuidv4().replace(/-/g, "").slice(0, 20)}`;
    const apiKey = `sk_live_${uuidv4().replace(/-/g, "").slice(0, 32)}`;

    await db.mutation(api.agents.createOrg, {
      name: body.name,
      apiKey,
      orgId,
      plan: "free",
    });

    return reply.code(201).send({
      org_id: orgId,
      api_key: apiKey,
      name: body.name,
      plan: "free",
      message: "Store your api_key somewhere safe — it won't be shown again",
    });
  });

  done();
}

export default registerOrg;
