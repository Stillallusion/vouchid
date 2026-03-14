import { api } from "../convex/_generated/api.js";
import { requireAuth, db } from "../lib/auth.js";

function getReputation(fastify, options, done) {
  fastify.get("/v1/agents/:agentId/reputation", async (request, reply) => {
    const { agentId } = request.params;

    const org = await requireAuth(request, reply);
    if (!org) return;

    // Verify the agent belongs to this org before exposing reputation data
    const agent = await db.query(api.agents.getAgentById, { agentId });

    if (!agent || agent.orgId !== org.orgId) {
      return reply.code(404).send({ error: "Agent not found" });
    }

    const reputation = await db.query(api.agents.getReputation, { agentId });

    if (!reputation) {
      return reply.code(404).send({ error: "Agent not found" });
    }

    return reply.send(reputation);
  });

  done();
}

export default getReputation;
