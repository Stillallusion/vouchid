import dotenv from "dotenv";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";
dotenv.config();

const db = new ConvexHttpClient(process.env.CONVEX_URL);

function setPermission(fastify, options, done) {
  fastify.post("/v1/agents/:agentId/permissions", async (request, reply) => {
    const { agentId } = request.params;
    const body = request.body;

    // 1. Verify org API key
    const authHeader = request.headers["authorization"] || "";
    const apiKey = authHeader.replace("Bearer ", "");
    const org = await db.query(api.agents.getOrgByApiKey, { apiKey });

    if (!org) {
      return reply.code(401).send({ error: "Invalid API key" });
    }

    // 2. Validate body
    if (!body.capability) {
      return reply.code(400).send({ error: "capability is required" });
    }

    // 3. Check agent belongs to this org
    const agent = await db.query(api.agents.getAgentById, { agentId });

    if (!agent || agent.orgId !== org.orgId) {
      return reply.code(404).send({ error: "Agent not found" });
    }

    // 4. Create or update the policy
    await db.mutation(api.agents.createPermission, {
      agentId,
      orgId: org.orgId,
      capability: body.capability,
      rateLimit: body.rate_limit || undefined,
      maxAmount: body.max_amount || undefined,
      requireHumanApproval: body.require_human_approval || false,
    });

    return reply.code(201).send({
      agent_id: agentId,
      capability: body.capability,
      rate_limit: body.rate_limit,
      max_amount: body.max_amount,
      require_human_approval: body.require_human_approval || false,
    });
  });

  done();
}

export default setPermission;
