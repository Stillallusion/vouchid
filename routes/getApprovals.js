import dotenv from "dotenv";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";
dotenv.config();

const db = new ConvexHttpClient(process.env.CONVEX_URL);

function getApprovals(fastify, options, done) {
  // GET all pending approvals for an org
  fastify.get("/v1/approvals", async (request, reply) => {
    const authHeader = request.headers["authorization"] || "";
    const apiKey = authHeader.replace("Bearer ", "");
    const org = await db.query(api.agents.getOrgByApiKey, { apiKey });

    if (!org) return reply.code(401).send({ error: "Invalid API key" });

    const approvals = await db.query(api.agents.getPendingApprovals, {
      orgId: org.orgId,
    });

    return reply.send({
      total: approvals.length,
      approvals: approvals.map((a) => ({
        approval_id: a._id,
        agent_id: a.agentId,
        capability: a.capability,
        context: JSON.parse(a.context),
        status: a.status,
        created_at: a._creationTime,
      })),
    });
  });

  // POST approve or deny
  fastify.post("/v1/approvals/:approvalId/decide", async (request, reply) => {
    const { approvalId } = request.params;
    const { decision } = request.body;

    const authHeader = request.headers["authorization"] || "";
    const apiKey = authHeader.replace("Bearer ", "");
    const org = await db.query(api.agents.getOrgByApiKey, { apiKey });

    if (!org) return reply.code(401).send({ error: "Invalid API key" });

    if (!["approved", "denied"].includes(decision)) {
      return reply
        .code(400)
        .send({ error: "decision must be 'approved' or 'denied'" });
    }

    await db.mutation(api.agents.decideApproval, {
      approvalId,
      decision,
    });

    return reply.send({ decided: true, decision });
  });

  done();
}

export default getApprovals;
