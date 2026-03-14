import dotenv from "dotenv";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";
dotenv.config();

const db = new ConvexHttpClient(process.env.CONVEX_URL);

function revokeAgent(fastify, options, done) {
  fastify.delete("/v1/agents/:agentId/revoke", async (request, reply) => {
    const { agentId } = request.params;

    // 1. Check the agent actually exists
    const agent = await db.query(api.agents.getAgentById, { agentId });

    if (!agent) {
      return reply.code(404).send({ error: "Agent not found" });
    }

    // 2. Check it isn't already revoked
    if (agent.revoked) {
      return reply.code(400).send({ error: "Agent is already revoked" });
    }

    // 3. Revoke it in Convex
    await db.mutation(api.agents.revokeAgent, { agentId });

    // 4. Log the audit event
    await db.mutation(api.agents.logAuditEvent, {
      agentId,
      orgId: agent.orgId,
      action: "agent.revoked",
    });

    return reply.send({ revoked: true, agent_id: agentId });
  });

  done();
}

export default revokeAgent;
