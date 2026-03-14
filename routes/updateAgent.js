import { api } from "../convex/_generated/api.js";
import { requireAuth, db } from "../lib/auth.js";

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
