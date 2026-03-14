import { jwtVerify } from "jose";
import { api } from "../convex/_generated/api.js";
import { db } from "../lib/auth.js";

// JWT_SECRET is safe to load at module level — server.js runs `import "dotenv/config"` first
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

function verifyAgent(fastify, options, done) {
  fastify.post("/v1/agents/verify", async (request, reply) => {
    const { token, required_capabilities } = request.body;

    if (!token) {
      return reply.code(400).send({ error: "token is required" });
    }

    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);

      const agent = await db.query(api.agents.getAgentById, {
        agentId: payload.agent_id,
      });

      if (!agent || agent.revoked) {
        if (agent) {
          await db.mutation(api.agents.updateTrustScore, {
            agentId: payload.agent_id,
            event: "verify_fail",
          });
          await db.mutation(api.agents.logAuditEvent, {
            agentId: payload.agent_id,
            orgId: agent.orgId,
            action: "agent.verify_fail",
            detail: "agent is revoked",
          });
        }
        return reply
          .code(401)
          .send({ valid: false, reason: "Agent has been revoked" });
      }

      if (required_capabilities && required_capabilities.length > 0) {
        const missing = required_capabilities.filter(
          (cap) => !payload.capabilities.includes(cap),
        );
        if (missing.length > 0) {
          await db.mutation(api.agents.updateTrustScore, {
            agentId: payload.agent_id,
            event: "verify_fail",
          });
          await db.mutation(api.agents.logAuditEvent, {
            agentId: agent.agentId,
            orgId: agent.orgId,
            action: "agent.verify_fail",
            detail: `missing capabilities: ${missing.join(", ")}`,
          });
          return reply.code(403).send({
            valid: false,
            reason: `Missing capabilities: ${missing.join(", ")}`,
          });
        }
      }

      const reputation = await db.mutation(api.agents.updateTrustScore, {
        agentId: payload.agent_id,
        event: "verify_success",
      });
      await db.mutation(api.agents.logAuditEvent, {
        agentId: agent.agentId,
        orgId: agent.orgId,
        action: "agent.verify_success",
        detail: `score: ${reputation.trustScore.toFixed(2)}`,
      });

      return reply.send({
        valid: true,
        agent_id: payload.agent_id,
        agent_name: payload.agent_name,
        owner_org: payload.owner_org,
        capabilities: payload.capabilities,
        trust_level: reputation.trustLevel,
        trust_score: reputation.trustScore,
        expires_at: new Date(payload.exp * 1000).toISOString(),
      });
    } catch (error) {
      fastify.log.error({ err: error }, "Token verification failed");
      return reply
        .code(401)
        .send({ valid: false, reason: "Token is invalid or expired" });
    }
  });

  done();
}

export default verifyAgent;
