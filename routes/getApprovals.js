import { api } from "../convex/_generated/api.js";
import { requireAuth, db } from "../lib/auth.js";

function getApprovals(fastify, options, done) {
  fastify.get("/v1/approvals", async (request, reply) => {
    const org = await requireAuth(request, reply);
    if (!org) return;

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

  fastify.post("/v1/approvals/:approvalId/decide", async (request, reply) => {
    const { approvalId } = request.params;
    const { decision } = request.body;

    const org = await requireAuth(request, reply);
    if (!org) return;

    if (!["approved", "denied"].includes(decision)) {
      return reply
        .code(400)
        .send({ error: "decision must be 'approved' or 'denied'" });
    }

    await db.mutation(api.agents.decideApproval, { approvalId, decision });

    return reply.send({ decided: true, decision });
  });

  done();
}

export default getApprovals;
