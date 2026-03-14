import { SignJWT } from "jose";
import { v4 as uuidv4 } from "uuid";
import { api } from "../convex/_generated/api.js";
import { requireAuth, db } from "../lib/auth.js";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

function registerAgent(fastify, options, done) {
  fastify.post("/v1/agents/register", async (request, reply) => {
    const org = await requireAuth(request, reply);
    if (!org) return;

    const body = request.body;

    if (!body.name || typeof body.name !== "string") {
      return reply
        .code(400)
        .send({ error: "name is required and must be a string" });
    }

    if (!Array.isArray(body.capabilities) || body.capabilities.length === 0) {
      return reply.code(400).send({
        error: "capabilities is required and must be a non-empty array",
      });
    }

    const rawId = uuidv4().replace(/-/g, "");
    const agentId = `agent_${rawId.slice(0, 20)}`;

    const ttlMs = (body.ttl_hours || 30 * 24) * 60 * 60 * 1000;
    const expiresAt = new Date(Date.now() + ttlMs);

    const token = await new SignJWT({
      agent_id: agentId,
      agent_name: body.name,
      owner_org: org.orgId,
      capabilities: body.capabilities,
      trust_level: "untrusted",
      model: body.model || "unknown",
    })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(agentId)
      .setIssuer(process.env.JWT_ISSUER)
      .setIssuedAt()
      .setExpirationTime(expiresAt)
      .sign(JWT_SECRET);

    await db.mutation(api.agents.createAgent, {
      agentId,
      name: body.name,
      orgId: org.orgId,
      capabilities: body.capabilities,
      trustLevel: "untrusted",
      model: body.model || "unknown",
      expiresAt: expiresAt.toISOString(),
    });

    await db.mutation(api.agents.logAuditEvent, {
      agentId,
      orgId: org.orgId,
      action: "agent.registered",
    });

    return reply.code(201).send({
      agent_id: agentId,
      token,
      expires_at: expiresAt.toISOString(),
      capabilities: body.capabilities,
      trust_level: "untrusted",
    });
  });

  done();
}

export default registerAgent;
