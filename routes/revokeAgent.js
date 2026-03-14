import { api } from "../convex/_generated/api.js";
import { requireAuth, db } from "../lib/auth.js";

function revokeAgent(fastify, options, done) {
  fastify.delete("/v1/agents/:agentId/revoke", async (request, reply) => {
    const { agentId } = request.params;

    // 1. Verify API key — was completely missing before
    const org = await requireAuth(request, reply);
    if (!org) return;

    // 2. Check the agent exists and belongs to this org
    const agent = await db.query(api.agents.getAgentById, { agentId });

    if (!agent || agent.orgId !== org.orgId) {
      return reply.code(404).send({ error: "Agent not found" });
    }

    // 3. Check it isn't already revoked
    if (agent.revoked) {
      return reply.code(400).send({ error: "Agent is already revoked" });
    }

    // 4. Revoke it in Convex
    await db.mutation(api.agents.revokeAgent, { agentId });

    // 5. Log the audit event
    await db.mutation(api.agents.logAuditEvent, {
      agentId,
      orgId: org.orgId,
      action: "agent.revoked",
    });

    return reply.send({ revoked: true, agent_id: agentId });
  });

  done();
}

export default revokeAgent;
