"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import DashNav from "../../components/dashNav";

const ACTION_COLORS = {
  "agent.registered": "var(--green)",
  "agent.verify_success": "var(--blue)",
  "agent.verify_fail": "var(--red)",
  "agent.revoked": "var(--red)",
  "agent.updated": "var(--orange)",
  "agent.token_refreshed": "#9B59B6",
  "permission.allowed": "var(--blue)",
  "permission.denied": "var(--red)",
  "permission.rate_limited": "var(--orange)",
  "permission.amount_exceeded": "var(--red)",
  "permission.awaiting_approval": "var(--orange)",
};

export default function AgentDetail() {
  const router = useRouter();
  const { agentId } = useParams();
  const [agent, setAgent] = useState(null);
  const [audit, setAudit] = useState([]);
  const [reputation, setReputation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("overview");

  const [editCaps, setEditCaps] = useState([]);
  const [editModel, setEditModel] = useState("");
  const [capInput, setCapInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  const [permCap, setPermCap] = useState("");
  const [permRate, setPermRate] = useState("");
  const [permAmount, setPermAmount] = useState("");
  const [permApproval, setPermApproval] = useState(false);
  const [permSaving, setPermSaving] = useState(false);
  const [permMsg, setPermMsg] = useState("");

  const [refreshing, setRefreshing] = useState(false);
  const [newToken, setNewToken] = useState(null);
  const [tokenCopied, setTokenCopied] = useState(false);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    const [aRes, auRes, rRes] = await Promise.all([
      fetch(`/api/v1/agents/${agentId}`),
      fetch(`/api/v1/agents/${agentId}/audit`),
      fetch(`/api/v1/agents/${agentId}/reputation`),
    ]);
    if (aRes.status === 401) {
      router.push("/setup");
      return;
    }
    const [aData, auData, rData] = await Promise.all([
      aRes.json(),
      auRes.json(),
      rRes.json(),
    ]);
    setAgent({ ...aData, ...rData });
    setAudit(auData.events || []);
    setReputation(rData);
    setEditCaps(aData.capabilities || []);
    setEditModel(aData.model || "");
    setLoading(false);
  };

  const handleRevoke = async () => {
    if (!confirm("Revoke this agent? This cannot be undone.")) return;
    const res = await fetch(`/api/v1/agents/${agentId}/revoke`, {
      method: "DELETE",
    });
    if (res.ok) {
      setAgent((p) => ({ ...p, revoked: true }));
      setAudit((p) => [
        ...p,
        { action: "agent.revoked", created_at: Date.now() },
      ]);
    }
  };

  const handleSaveEdit = async () => {
    setSaving(true);
    setSaveMsg("");
    const res = await fetch(`/api/v1/agents/${agentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        capabilities: editCaps,
        model: editModel || undefined,
      }),
    });
    setSaving(false);
    if (res.ok) {
      setSaveMsg("Saved!");
      setAgent((p) => ({ ...p, capabilities: editCaps, model: editModel }));
      setTimeout(() => setSaveMsg(""), 2500);
    }
  };

  const handleSetPermission = async () => {
    if (!permCap.trim()) return setPermMsg("Capability is required");
    setPermSaving(true);
    setPermMsg("");
    const res = await fetch(`/api/v1/agents/${agentId}/permissions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        capability: permCap,
        rate_limit: permRate ? parseInt(permRate) : undefined,
        max_amount: permAmount ? parseFloat(permAmount) : undefined,
        require_human_approval: permApproval,
      }),
    });
    setPermSaving(false);
    if (res.ok) {
      setPermMsg("Policy saved!");
      setTimeout(() => setPermMsg(""), 2500);
    } else setPermMsg("Failed to save policy");
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    const res = await fetch(`/api/v1/agents/${agentId}/refresh`, {
      method: "POST",
    });
    setRefreshing(false);
    if (res.ok) {
      const data = await res.json();
      setNewToken(data.token);
    }
  };

  const scoreColor = (s) =>
    s >= 0.8 ? "var(--green)" : s >= 0.6 ? "var(--orange)" : "var(--red)";

  const TABS = ["overview", "permissions", "edit", "audit"];

  if (loading)
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
        <DashNav />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "60vh",
          }}
        >
          <div className="card" style={{ padding: "24px 40px" }}>
            <p className="mono">Loading agent...</p>
          </div>
        </div>
      </div>
    );

  if (!agent)
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
        <DashNav />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "60vh",
          }}
        >
          <div className="card" style={{ padding: "24px 40px" }}>
            <p className="mono" style={{ color: "var(--red)" }}>
              Agent not found
            </p>
          </div>
        </div>
      </div>
    );

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <DashNav />

      <div className="container" style={{ padding: "40px 24px" }}>
        {/* Breadcrumb */}
        <div style={{ marginBottom: "24px" }} className="fade-up">
          <Link
            href="/dashboard"
            className="btn btn-sm"
            style={{
              boxShadow: "none",
              border: "none",
              padding: "4px 0",
              fontWeight: "600",
            }}
          >
            ← All agents
          </Link>
        </div>

        {/* Agent header */}
        <div
          className="card card-lg fade-up-1"
          style={{ marginBottom: "24px" }}
        >
          {/* Top bar */}
          <div
            style={{
              background: agent.revoked ? "var(--red)" : "var(--yellow)",
              borderBottom: "var(--border)",
              padding: "20px 28px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "16px",
            }}
          >
            <div>
              <div
                style={{ display: "flex", alignItems: "center", gap: "12px" }}
              >
                <h1
                  style={{
                    fontSize: "32px",
                    fontWeight: "800",
                    letterSpacing: "-0.5px",
                    color: agent.revoked ? "var(--white)" : "var(--black)",
                  }}
                >
                  {agent.name}
                </h1>
                <span
                  className={`tag ${agent.revoked ? "tag-gray" : "tag-green"}`}
                  style={{
                    background: agent.revoked
                      ? "rgba(0,0,0,0.2)"
                      : "var(--black)",
                    color: "var(--white)",
                    border: "2px solid rgba(255,255,255,0.3)",
                  }}
                >
                  {agent.revoked ? "Revoked" : "Active"}
                </span>
              </div>
              <p
                className="mono"
                style={{
                  fontSize: "12px",
                  color: agent.revoked ? "rgba(255,255,255,0.7)" : "#555",
                  marginTop: "4px",
                }}
              >
                {agent.agent_id}
              </p>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={handleRefresh}
                disabled={refreshing || agent.revoked}
                className="btn btn-sm"
                style={{ background: "var(--white)" }}
              >
                {refreshing ? "Refreshing..." : "↻ Refresh token"}
              </button>
              {!agent.revoked && (
                <button onClick={handleRevoke} className="btn btn-sm btn-red">
                  Revoke
                </button>
              )}
            </div>
          </div>

          {/* New token display */}
          {newToken && (
            <div
              style={{
                background: "var(--black)",
                borderBottom: "var(--border)",
                padding: "16px 28px",
              }}
            >
              <p
                className="mono"
                style={{
                  fontSize: "11px",
                  color: "var(--yellow)",
                  fontWeight: "700",
                  marginBottom: "8px",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                New token — copy now
              </p>
              <p
                className="mono"
                style={{
                  fontSize: "12px",
                  color: "#aaa",
                  wordBreak: "break-all",
                  marginBottom: "12px",
                  lineHeight: 1.6,
                }}
              >
                {newToken}
              </p>
              <button
                className="btn btn-sm btn-yellow"
                onClick={() => {
                  navigator.clipboard.writeText(newToken);
                  setTokenCopied(true);
                  setTimeout(() => setTokenCopied(false), 2000);
                }}
              >
                {tokenCopied ? "✓ Copied" : "Copy token"}
              </button>
            </div>
          )}

          {/* Reputation stats */}
          {reputation && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4,1fr)",
                borderBottom: "var(--border)",
              }}
            >
              {[
                {
                  label: "Trust Score",
                  value: `${((reputation.trustScore || 0) * 100).toFixed(0)}%`,
                  color: scoreColor(reputation.trustScore || 0),
                },
                {
                  label: "Trust Level",
                  value: (reputation.trustLevel || "untrusted").toUpperCase(),
                  color: "var(--black)",
                },
                {
                  label: "Verifications",
                  value: `${reputation.successfulVerifications || 0}✓ ${reputation.failedVerifications || 0}✗`,
                  color: "var(--black)",
                },
                {
                  label: "Success Rate",
                  value: `${reputation.successRate ?? 100}%`,
                  color: "var(--black)",
                },
              ].map((s, i) => (
                <div
                  key={s.label}
                  style={{
                    padding: "20px 24px",
                    borderRight: i < 3 ? "var(--border)" : "none",
                    minWidth: 0,
                  }}
                >
                  <p
                    style={{
                      fontSize: "26px",
                      fontWeight: "800",
                      fontFamily: "var(--font-mono)",
                      color: s.color,
                      lineHeight: 1,
                    }}
                  >
                    {s.value}
                  </p>
                  <p
                    style={{
                      fontSize: "10px",
                      fontWeight: "700",
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      color: "var(--gray)",
                      marginTop: "4px",
                    }}
                  >
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Tabs — 4 columns matching reputation grid exactly */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4,1fr)",
              borderBottom: "var(--border)",
            }}
          >
            {TABS.map((t, i) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  padding: "14px",
                  fontFamily: "var(--font-display)",
                  fontWeight: "700",
                  fontSize: "13px",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  cursor: "pointer",
                  border: "none",
                  borderRight: i < TABS.length - 1 ? "var(--border)" : "none",
                  background: tab === t ? "var(--yellow)" : "var(--white)",
                  color: "var(--black)",
                  transition: "background 0.1s",
                }}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div style={{ padding: "28px" }}>
            {/* Overview */}
            {tab === "overview" && (
              <div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "12px",
                    marginBottom: "24px",
                  }}
                >
                  {[
                    { label: "Model", value: agent.model || "unknown" },
                    { label: "Org ID", value: agent.org_id },
                    {
                      label: "Expires",
                      value: new Date(
                        agent.expires_at || agent.expiresAt,
                      ).toLocaleDateString(),
                    },
                    {
                      label: "Registered",
                      value: new Date(
                        agent.created_at || agent._creationTime,
                      ).toLocaleDateString(),
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      style={{
                        border: "var(--border)",
                        padding: "14px 16px",
                        background: "var(--bg)",
                      }}
                    >
                      <p
                        style={{
                          fontSize: "10px",
                          fontWeight: "700",
                          textTransform: "uppercase",
                          letterSpacing: "0.1em",
                          color: "var(--gray)",
                          marginBottom: "4px",
                        }}
                      >
                        {item.label}
                      </p>
                      <p
                        className="mono"
                        style={{ fontSize: "13px", fontWeight: "600" }}
                      >
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>
                <p
                  style={{
                    fontSize: "10px",
                    fontWeight: "700",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    color: "var(--gray)",
                    marginBottom: "10px",
                  }}
                >
                  Capabilities
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {(agent.capabilities || []).map((cap) => (
                    <span key={cap} className="tag">
                      {cap}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Permissions */}
            {tab === "permissions" && (
              <div>
                <p
                  style={{
                    fontSize: "14px",
                    color: "var(--gray)",
                    marginBottom: "24px",
                    lineHeight: 1.6,
                  }}
                >
                  Set rate limits, amount caps, and approval requirements per
                  capability.
                </p>
                <div style={{ marginBottom: "20px" }}>
                  <label
                    style={{
                      display: "block",
                      fontWeight: "700",
                      fontSize: "11px",
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      marginBottom: "8px",
                    }}
                  >
                    Capability *
                  </label>
                  <input
                    className="input"
                    value={permCap}
                    onChange={(e) => setPermCap(e.target.value)}
                    placeholder="write:payments"
                  />
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "16px",
                    marginBottom: "20px",
                  }}
                >
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontWeight: "700",
                        fontSize: "11px",
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        marginBottom: "8px",
                      }}
                    >
                      Rate limit (per hour)
                    </label>
                    <input
                      className="input"
                      type="number"
                      value={permRate}
                      onChange={(e) => setPermRate(e.target.value)}
                      placeholder="10"
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontWeight: "700",
                        fontSize: "11px",
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        marginBottom: "8px",
                      }}
                    >
                      Max amount ($)
                    </label>
                    <input
                      className="input"
                      type="number"
                      value={permAmount}
                      onChange={(e) => setPermAmount(e.target.value)}
                      placeholder="500"
                    />
                  </div>
                </div>

                {/* Human approval toggle */}
                <div
                  onClick={() => setPermApproval((p) => !p)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    padding: "16px 20px",
                    border: "var(--border)",
                    background: permApproval ? "var(--yellow)" : "var(--white)",
                    cursor: "pointer",
                    marginBottom: "20px",
                    transition: "background 0.1s",
                    boxShadow: permApproval ? "var(--shadow)" : "none",
                  }}
                >
                  <div
                    style={{
                      width: "24px",
                      height: "24px",
                      border: "var(--border)",
                      background: permApproval ? "var(--black)" : "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      transition: "background 0.1s",
                    }}
                  >
                    {permApproval && (
                      <span
                        style={{
                          color: "var(--yellow)",
                          fontWeight: "900",
                          fontSize: "14px",
                          lineHeight: 1,
                        }}
                      >
                        ✓
                      </span>
                    )}
                  </div>
                  <div>
                    <p style={{ fontWeight: "700", fontSize: "14px" }}>
                      Require human approval
                    </p>
                    <p
                      className="mono"
                      style={{ fontSize: "11px", color: "var(--gray)" }}
                    >
                      Every action must be manually approved before running
                    </p>
                  </div>
                </div>

                {permMsg && (
                  <div
                    style={{
                      padding: "10px 14px",
                      marginBottom: "16px",
                      border: "var(--border-2)",
                      background: permMsg.includes("saved")
                        ? "#E8FFF4"
                        : "#FFF0F0",
                      borderColor: permMsg.includes("saved")
                        ? "var(--green)"
                        : "var(--red)",
                    }}
                  >
                    <p
                      className="mono"
                      style={{
                        fontSize: "12px",
                        fontWeight: "700",
                        color: permMsg.includes("saved")
                          ? "var(--green)"
                          : "var(--red)",
                      }}
                    >
                      {permMsg}
                    </p>
                  </div>
                )}

                <button
                  onClick={handleSetPermission}
                  disabled={permSaving}
                  className="btn btn-yellow"
                >
                  {permSaving ? "Saving..." : "Save policy →"}
                </button>
              </div>
            )}

            {/* Edit */}
            {tab === "edit" && (
              <div>
                <div
                  style={{
                    background: "var(--bg)",
                    border: "var(--border)",
                    padding: "12px 16px",
                    marginBottom: "24px",
                  }}
                >
                  <p
                    className="mono"
                    style={{ fontSize: "12px", color: "var(--gray)" }}
                  >
                    Updating capabilities here does <strong>not</strong> rotate
                    the token. Use Refresh Token to issue a new JWT with updated
                    capabilities.
                  </p>
                </div>
                <div style={{ marginBottom: "20px" }}>
                  <label
                    style={{
                      display: "block",
                      fontWeight: "700",
                      fontSize: "11px",
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      marginBottom: "8px",
                    }}
                  >
                    Model
                  </label>
                  <input
                    className="input"
                    value={editModel}
                    onChange={(e) => setEditModel(e.target.value)}
                    placeholder="gpt-4o"
                  />
                </div>
                <div style={{ marginBottom: "24px" }}>
                  <label
                    style={{
                      display: "block",
                      fontWeight: "700",
                      fontSize: "11px",
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      marginBottom: "8px",
                    }}
                  >
                    Capabilities
                  </label>
                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      marginBottom: "10px",
                    }}
                  >
                    <input
                      className="input"
                      value={capInput}
                      onChange={(e) => setCapInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          const v = capInput.trim();
                          if (v && !editCaps.includes(v)) {
                            setEditCaps((p) => [...p, v]);
                            setCapInput("");
                          }
                        }
                      }}
                      placeholder="add:capability"
                      style={{ flex: 1 }}
                    />
                    <button
                      className="btn btn-black btn-sm"
                      onClick={() => {
                        const v = capInput.trim();
                        if (v && !editCaps.includes(v)) {
                          setEditCaps((p) => [...p, v]);
                          setCapInput("");
                        }
                      }}
                    >
                      Add
                    </button>
                  </div>
                  <div
                    style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}
                  >
                    {editCaps.map((cap) => (
                      <button
                        key={cap}
                        onClick={() =>
                          setEditCaps((p) => p.filter((c) => c !== cap))
                        }
                        className="tag"
                        style={{ cursor: "pointer" }}
                      >
                        {cap} <span style={{ fontWeight: "900" }}>×</span>
                      </button>
                    ))}
                  </div>
                </div>
                {saveMsg && (
                  <div
                    style={{
                      background: "#E8FFF4",
                      border: "2px solid var(--green)",
                      padding: "10px 14px",
                      marginBottom: "16px",
                    }}
                  >
                    <p
                      className="mono"
                      style={{
                        fontSize: "12px",
                        fontWeight: "700",
                        color: "var(--green)",
                      }}
                    >
                      ✓ {saveMsg}
                    </p>
                  </div>
                )}
                <button
                  onClick={handleSaveEdit}
                  disabled={saving}
                  className="btn btn-yellow"
                >
                  {saving ? "Saving..." : "Save changes →"}
                </button>
              </div>
            )}

            {/* Audit */}
            {tab === "audit" && (
              <div>
                <p
                  style={{
                    fontWeight: "700",
                    fontSize: "13px",
                    color: "var(--gray)",
                    marginBottom: "20px",
                  }}
                >
                  {audit.length} events recorded
                </p>
                {audit.length === 0 ? (
                  <p
                    className="mono"
                    style={{ color: "var(--gray)", fontSize: "13px" }}
                  >
                    No events yet
                  </p>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0",
                    }}
                  >
                    {[...audit].reverse().map((event, i) => (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "14px",
                          padding: "14px 0",
                          borderBottom:
                            i < audit.length - 1 ? "1px solid #eee" : "none",
                        }}
                      >
                        <div
                          style={{
                            width: "10px",
                            height: "10px",
                            borderRadius: "50%",
                            border: "var(--border-2)",
                            background:
                              ACTION_COLORS[event.action] || "var(--gray)",
                            flexShrink: 0,
                            marginTop: "4px",
                          }}
                        />
                        <div style={{ flex: 1 }}>
                          <span
                            className="mono"
                            style={{ fontSize: "13px", fontWeight: "600" }}
                          >
                            {event.action}
                          </span>
                          {event.detail && (
                            <p
                              className="mono"
                              style={{
                                fontSize: "11px",
                                color: "var(--gray)",
                                marginTop: "2px",
                              }}
                            >
                              {event.detail}
                            </p>
                          )}
                        </div>
                        <span
                          className="mono"
                          style={{
                            fontSize: "11px",
                            color: "#bbb",
                            flexShrink: 0,
                          }}
                        >
                          {new Date(event.created_at).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
