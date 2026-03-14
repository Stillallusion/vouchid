import { api } from "../convex/_generated/api.js";
import { requireAuth, db } from "../lib/auth.js";

function listAgents(fastify, options, done) {
  fastify.get("/v1/agents", async (request, reply) => {
    const org = await requireAuth(request, reply);
    if (!org) return;

    const agents = await db.query(api.agents.getAgentsByOrg, {
      orgId: org.orgId,
    });

    return reply.send({
      org_id: org.orgId,
      total: agents.length,
      agents: agents.map((a) => ({
        agent_id: a.agentId,
        name: a.name,
        capabilities: a.capabilities,
        trust_level: a.trustLevel,
        revoked: a.revoked,
        created_at: a._creationTime,
        expires_at: a.expiresAt,
      })),
    });
  });

  done();
}

export default listAgents;
