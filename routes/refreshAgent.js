import { SignJWT } from "jose";
import { api } from "../convex/_generated/api.js";
import { requireAuth, db } from "../lib/auth.js";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

function refreshAgent(fastify, options, done) {
  fastify.post("/v1/agents/:agentId/refresh", async (request, reply) => {
    const { agentId } = request.params;

    const org = await requireAuth(request, reply);
    if (!org) return;

    const agent = await db.query(api.agents.getAgentById, { agentId });
    if (!agent || agent.orgId !== org.orgId) {
      return reply.code(404).send({ error: "Agent not found" });
    }

    if (agent.revoked) {
      return reply.code(403).send({ error: "Cannot refresh a revoked agent" });
    }

    const now = Math.floor(Date.now() / 1000);

    // FIX: expiresAt and setExpirationTime were mismatched (30 days vs "24h").
    // Both now use the same value so the stored record and the JWT agree.
    const TTL_MS = 30 * 24 * 60 * 60 * 1000;
    const expiresAt = new Date(Date.now() + TTL_MS);

    const token = await new SignJWT({
      agent_id: agent.agentId,
      agent_name: agent.name,
      owner_org: agent.orgId,
      capabilities: agent.capabilities,
      trust_level: agent.trustLevel,
      model: agent.model || "unknown",
    })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(agent.agentId)
      .setIssuer(process.env.JWT_ISSUER)
      .setIssuedAt(now)
      .setExpirationTime(expiresAt) // was hardcoded "24h" — now matches expiresAt
      .sign(JWT_SECRET);

    await db.mutation(api.agents.updateAgent, {
      agentId,
      expiresAt: expiresAt.toISOString(),
    });

    await db.mutation(api.agents.logAuditEvent, {
      agentId,
      orgId: org.orgId,
      action: "agent.token_refreshed",
      detail: `new expiry: ${expiresAt.toISOString()}`,
    });

    return reply.send({
      agent_id: agent.agentId,
      token,
      expires_at: expiresAt.toISOString(),
      capabilities: agent.capabilities,
    });
  });

  done();
}

export default refreshAgent;
