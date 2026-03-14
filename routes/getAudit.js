import { api } from "../convex/_generated/api.js";
import { requireAuth, db } from "../lib/auth.js";

function getAudit(fastify, options, done) {
  fastify.get("/v1/agents/:agentId/audit", async (request, reply) => {
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

    const events = await db.query(api.agents.getAuditEvents, { agentId });

    return reply.send({
      agent_id: agentId,
      total_events: events.length,
      events: events.map((e) => ({
        action: e.action,
        detail: e.detail,
        created_at: e._creationTime,
      })),
    });
  });

  done();
}

export default getAudit;
