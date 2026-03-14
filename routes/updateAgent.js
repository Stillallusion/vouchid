import dotenv from "dotenv";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";
dotenv.config();

const db = new ConvexHttpClient(process.env.CONVEX_URL);

function updateAgent(fastify, options, done) {
  fastify.patch("/v1/agents/:agentId", async (request, reply) => {
    const { agentId } = request.params;
    const body = request.body;

    // Verify API key
    const authHeader = request.headers["authorization"] || "";
    const apiKey = authHeader.replace("Bearer ", "");
    const org = await db.query(api.agents.getOrgByApiKey, { apiKey });
    if (!org) return reply.code(401).send({ error: "Invalid API key" });

    // Check agent belongs to this org
    const agent = await db.query(api.agents.getAgentById, { agentId });
    if (!agent || agent.orgId !== org.orgId) {
      return reply.code(404).send({ error: "Agent not found" });
    }

    // Apply updates
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

    // Fetch and return the updated agent
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
