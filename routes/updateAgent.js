import { api } from "../convex/_generated/api.js";
import { requireAuth, db } from "../lib/auth.js";

// Rate limit: 30 updates per agent per hour.
// High enough to not block normal usage, low enough to stop abuse.
const RATE_LIMIT = 30;
const WINDOW_MS = 60 * 60 * 1000;
const _windows = new Map(); // key: `${orgId}:${agentId}`

function isRateLimited(orgId, agentId) {
  const key = `${orgId}:${agentId}`;
  const now = Date.now();
  const entry = _windows.get(key);

  if (!entry || now - entry.windowStart > WINDOW_MS) {
    _windows.set(key, { count: 1, windowStart: now });
    return false;
  }
  if (entry.count >= RATE_LIMIT) return true;
  entry.count++;
  return false;
}

// Capability format: scope:action — e.g. read:data, write:payments
const CAP_PATTERN = /^[\w-]+:[\w:*-]+$/;

function validateCapabilities(capabilities) {
  if (!Array.isArray(capabilities)) return "capabilities must be an array";
  if (capabilities.length === 0) return "capabilities cannot be empty";
  if (capabilities.length > 50) return "maximum 50 capabilities per agent";

  for (const cap of capabilities) {
    if (typeof cap !== "string") return `invalid capability: ${cap}`;
    if (!CAP_PATTERN.test(cap))
      return `invalid format "${cap}" — use scope:action e.g. read:data`;
  }
  return null; // valid
}

function updateAgent(fastify, options, done) {
  fastify.patch("/v1/agents/:agentId", async (request, reply) => {
    const { agentId } = request.params;
    const body = request.body;

    const org = await requireAuth(request, reply);
    if (!org) return;

    const agent = await db.query(api.agents.getAgentById, { agentId });
    if (!agent || agent.orgId !== org.orgId) {
      return reply.code(404).send({ error: "Agent not found" });
    }

    // Rate limit keyed per org+agent so one bad actor can't hammer a specific agent
    if (isRateLimited(org.orgId, agentId)) {
      return reply.code(429).send({
        error: `Update limit reached (${RATE_LIMIT} per hour). Try again later.`,
      });
    }

    // Validate capabilities if provided
    if (body.capabilities !== undefined) {
      const capError = validateCapabilities(body.capabilities);
      if (capError) return reply.code(400).send({ error: capError });
    }

    await db.mutation(api.agents.updateAgent, {
      agentId,
      capabilities: body.capabilities || undefined,
      model: body.model || undefined,
    });

    await db.mutation(api.agents.logAuditEvent, {
      agentId,
      orgId: org.orgId,
      action: "agent.updated",
      detail: `updated: ${Object.keys(body).join(", ")}`,
    });

    const updated = await db.query(api.agents.getAgentById, { agentId });
    return reply.send({
      agent_id: updated.agentId,
      name: updated.name,
      capabilities: updated.capabilities,
      model: updated.model,
      trust_level: updated.trustLevel,
    });
  });

  done();
}

export default updateAgent;
