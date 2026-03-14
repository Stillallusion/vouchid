import dotenv from "dotenv";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";
dotenv.config();

const db = new ConvexHttpClient(process.env.CONVEX_URL);

function listAgents(fastify, options, done) {
  fastify.get("/v1/agents", async (request, reply) => {
    // 1. Verify API key
    const authHeader = request.headers["authorization"] || "";
    const apiKey = authHeader.replace("Bearer ", "");
    const org = await db.query(api.agents.getOrgByApiKey, { apiKey });

    if (!org) {
      return reply.code(401).send({ error: "Invalid API key" });
    }

    // 2. Fetch all agents for this org
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
