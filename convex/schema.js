import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  organizations: defineTable({
    name: v.string(),
    apiKey: v.string(),
    orgId: v.string(),
    plan: v.string(),
  }).index("by_apiKey", ["apiKey"]),

  agents: defineTable({
    agentId: v.string(),
    name: v.string(),
    orgId: v.string(),
    capabilities: v.array(v.string()),
    trustLevel: v.string(),
    trustScore: v.number(),
    totalVerifications: v.number(),
    failedVerifications: v.number(),
    model: v.optional(v.string()),
    revoked: v.boolean(),
    expiresAt: v.string(),
  }).index("by_agentId", ["agentId"]),

  auditEvents: defineTable({
    agentId: v.string(),
    orgId: v.string(),
    action: v.string(),
    detail: v.optional(v.string()),
  }),

  // NEW — one policy per agent per capability
  permissions: defineTable({
    agentId: v.string(),
    orgId: v.string(),
    capability: v.string(), // e.g. "write:payments"
    rateLimit: v.optional(v.number()), // max requests per hour
    maxAmount: v.optional(v.number()), // max $ per action
    requireHumanApproval: v.optional(v.boolean()), // flag for human review
    enabled: v.boolean(),
  })
    .index("by_agentId", ["agentId"])
    .index("by_agentId_capability", ["agentId", "capability"]),

  // NEW — tracks request counts for rate limiting
  rateLimitBuckets: defineTable({
    agentId: v.string(),
    capability: v.string(),
    windowStart: v.number(), // timestamp of current hour window
    count: v.number(), // requests in this window
  }).index("by_agentId_capability", ["agentId", "capability"]),

  // NEW — pending human approvals
  approvalRequests: defineTable({
    agentId: v.string(),
    orgId: v.string(),
    capability: v.string(),
    context: v.string(), // JSON string of the action context
    status: v.string(), // "pending", "approved", "denied"
    decidedAt: v.optional(v.number()),
  })
    .index("by_agentId", ["agentId"])
    .index("by_orgId", ["orgId"]),
});
