import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// ── Get an org by its API key ─────────────────────────
// Called during /register to verify the caller's key
export const getOrgByApiKey = query({
  args: { apiKey: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("organizations")
      .withIndex("by_apiKey", (q) => q.eq("apiKey", args.apiKey))
      .first();
  },
});

// ── Save a new agent to the database ─────────────────
// Called after we create the JWT in /register
export const createAgent = mutation({
  args: {
    agentId: v.string(),
    name: v.string(),
    orgId: v.string(),
    capabilities: v.array(v.string()),
    trustLevel: v.string(),
    model: v.optional(v.string()),
    expiresAt: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("agents", {
      ...args,
      revoked: false,
      trustScore: 0.5, // start at 0.5 — neutral, not trusted, not untrusted
      totalVerifications: 0,
      failedVerifications: 0,
    });
  },
});

// ── Get an agent by its ID ────────────────────────────
// Called during /verify to check if the agent exists and isn't revoked
export const getAgentById = query({
  args: { agentId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("agents")
      .withIndex("by_agentId", (q) => q.eq("agentId", args.agentId))
      .first();
  },
});

// ── Revoke an agent ───────────────────────────────────
// Called during /revoke to permanently kill an agent's identity
export const revokeAgent = mutation({
  args: { agentId: v.string() },
  handler: async (ctx, args) => {
    const agent = await ctx.db
      .query("agents")
      .withIndex("by_agentId", (q) => q.eq("agentId", args.agentId))
      .first();

    if (!agent) return null;

    await ctx.db.patch(agent._id, { revoked: true });
    return true;
  },
});

// ── Write an audit event ──────────────────────────────
// Called every time something important happens
export const logAuditEvent = mutation({
  args: {
    agentId: v.string(),
    orgId: v.string(),
    action: v.string(),
    detail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("auditEvents", args);
  },
});

// ── Seed the test organization ────────────────────────
// Run this once manually to create your test org
export const seedTestOrg = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db
      .query("organizations")
      .withIndex("by_apiKey", (q) => q.eq("apiKey", "sk_test_abc123"))
      .first();

    if (existing) return "Already seeded";

    await ctx.db.insert("organizations", {
      name: "Test Company",
      apiKey: "sk_test_abc123",
      orgId: "org_testcompany",
      plan: "free",
    });

    return "Seeded successfully";
  },
});

export const createOrg = mutation({
  args: {
    name: v.string(),
    apiKey: v.string(),
    orgId: v.string(),
    plan: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("organizations", args);
  },
});

// ── Check if an org name already exists ──────────────
export const getOrgByName = query({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("organizations")
      .filter((q) => q.eq(q.field("name"), args.name))
      .first();
  },
});

// ── Get audit events for an agent ────────────────────
export const getAuditEvents = query({
  args: { agentId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("auditEvents")
      .filter((q) => q.eq(q.field("agentId"), args.agentId))
      .collect();
  },
});

// ── Get all agents for an org ─────────────────────────
export const getAgentsByOrg = query({
  args: { orgId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("agents")
      .filter((q) => q.eq(q.field("orgId"), args.orgId))
      .collect();
  },
});

export const updateTrustScore = mutation({
  args: {
    agentId: v.string(),
    event: v.string(), // "verify_success", "verify_fail", "revoked"
  },
  handler: async (ctx, args) => {
    const agent = await ctx.db
      .query("agents")
      .withIndex("by_agentId", (q) => q.eq("agentId", args.agentId))
      .first();

    if (!agent) return null;

    // Start from current values
    let totalVerifications = agent.totalVerifications || 0;
    let failedVerifications = agent.failedVerifications || 0;
    let trustScore = agent.trustScore || 0.5;

    // Update counts based on what happened
    if (args.event === "verify_success") {
      totalVerifications += 1;
      // Each success nudges score up slightly, max 1.0
      trustScore = Math.min(1.0, trustScore + 0.02);
    }

    if (args.event === "verify_fail") {
      totalVerifications += 1;
      failedVerifications += 1;
      // Each failure nudges score down more than success nudges up
      trustScore = Math.max(0.0, trustScore - 0.05);
    }

    if (args.event === "revoked") {
      // Revocation immediately kills the score
      trustScore = 0.0;
    }

    // Calculate trust level from score
    let trustLevel = "untrusted";
    if (trustScore >= 0.8) trustLevel = "trusted";
    else if (trustScore >= 0.6) trustLevel = "verified";
    else if (trustScore >= 0.3) trustLevel = "low";

    // Save updated values
    await ctx.db.patch(agent._id, {
      trustScore,
      trustLevel,
      totalVerifications,
      failedVerifications,
    });

    return { trustScore, trustLevel };
  },
});

