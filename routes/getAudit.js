import dotenv from "dotenv";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";
dotenv.config();

const db = new ConvexHttpClient(process.env.CONVEX_URL);

function getAudit(fastify, options, done) {
  fastify.get("/v1/agents/:agentId/audit", async (request, reply) => {
    const { agentId } = request.params;

    // 1. Verify the API key so only the owning org can see audit logs
    const authHeader = request.headers["authorization"] || "";
    const apiKey = authHeader.replace("Bearer ", "");
    const org = await db.query(api.agents.getOrgByApiKey, { apiKey });

    if (!org) {
      return reply.code(401).send({ error: "Invalid API key" });
    }

    // 2. Check the agent exists and belongs to this org
    const agent = await db.query(api.agents.getAgentById, { agentId });

    if (!agent) {
      return reply.code(404).send({ error: "Agent not found" });
    }

    if (agent.orgId !== org.orgId) {
      return reply
        .code(403)
        .send({ error: "This agent does not belong to your org" });
    }

    // 3. Fetch all audit events for this agent
    const events = await db.query(api.agents.getAuditEvents, { agentId });

    return reply.send({
      agent_id: agentId,
      total_events: events.length,
      events: events.map((e) => ({
        action: e.action,
        created_at: e._creationTime,
      })),
    });
  });

  done();
}

export default getAudit;
