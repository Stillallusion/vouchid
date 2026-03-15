import { v4 as uuidv4 } from "uuid";
import { api } from "../convex/_generated/api.js";
import { requireAuth, db } from "../lib/auth.js";

function rotateKey(fastify, options, done) {
  // POST /v1/orgs/rotate-key — generate a new API key, invalidate the old one
  fastify.post("/v1/orgs/rotate-key", async (request, reply) => {
    const org = await requireAuth(request, reply);
    if (!org) return;

    const newApiKey = `sk_live_${uuidv4().replace(/-/g, "").slice(0, 32)}`;

    await db.mutation(api.agents.rotateOrgApiKey, {
      orgId: org.orgId,
      newApiKey,
    });

    await db.mutation(api.agents.logAuditEvent, {
      agentId: "system",
      orgId: org.orgId,
      action: "org.api_key_rotated",
      detail: "API key rotated by org owner",
    });

    return reply.send({
      api_key: newApiKey,
      message:
        "API key rotated. Update your .env — the old key is now invalid.",
    });
  });

  done();
}

export default rotateKey;
