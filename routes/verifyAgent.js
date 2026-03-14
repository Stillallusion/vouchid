import dotenv from "dotenv";
import { jwtVerify } from "jose";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";
dotenv.config();

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);
const db = new ConvexHttpClient(process.env.CONVEX_URL);

function verifyAgent(fastify, options, done) {
  fastify.post("/v1/agents/verify", async (request, reply) => {
    const { token, required_capabilities } = request.body;

    if (!token) {
      return reply.code(400).send({ error: "token is required" });
    }

    try {
      // 1. Verify the JWT signature and expiry
      const { payload } = await jwtVerify(token, JWT_SECRET);

      // 2. Look up agent in Convex
      const agent = await db.query(api.agents.getAgentById, {
        agentId: payload.agent_id,
      });

      // 3. Check revocation
      if (!agent || agent.revoked) {
        // Log failed verification — revoked agents trying to verify hurts score
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

      // 4. Check capabilities
      if (required_capabilities && required_capabilities.length > 0) {
        const missing = required_capabilities.filter(
          (cap) => !payload.capabilities.includes(cap),
        );
        if (missing.length > 0) {
          // Capability mismatch — slight score penalty
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

      // 5. All good — update score upward and log success
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

      // 6. Return identity + live reputation score
      return reply.send({
        valid: true,
        agent_id: payload.agent_id,
        agent_name: payload.agent_name,
        owner_org: payload.owner_org,
        capabilities: payload.capabilities,
        trust_level: reputation.trustLevel, // live value, not from JWT
        trust_score: reputation.trustScore, // 0.0 - 1.0
        expires_at: new Date(payload.exp * 1000).toISOString(),
      });
    } catch (error) {
      console.log("Verify error:", error.message, error.stack);
      return reply
        .code(401)
        .send({ valid: false, reason: "Token is invalid or expired" });
    }
  });

  done();
}

export default verifyAgent;
