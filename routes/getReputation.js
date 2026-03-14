import dotenv from "dotenv";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";
dotenv.config();

const db = new ConvexHttpClient(process.env.CONVEX_URL);

function getReputation(fastify, options, done) {
  fastify.get("/v1/agents/:agentId/reputation", async (request, reply) => {
    const { agentId } = request.params;

    // Verify API key
    const authHeader = request.headers["authorization"] || "";
    const apiKey = authHeader.replace("Bearer ", "");
    const org = await db.query(api.agents.getOrgByApiKey, { apiKey });

    if (!org) {
      return reply.code(401).send({ error: "Invalid API key" });
    }

    const reputation = await db.query(api.agents.getReputation, { agentId });

    if (!reputation) {
      return reply.code(404).send({ error: "Agent not found" });
    }

    return reply.send(reputation);
  });

  done();
}

export default getReputation;
