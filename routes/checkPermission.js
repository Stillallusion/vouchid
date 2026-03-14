import dotenv from "dotenv";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";
dotenv.config();

const db = new ConvexHttpClient(process.env.CONVEX_URL);

function checkPermission(fastify, options, done) {
  fastify.post("/v1/agents/check-permission", async (request, reply) => {
    const { agent_id, capability, context } = request.body;

    // 1. Validate inputs
    if (!agent_id || !capability) {
      return reply
        .code(400)
        .send({ error: "agent_id and capability are required" });
    }

    // 2. Verify org API key
    const authHeader = request.headers["authorization"] || "";
    const apiKey = authHeader.replace("Bearer ", "");
    const org = await db.query(api.agents.getOrgByApiKey, { apiKey });

    if (!org) {
      return reply.code(401).send({ error: "Invalid API key" });
    }

    // 3. Get the agent
    const agent = await db.query(api.agents.getAgentById, {
      agentId: agent_id,
    });

    if (!agent || agent.revoked) {
      return reply.code(403).send({
        allowed: false,
        reason: "Agent does not exist or has been revoked",
      });
    }

    // 4. Check agent actually has this capability
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

    // 5. Get the permission policy for this capability
    const policy = await db.query(api.agents.getPermission, {
      agentId: agent_id,
      capability,
    });

    // If no policy exists, default to allowed
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

    // 6. Check rate limit
    if (policy.rateLimit) {
      const rateLimitResult = await db.mutation(
        api.agents.checkAndIncrementRateLimit,
        {
          agentId: agent_id,
          capability,
          maxPerHour: policy.rateLimit,
        },
      );

      if (!rateLimitResult.allowed) {
        await db.mutation(api.agents.logAuditEvent, {
          agentId: agent_id,
          orgId: org.orgId,
          action: "permission.rate_limited",
          detail: `limit: ${policy.rateLimit}/hr, resets: ${new Date(rateLimitResult.resetsAt).toISOString()}`,
        });
        return reply.send({
          allowed: false,
          reason: "Rate limit exceeded",
          limit: policy.rateLimit,
          remaining: 0,
          resets_at: new Date(rateLimitResult.resetsAt).toISOString(),
        });
      }
    }

    // 7. Check amount limit
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

    // 8. Check if human approval is required
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

    // 9. All checks passed
    await db.mutation(api.agents.logAuditEvent, {
      agentId: agent_id,
      orgId: org.orgId,
      action: "permission.allowed",
      detail: `capability: ${capability}`,
    });

    return reply.send({
      allowed: true,
      capability,
      agent_id,
    });
  });

  done();
}

export default checkPermission;
