import dotenv from "dotenv";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";
import { v4 as uuidv4 } from "uuid";
dotenv.config();

const db = new ConvexHttpClient(process.env.CONVEX_URL);

function registerOrg(fastify, options, done) {
  fastify.post("/v1/orgs/register", async (request, reply) => {
    const body = request.body;

    // 1. Validate the body
    if (!body.name || typeof body.name !== "string") {
      return reply.code(400).send({ error: "name is required" });
    }

    // 2. Check the org name isn't already taken
    const existing = await db.query(api.agents.getOrgByName, {
      name: body.name,
    });

    if (existing) {
      return reply
        .code(409)
        .send({ error: "An org with that name already exists" });
    }

    // 3. Generate a unique org ID and API key
    const orgId = `org_${uuidv4().replace(/-/g, "").slice(0, 20)}`;
    const apiKey = `sk_live_${uuidv4().replace(/-/g, "").slice(0, 32)}`;

    // 4. Save to Convex
    await db.mutation(api.agents.createOrg, {
      name: body.name,
      apiKey,
      orgId,
      plan: "free",
    });

    // 5. Return the org ID and API key
    // This is the ONLY time the API key is returned — just like Stripe
    return reply.code(201).send({
      org_id: orgId,
      api_key: apiKey,
      name: body.name,
      plan: "free",
      message: "Store your api_key somewhere safe — it won't be shown again",
    });
  });

  done();
}

export default registerOrg;
