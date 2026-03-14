import Fastify from "fastify";
import cors from "@fastify/cors";
import registerAgent from "./routes/registerAgent.js";
import verifyAgent from "./routes/verifyAgent.js";
import revokeAgent from "./routes/revokeAgent.js";
import registerOrg from "./routes/registerOrg.js";
import getAudit from "./routes/getAudit.js";
import getAgent from "./routes/getAgent.js";
import listAgents from "./routes/listAgents.js";
import getReputation from "./routes/getReputation.js";
import checkPermission from "./routes/checkPermission.js";
import setPermission from "./routes/setPermission.js";
import getApprovals from "./routes/getApprovals.js";
import updateAgent from "./routes/updateAgent.js";
import refreshAgent from "./routes/refreshAgent.js";

const fastify = Fastify({ logger: true });

fastify.register(cors, {
  origin: process.env.ALLOWED_ORIGIN || "http://localhost:3000",
  methods: ["GET", "POST", "DELETE", "PUT"],
});

fastify.register(registerOrg);
fastify.register(registerAgent);
fastify.register(verifyAgent);
fastify.register(revokeAgent);
fastify.register(getAgent);
fastify.register(getAudit);
fastify.register(listAgents);
fastify.register(getReputation);
fastify.register(checkPermission);
fastify.register(setPermission);
fastify.register(getApprovals);
fastify.register(updateAgent);
fastify.register(refreshAgent);

try {
  await fastify.listen({ port: process.env.PORT || 3000 });
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
