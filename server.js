// Must be first — ESM-safe dotenv, runs before any other module code
import "dotenv/config";

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

// ── Fail loudly at startup if required env vars are missing ───────────────
const REQUIRED_ENV = ["JWT_SECRET", "CONVEX_URL", "JWT_ISSUER"];
const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missing.length > 0) {
  console.error(
    `[VouchID] Missing required environment variables: ${missing.join(", ")}`,
  );
  process.exit(1);
}

const fastify = Fastify({ logger: true });

fastify.register(cors, {
  origin: process.env.ALLOWED_ORIGIN || "http://localhost:3000",
  methods: ["GET", "POST", "DELETE", "PUT", "PATCH"],
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
  await fastify.listen({ port: process.env.PORT || 3000, host: "0.0.0.0" });
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