// ── Get full reputation breakdown for an agent ────────
export const getReputation = query({
  args: { agentId: v.string() },
  handler: async (ctx, args) => {
    const agent = await ctx.db
      .query("agents")
      .withIndex("by_agentId", (q) => q.eq("agentId", args.agentId))
      .first();

    if (!agent) return null;

    const total = agent.totalVerifications || 0;
    const failed = agent.failedVerifications || 0;
    const success = total - failed;

    return {
      agentId: agent.agentId,
      trustScore: agent.trustScore || 0.5,
      trustLevel: agent.trustLevel,
      totalVerifications: total,
      successfulVerifications: success,
      failedVerifications: failed,
      successRate: total > 0 ? Math.round((success / total) * 100) : 100,
      revoked: agent.revoked,
    };
  },
});

// ── Create a permission policy for an agent ───────────
export const createPermission = mutation({
  args: {
    agentId: v.string(),
    orgId: v.string(),
    capability: v.string(),
    rateLimit: v.optional(v.number()),
    maxAmount: v.optional(v.number()),
    requireHumanApproval: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Check if a policy already exists for this agent+capability
    const existing = await ctx.db
      .query("permissions")
      .withIndex("by_agentId_capability", (q) =>
        q.eq("agentId", args.agentId).eq("capability", args.capability),
      )
      .first();

    if (existing) {
      // Update existing policy
      await ctx.db.patch(existing._id, {
        rateLimit: args.rateLimit,
        maxAmount: args.maxAmount,
        requireHumanApproval: args.requireHumanApproval,
        enabled: true,
      });
      return { updated: true };
    }

    // Create new policy
    return await ctx.db.insert("permissions", {
      ...args,
      enabled: true,
    });
  },
});

// ── Get permission policy for agent + capability ──────
export const getPermission = query({
  args: {
    agentId: v.string(),
    capability: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("permissions")
      .withIndex("by_agentId_capability", (q) =>
        q.eq("agentId", args.agentId).eq("capability", args.capability),
      )
      .first();
  },
});

// ── Get all permissions for an agent ─────────────────
export const getAgentPermissions = query({
  args: { agentId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("permissions")
      .withIndex("by_agentId", (q) => q.eq("agentId", args.agentId))
      .collect();
  },
});

// ── Rate limit check + increment ─────────────────────
export const checkAndIncrementRateLimit = mutation({
  args: {
    agentId: v.string(),
    capability: v.string(),
    maxPerHour: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const windowStart = now - (now % 3600000); // start of current hour

    // Find existing bucket for this hour
    const bucket = await ctx.db
      .query("rateLimitBuckets")
      .withIndex("by_agentId_capability", (q) =>
        q.eq("agentId", args.agentId).eq("capability", args.capability),
      )
      .first();

    if (!bucket) {
      // First request this hour — create bucket
      await ctx.db.insert("rateLimitBuckets", {
        agentId: args.agentId,
        capability: args.capability,
        windowStart,
        count: 1,
      });
      return { allowed: true, count: 1, remaining: args.maxPerHour - 1 };
    }

    // Bucket exists — check if it's from a previous hour
    if (bucket.windowStart < windowStart) {
      // New hour — reset the count
      await ctx.db.patch(bucket._id, { windowStart, count: 1 });
      return { allowed: true, count: 1, remaining: args.maxPerHour - 1 };
    }

    // Same hour — check if limit is reached
    if (bucket.count >= args.maxPerHour) {
      return {
        allowed: false,
        count: bucket.count,
        remaining: 0,
        resetsAt: windowStart + 3600000, // when next hour starts
      };
    }

    // Under limit — increment
    await ctx.db.patch(bucket._id, { count: bucket.count + 1 });
    return {
      allowed: true,
      count: bucket.count + 1,
      remaining: args.maxPerHour - bucket.count - 1,
    };
  },
});

// ── Create a human approval request ──────────────────
export const createApprovalRequest = mutation({
  args: {
    agentId: v.string(),
    orgId: v.string(),
    capability: v.string(),
    context: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("approvalRequests", {
      ...args,
      status: "pending",
    });
  },
});

// ── Get pending approvals for an org ─────────────────
export const getPendingApprovals = query({
  args: { orgId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("approvalRequests")
      .withIndex("by_orgId", (q) => q.eq("orgId", args.orgId))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();
  },
});

// ── Approve or deny a request ─────────────────────────
export const decideApproval = mutation({
  args: {
    approvalId: v.id("approvalRequests"),
    decision: v.string(), // "approved" or "denied"
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.approvalId, {
      status: args.decision,
      decidedAt: Date.now(),
    });
    return { decided: true };
  },
});
// ── Update agent capabilities ─────────────────────────
export const updateAgent = mutation({
  args: {
    agentId: v.string(),
    capabilities: v.optional(v.array(v.string())),
    model: v.optional(v.string()),
    expiresAt: v.optional(v.string()), // FIX: was missing — caused Bad Request on token refresh
  },
  handler: async (ctx, args) => {
    const agent = await ctx.db
      .query("agents")
      .withIndex("by_agentId", (q) => q.eq("agentId", args.agentId))
      .first();

    if (!agent) return null;

    const updates = {};
    if (args.capabilities) updates.capabilities = args.capabilities;
    if (args.model) updates.model = args.model;
    if (args.expiresAt) updates.expiresAt = args.expiresAt;

    await ctx.db.patch(agent._id, updates);
    return { updated: true };
  },
});
