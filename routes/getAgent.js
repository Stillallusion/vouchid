import { api } from "../convex/_generated/api.js";
import { requireAuth, db } from "../lib/auth.js";

function getAgent(fastify, options, done) {
  fastify.get("/v1/agents/:agentId", async (request, reply) => {
    const { agentId } = request.params;

    const org = await requireAuth(request, reply);
    if (!org) return;

    const agent = await db.query(api.agents.getAgentById, { agentId });

    if (!agent) {
      return reply.code(404).send({ error: "Agent not found" });
    }

    if (agent.orgId !== org.orgId) {
      return reply
        .code(403)
        .send({ error: "This agent does not belong to your org" });
    }

    return reply.send({
      agent_id: agent.agentId,
      name: agent.name,
      org_id: agent.orgId,
      capabilities: agent.capabilities,
      trust_level: agent.trustLevel,
      model: agent.model,
      revoked: agent.revoked,
      created_at: agent._creationTime,
      expires_at: agent.expiresAt,
    });
  });

  done();
}

export default getAgent;
