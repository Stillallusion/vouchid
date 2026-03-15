import { api } from "../convex/_generated/api.js";
import { requireAuth, db } from "../lib/auth.js";

function getOrg(fastify, options, done) {
  // GET /v1/orgs/me — return org details including the API key
  fastify.get("/v1/orgs/me", async (request, reply) => {
    const org = await requireAuth(request, reply);
    if (!org) return;

    return reply.send({
      org_id: org.orgId,
      name: org.name,
      api_key: org.apiKey,
      plan: org.plan,
    });
  });

  done();
}

export default getOrg;
