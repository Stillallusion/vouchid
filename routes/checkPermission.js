import { api } from "../convex/_generated/api.js";
import { requireAuth, db } from "../lib/auth.js";

function checkPermission(fastify, options, done) {
  fastify.post("/v1/agents/check-permission", async (request, reply) => {
    const { agent_id, capability, context } = request.body;

    if (!agent_id || !capability) {
      return reply
        .code(400)
        .send({ error: "agent_id and capability are required" });
    }

    const org = await requireAuth(request, reply);
    if (!org) return;

    const agent = await db.query(api.agents.getAgentById, {
      agentId: agent_id,
    });

    if (!agent || agent.revoked) {
      return reply.code(403).send({
        allowed: false,
        reason: "Agent does not exist or has been revoked",
      });
    }

    if (!agent.capabilities.includes(capability)) {
      await db.mutation(api.agents.logAuditEvent, {
        agentId: agent_id,
        orgId: org.orgId,
        action: "permission.denied",
        detail: `capability not granted: ${capability}`,
      });
      return reply.send({
        allowed: false,
        reason: `Agent does not have capability: ${capability}`,
      });
    }

    const policy = await db.query(api.agents.getPermission, {
      agentId: agent_id,
      capability,
    });

    if (!policy || !policy.enabled) {
      await db.mutation(api.agents.logAuditEvent, {
        agentId: agent_id,
        orgId: org.orgId,
        action: "permission.allowed",
        detail: `no policy set for: ${capability}`,
      });
      return reply.send({
        allowed: true,
        reason: "No policy set — allowed by default",
      });
    }

    if (policy.rateLimit) {
      const rl = await db.mutation(api.agents.checkAndIncrementRateLimit, {
        agentId: agent_id,
        capability,
        maxPerHour: policy.rateLimit,
      });
      if (!rl.allowed) {
        await db.mutation(api.agents.logAuditEvent, {
          agentId: agent_id,
          orgId: org.orgId,
          action: "permission.rate_limited",
          detail: `limit: ${policy.rateLimit}/hr, resets: ${new Date(rl.resetsAt).toISOString()}`,
        });
        return reply.send({
          allowed: false,
          reason: "Rate limit exceeded",
          limit: policy.rateLimit,
          remaining: 0,
          resets_at: new Date(rl.resetsAt).toISOString(),
        });
      }
    }

    if (policy.maxAmount && context?.amount) {
      const amount = Number(context.amount);
      if (amount > policy.maxAmount) {
        await db.mutation(api.agents.logAuditEvent, {
          agentId: agent_id,
          orgId: org.orgId,
          action: "permission.amount_exceeded",
          detail: `requested: $${amount}, limit: $${policy.maxAmount}`,
        });
        return reply.send({
          allowed: false,
          reason: `Amount $${amount} exceeds limit of $${policy.maxAmount}`,
          max_amount: policy.maxAmount,
        });
      }
    }

    if (policy.requireHumanApproval) {
      const approval = await db.mutation(api.agents.createApprovalRequest, {
        agentId: agent_id,
        orgId: org.orgId,
        capability,
        context: JSON.stringify(context || {}),
      });
      await db.mutation(api.agents.logAuditEvent, {
        agentId: agent_id,
        orgId: org.orgId,
        action: "permission.awaiting_approval",
        detail: `approval id: ${approval}`,
      });
      return reply.send({
        allowed: false,
        requires_approval: true,
        reason: "This action requires human approval",
        approval_id: approval,
      });
    }

    await db.mutation(api.agents.logAuditEvent, {
      agentId: agent_id,
      orgId: org.orgId,
      action: "permission.allowed",
      detail: `capability: ${capability}`,
    });

    return reply.send({ allowed: true, capability, agent_id });
  });

  done();
}

export default checkPermission;
