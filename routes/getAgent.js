import dotenv from "dotenv";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";
dotenv.config();

const db = new ConvexHttpClient(process.env.CONVEX_URL);

function getAgent(fastify, options, done) {
  fastify.get("/v1/agents/:agentId", async (request, reply) => {
    const { agentId } = request.params;

    // 1. Verify API key
    const authHeader = request.headers["authorization"] || "";
    const apiKey = authHeader.replace("Bearer ", "");
    const org = await db.query(api.agents.getOrgByApiKey, { apiKey });

    if (!org) {
      return reply.code(401).send({ error: "Invalid API key" });
    }

    // 2. Fetch the agent
    const agent = await db.query(api.agents.getAgentById, { agentId });

    if (!agent) {
      return reply.code(404).send({ error: "Agent not found" });
    }

    // 3. Make sure it belongs to this org
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
