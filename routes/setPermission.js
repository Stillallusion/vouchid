import { api } from "../convex/_generated/api.js";
import { requireAuth, db } from "../lib/auth.js";

function setPermission(fastify, options, done) {
  fastify.post("/v1/agents/:agentId/permissions", async (request, reply) => {
    const { agentId } = request.params;
    const body = request.body;

    const org = await requireAuth(request, reply);
    if (!org) return;

    if (!body.capability) {
      return reply.code(400).send({ error: "capability is required" });
    }

    const agent = await db.query(api.agents.getAgentById, { agentId });
    if (!agent || agent.orgId !== org.orgId) {
      return reply.code(404).send({ error: "Agent not found" });
    }

    await db.mutation(api.agents.createPermission, {
      agentId,
      orgId: org.orgId,
      capability: body.capability,
      rateLimit: body.rate_limit || undefined,
      maxAmount: body.max_amount || undefined,
      requireHumanApproval: body.require_human_approval || false,
    });

    return reply.code(201).send({
      agent_id: agentId,
      capability: body.capability,
      rate_limit: body.rate_limit,
      max_amount: body.max_amount,
      require_human_approval: body.require_human_approval || false,
    });
  });

  done();
}

export default setPermission;
