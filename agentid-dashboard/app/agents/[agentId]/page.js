"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Cookies from "js-cookie";
import Link from "next/link";

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:wght@400;500&family=Space+Grotesk:wght@400;500;700&display=swap');
  * { box-sizing: border-box; }
  body { background: #FFFEF0; font-family: 'Space Grotesk', sans-serif; }
  .b-card { background: #fff; border: 3px solid #0D0D0D; box-shadow: 5px 5px 0 #0D0D0D; }
  .b-btn {
    border: 3px solid #0D0D0D; box-shadow: 4px 4px 0 #0D0D0D;
    font-family: 'Space Grotesk', sans-serif; font-weight: 700; cursor: pointer;
    transition: all 0.1s ease; text-transform: uppercase; letter-spacing: 0.05em;
  }
  .b-btn:hover { transform: translate(2px,2px); box-shadow: 2px 2px 0 #0D0D0D; }
  .b-btn:active { transform: translate(4px,4px); box-shadow: 0 0 0 #0D0D0D; }
  .b-input {
    border: 3px solid #0D0D0D; background: #FFFEF0; font-family: 'DM Mono', monospace;
    font-size: 13px; padding: 10px 12px; width: 100%; outline: none;
  }
  .b-input:focus { box-shadow: 3px 3px 0 #0D0D0D; }
  .cap-tag {
    display: inline-flex; align-items: center; gap: 6px;
    background: #FFE135; border: 2px solid #0D0D0D; box-shadow: 2px 2px 0 #0D0D0D;
    padding: 4px 10px; font-family: 'DM Mono', monospace; font-size: 12px;
  }
  .tab-btn {
    padding: 10px 20px; font-family: 'Space Grotesk', sans-serif; font-weight: 700;
    font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em;
    cursor: pointer; border: 3px solid transparent; transition: all 0.1s;
    background: none;
  }
  .tab-btn.active { background: #FFE135; border-color: #0D0D0D; box-shadow: 3px 3px 0 #0D0D0D; }
  .audit-row { border-bottom: 2px solid #eee; padding: 12px 0; display: flex; justify-content: space-between; align-items: center; }
  .audit-row:last-child { border-bottom: none; }
`;

const actionColors = {
  "agent.registered": "#00C46A",
  "agent.verify_success": "#2D6BE4",
  "agent.verify_fail": "#FF4D4D",
  "agent.revoked": "#FF4D4D",
  "agent.updated": "#FF8C00",
  "agent.token_refreshed": "#9B59B6",
  "permission.allowed": "#2D6BE4",
  "permission.denied": "#FF4D4D",
  "permission.rate_limited": "#FF8C00",
  "permission.amount_exceeded": "#FF4D4D",
  "permission.awaiting_approval": "#FF8C00",
};

export default function AgentDetail() {
  const router = useRouter();
  const { agentId } = useParams();
  const [agent, setAgent] = useState(null);
  const [audit, setAudit] = useState([]);
  const [reputation, setReputation] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("overview");
  const apiKey = Cookies.get("agentid_api_key");

  // Edit state
  const [editCaps, setEditCaps] = useState([]);
  const [editModel, setEditModel] = useState("");
  const [capInput, setCapInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  // Permission policy state
  const [permCap, setPermCap] = useState("");
  const [permRate, setPermRate] = useState("");
  const [permAmount, setPermAmount] = useState("");
  const [permApproval, setPermApproval] = useState(false);
  const [permSaving, setPermSaving] = useState(false);
  const [permMsg, setPermMsg] = useState("");

  // Refresh state
  const [refreshing, setRefreshing] = useState(false);
  const [newToken, setNewToken] = useState(null);
  const [tokenCopied, setTokenCopied] = useState(false);

  useEffect(() => {
    if (!apiKey) {
      router.push("/");
      return;
    }
    fetchAll();
  }, []);

  const fetchAll = async () => {
    const headers = { Authorization: `Bearer ${apiKey}` };
    const base = process.env.NEXT_PUBLIC_API_URL;
    const [aRes, auRes, rRes] = await Promise.all([
      fetch(`${base}/v1/agents/${agentId}`, { headers }),
      fetch(`${base}/v1/agents/${agentId}/audit`, { headers }),
      fetch(`${base}/v1/agents/${agentId}/reputation`, { headers }),
    ]);
    const [aData, auData, rData] = await Promise.all([
      aRes.json(),
      auRes.json(),
      rRes.json(),
    ]);
    const merged = { ...aData, ...rData };
    setAgent(merged);
    setAudit(auData.events || []);
    setReputation(rData);
    setEditCaps(aData.capabilities || []);
    setEditModel(aData.model || "");
    setLoading(false);
  };

  const handleRevoke = async () => {
    if (!confirm("Revoke this agent? This cannot be undone.")) return;
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/v1/agents/${agentId}/revoke`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${apiKey}` },
      },
    );
    if (res.ok) {
      setAgent((prev) => ({ ...prev, revoked: true }));
      setAudit((prev) => [
        ...prev,
        { action: "agent.revoked", created_at: Date.now() },
      ]);
    }
  };

  const handleSaveEdit = async () => {
    setSaving(true);
    setSaveMsg("");
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/v1/agents/${agentId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          capabilities: editCaps,
          model: editModel || undefined,
        }),
      },
    );
    setSaving(false);
    if (res.ok) {
      setSaveMsg("Saved!");
      setAgent((prev) => ({
        ...prev,
        capabilities: editCaps,
        model: editModel,
      }));
      setTimeout(() => setSaveMsg(""), 2000);
    }
  };

  const handleSetPermission = async () => {
    if (!permCap.trim()) return setPermMsg("Capability is required");
    setPermSaving(true);
    setPermMsg("");
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/v1/agents/${agentId}/permissions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          capability: permCap,
          rate_limit: permRate ? parseInt(permRate) : undefined,
          max_amount: permAmount ? parseFloat(permAmount) : undefined,
          require_human_approval: permApproval,
        }),
      },
    );
    setPermSaving(false);
    if (res.ok) {
      setPermMsg("Policy saved!");
      setPermissions((prev) => {
        const exists = prev.find((p) => p.capability === permCap);
        if (exists)
          return prev.map((p) =>
            p.capability === permCap
              ? {
                  ...p,
                  rate_limit: permRate,
                  max_amount: permAmount,
                  require_human_approval: permApproval,
                }
              : p,
          );
        return [
          ...prev,
          {
            capability: permCap,
            rate_limit: permRate,
            max_amount: permAmount,
            require_human_approval: permApproval,
          },
        ];
      });
      setTimeout(() => setPermMsg(""), 2000);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/v1/agents/${agentId}/refresh`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}` },
      },
    );
    setRefreshing(false);
    if (res.ok) {
      const data = await res.json();
      setNewToken(data.token);
    }
  };

  const scoreColor = (score) => {
    if (!score && score !== 0) return "#888";
    if (score >= 0.8) return "#00C46A";
    if (score >= 0.6) return "#FF8C00";
    return "#FF4D4D";
  };

  if (loading)
    return (
      <>
        <style>{STYLES}</style>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#FFFEF0",
          }}
        >
          <div className="b-card" style={{ padding: "24px 40px" }}>
            <p style={{ fontFamily: "'DM Mono', monospace" }}>
              Loading agent...
            </p>
          </div>
        </div>
      </>
    );

  if (!agent)
    return (
      <>
        <style>{STYLES}</style>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#FFFEF0",
          }}
        >
          <div className="b-card" style={{ padding: "24px 40px" }}>
            <p style={{ fontFamily: "'DM Mono', monospace", color: "#FF4D4D" }}>
              Agent not found
            </p>
          </div>
        </div>
      </>
    );

  return (
    <>
      <style>{STYLES}</style>
      <div
        style={{
          minHeight: "100vh",
          background: "#FFFEF0",
          backgroundImage: "radial-gradient(#0D0D0D18 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      >
        {/* Nav */}
        <div
          style={{
            borderBottom: "3px solid #0D0D0D",
            background: "#FFE135",
            padding: "0 32px",
          }}
        >
          <div
            style={{
              maxWidth: "1000px",
              margin: "0 auto",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              height: "60px",
            }}
          >
            <span
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: "28px",
                letterSpacing: "3px",
              }}
            >
              AGENTID
            </span>
            <Link
              href="/dashboard"
              className="b-btn"
              style={{
                padding: "8px 16px",
                fontSize: "13px",
                background: "#fff",
                textDecoration: "none",
                color: "#0D0D0D",
              }}
            >
              ← Dashboard
            </Link>
          </div>
        </div>

        <div
          style={{ maxWidth: "1000px", margin: "0 auto", padding: "40px 32px" }}
        >
          {/* Agent header card */}
          <div
            className="b-card"
            style={{ padding: "28px 32px", marginBottom: "28px" }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                flexWrap: "wrap",
                gap: "16px",
              }}
            >
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    marginBottom: "6px",
                  }}
                >
                  <h1
                    style={{
                      fontFamily: "'Bebas Neue', sans-serif",
                      fontSize: "40px",
                      letterSpacing: "2px",
                      lineHeight: 1,
                    }}
                  >
                    {agent.name}
                  </h1>
                  <span
                    style={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: "12px",
                      fontWeight: "600",
                      textTransform: "uppercase",
                      background: agent.revoked ? "#FF4D4D" : "#00C46A",
                      border: "2px solid #0D0D0D",
                      padding: "4px 10px",
                      boxShadow: "2px 2px 0 #0D0D0D",
                    }}
                  >
                    {agent.revoked ? "Revoked" : "Active"}
                  </span>
                </div>
                <p
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: "12px",
                    color: "#777",
                  }}
                >
                  {agent.agent_id}
                </p>
              </div>

              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <button
                  className="b-btn"
                  onClick={handleRefresh}
                  disabled={refreshing || agent.revoked}
                  style={{
                    padding: "10px 18px",
                    fontSize: "13px",
                    background: "#fff",
                    opacity: agent.revoked ? 0.5 : 1,
                  }}
                >
                  {refreshing ? "Refreshing..." : "Refresh Token"}
                </button>
                {!agent.revoked && (
                  <button
                    className="b-btn"
                    onClick={handleRevoke}
                    style={{
                      padding: "10px 18px",
                      fontSize: "13px",
                      background: "#FF4D4D",
                      color: "#fff",
                    }}
                  >
                    Revoke
                  </button>
                )}
              </div>
            </div>

            {/* Refreshed token display */}
            {newToken && (
              <div
                style={{
                  marginTop: "20px",
                  background: "#0D0D0D",
                  border: "3px solid #0D0D0D",
                  padding: "14px 16px",
                }}
              >
                <p
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: "11px",
                    color: "#FFE135",
                    marginBottom: "8px",
                    fontWeight: "600",
                  }}
                >
                  NEW TOKEN — Copy now
                </p>
                <p
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: "11px",
                    color: "#aaa",
                    wordBreak: "break-all",
                    marginBottom: "10px",
                  }}
                >
                  {newToken}
                </p>
                <button
                  className="b-btn"
                  onClick={() => {
                    navigator.clipboard.writeText(newToken);
                    setTokenCopied(true);
                    setTimeout(() => setTokenCopied(false), 2000);
                  }}
                  style={{
                    padding: "8px 16px",
                    fontSize: "12px",
                    background: tokenCopied ? "#00C46A" : "#FFE135",
                  }}
                >
                  {tokenCopied ? "✓ Copied" : "Copy Token"}
                </button>
              </div>
            )}

            {/* Score bar */}
            {reputation && (
              <div
                style={{
                  marginTop: "20px",
                  display: "grid",
                  gridTemplateColumns: "repeat(4,1fr)",
                  gap: "12px",
                }}
              >
                {[
                  {
                    label: "Trust Score",
                    value: `${((reputation.trustScore || 0) * 100).toFixed(0)}%`,
                    color: scoreColor(reputation.trustScore),
                  },
                  {
                    label: "Trust Level",
                    value: (reputation.trustLevel || "untrusted").toUpperCase(),
                    color: "#0D0D0D",
                  },
                  {
                    label: "Verifications",
                    value: `${reputation.successfulVerifications || 0}✓ ${reputation.failedVerifications || 0}✗`,
                    color: "#0D0D0D",
                  },
                  {
                    label: "Success Rate",
                    value: `${reputation.successRate ?? 100}%`,
                    color: "#0D0D0D",
                  },
                ].map((s) => (
                  <div
                    key={s.label}
                    style={{
                      border: "2px solid #0D0D0D",
                      padding: "12px 14px",
                      background: "#FFFEF0",
                    }}
                  >
                    <p
                      style={{
                        fontFamily: "'Bebas Neue', sans-serif",
                        fontSize: "28px",
                        color: s.color,
                        lineHeight: 1,
                      }}
                    >
                      {s.value}
                    </p>
                    <p
                      style={{
                        fontSize: "11px",
                        fontWeight: "700",
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        marginTop: "2px",
                        color: "#666",
                      }}
                    >
                      {s.label}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tabs */}
          <div
            style={{
              display: "flex",
              gap: "4px",
              marginBottom: "24px",
              borderBottom: "3px solid #0D0D0D",
            }}
          >
            {["overview", "permissions", "edit", "audit"].map((t) => (
              <button
                key={t}
                className={`tab-btn ${tab === t ? "active" : ""}`}
                onClick={() => setTab(t)}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Tab: Overview */}
          {tab === "overview" && (
            <div className="b-card" style={{ padding: "28px 32px" }}>
              <h3
                style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: "24px",
                  letterSpacing: "1px",
                  marginBottom: "20px",
                }}
              >
                Agent Details
              </h3>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "16px",
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
                      border: "2px solid #0D0D0D",
                      padding: "14px 16px",
                      background: "#FFFEF0",
                    }}
                  >
                    <p
                      style={{
                        fontSize: "11px",
                        fontWeight: "700",
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        color: "#666",
                        marginBottom: "4px",
                      }}
                    >
                      {item.label}
                    </p>
                    <p
                      style={{
                        fontFamily: "'DM Mono', monospace",
                        fontSize: "13px",
                        fontWeight: "500",
                      }}
                    >
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
              <div>
                <p
                  style={{
                    fontSize: "11px",
                    fontWeight: "700",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    color: "#666",
                    marginBottom: "10px",
                  }}
                >
                  Capabilities
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {(agent.capabilities || []).map((cap) => (
                    <span key={cap} className="cap-tag">
                      {cap}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab: Permissions */}
          {tab === "permissions" && (
            <div className="b-card" style={{ padding: "28px 32px" }}>
              <h3
                style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: "24px",
                  letterSpacing: "1px",
                  marginBottom: "8px",
                }}
              >
                Permission Policy
              </h3>
              <p
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: "12px",
                  color: "#666",
                  marginBottom: "24px",
                }}
              >
                Set limits on what this agent can do per capability.
              </p>

              <div style={{ marginBottom: "20px" }}>
                <label
                  style={{
                    fontWeight: "700",
                    fontSize: "11px",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    display: "block",
                    marginBottom: "8px",
                  }}
                >
                  Capability *
                </label>
                <input
                  className="b-input"
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
                      fontWeight: "700",
                      fontSize: "11px",
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      display: "block",
                      marginBottom: "8px",
                    }}
                  >
                    Rate Limit (per hour)
                  </label>
                  <input
                    className="b-input"
                    type="number"
                    value={permRate}
                    onChange={(e) => setPermRate(e.target.value)}
                    placeholder="10"
                  />
                </div>
                <div>
                  <label
                    style={{
                      fontWeight: "700",
                      fontSize: "11px",
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      display: "block",
                      marginBottom: "8px",
                    }}
                  >
                    Max Amount ($)
                  </label>
                  <input
                    className="b-input"
                    type="number"
                    value={permAmount}
                    onChange={(e) => setPermAmount(e.target.value)}
                    placeholder="500"
                  />
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  marginBottom: "24px",
                  padding: "14px 16px",
                  border: "3px solid #0D0D0D",
                  background: permApproval ? "#FFE135" : "#fff",
                  cursor: "pointer",
                }}
                onClick={() => setPermApproval((p) => !p)}
              >
                <div
                  style={{
                    width: "22px",
                    height: "22px",
                    border: "3px solid #0D0D0D",
                    background: permApproval ? "#0D0D0D" : "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {permApproval && (
                    <span
                      style={{
                        color: "#FFE135",
                        fontWeight: "900",
                        fontSize: "14px",
                      }}
                    >
                      ✓
                    </span>
                  )}
                </div>
                <div>
                  <p style={{ fontWeight: "700", fontSize: "14px" }}>
                    Require Human Approval
                  </p>
                  <p
                    style={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: "11px",
                      color: "#666",
                    }}
                  >
                    Every action with this capability must be manually approved
                  </p>
                </div>
              </div>

              {permMsg && (
                <div
                  style={{
                    background:
                      permMsg === "Policy saved!" ? "#00C46A22" : "#FF4D4D22",
                    border: `2px solid ${permMsg === "Policy saved!" ? "#00C46A" : "#FF4D4D"}`,
                    padding: "10px 14px",
                    marginBottom: "16px",
                    fontFamily: "'DM Mono', monospace",
                    fontSize: "12px",
                    fontWeight: "600",
                  }}
                >
                  {permMsg}
                </div>
              )}

              <button
                className="b-btn"
                onClick={handleSetPermission}
                disabled={permSaving}
                style={{
                  padding: "12px 28px",
                  background: "#FFE135",
                  fontSize: "14px",
                  opacity: permSaving ? 0.6 : 1,
                }}
              >
                {permSaving ? "Saving..." : "Save Policy"}
              </button>

              {permissions.length > 0 && (
                <div style={{ marginTop: "32px" }}>
                  <p
                    style={{
                      fontWeight: "700",
                      fontSize: "11px",
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      marginBottom: "12px",
                    }}
                  >
                    Active Policies
                  </p>
                  {permissions.map((p) => (
                    <div
                      key={p.capability}
                      style={{
                        border: "2px solid #0D0D0D",
                        padding: "12px 16px",
                        marginBottom: "8px",
                        background: "#FFFEF0",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span className="cap-tag">{p.capability}</span>
                      <div
                        style={{
                          display: "flex",
                          gap: "16px",
                          fontFamily: "'DM Mono', monospace",
                          fontSize: "12px",
                          color: "#555",
                        }}
                      >
                        {p.rate_limit && <span>{p.rate_limit}/hr</span>}
                        {p.max_amount && <span>max ${p.max_amount}</span>}
                        {p.require_human_approval && (
                          <span style={{ color: "#FF8C00", fontWeight: "600" }}>
                            needs approval
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab: Edit */}
          {tab === "edit" && (
            <div className="b-card" style={{ padding: "28px 32px" }}>
              <h3
                style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: "24px",
                  letterSpacing: "1px",
                  marginBottom: "8px",
                }}
              >
                Edit Agent
              </h3>
              <p
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: "12px",
                  color: "#666",
                  marginBottom: "24px",
                }}
              >
                Updating capabilities does not rotate the token — use Refresh
                Token to issue a new JWT.
              </p>

              <div style={{ marginBottom: "20px" }}>
                <label
                  style={{
                    fontWeight: "700",
                    fontSize: "11px",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    display: "block",
                    marginBottom: "8px",
                  }}
                >
                  Model
                </label>
                <input
                  className="b-input"
                  value={editModel}
                  onChange={(e) => setEditModel(e.target.value)}
                  placeholder="gpt-4o"
                />
              </div>

              <div style={{ marginBottom: "24px" }}>
                <label
                  style={{
                    fontWeight: "700",
                    fontSize: "11px",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    display: "block",
                    marginBottom: "8px",
                  }}
                >
                  Capabilities
                </label>
                <div
                  style={{ display: "flex", gap: "8px", marginBottom: "10px" }}
                >
                  <input
                    className="b-input"
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
                    className="b-btn"
                    onClick={() => {
                      const v = capInput.trim();
                      if (v && !editCaps.includes(v)) {
                        setEditCaps((p) => [...p, v]);
                        setCapInput("");
                      }
                    }}
                    style={{
                      padding: "10px 16px",
                      background: "#0D0D0D",
                      color: "#FFE135",
                      fontSize: "13px",
                    }}
                  >
                    Add
                  </button>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {editCaps.map((cap) => (
                    <span
                      key={cap}
                      className="cap-tag"
                      style={{ cursor: "pointer" }}
                      onClick={() =>
                        setEditCaps((p) => p.filter((c) => c !== cap))
                      }
                    >
                      {cap} <span style={{ fontWeight: "700" }}>×</span>
                    </span>
                  ))}
                </div>
              </div>

              {saveMsg && (
                <div
                  style={{
                    background: "#00C46A22",
                    border: "2px solid #00C46A",
                    padding: "10px 14px",
                    marginBottom: "16px",
                    fontFamily: "'DM Mono', monospace",
                    fontSize: "12px",
                    fontWeight: "600",
                  }}
                >
                  ✓ {saveMsg}
                </div>
              )}

              <button
                className="b-btn"
                onClick={handleSaveEdit}
                disabled={saving}
                style={{
                  padding: "12px 28px",
                  background: "#FFE135",
                  fontSize: "14px",
                  opacity: saving ? 0.6 : 1,
                }}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}

          {/* Tab: Audit */}
          {tab === "audit" && (
            <div className="b-card" style={{ padding: "28px 32px" }}>
              <h3
                style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: "24px",
                  letterSpacing: "1px",
                  marginBottom: "20px",
                }}
              >
                Audit Log{" "}
                <span
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontWeight: "400",
                    fontSize: "16px",
                    color: "#888",
                  }}
                >
                  ({audit.length} events)
                </span>
              </h3>
              {audit.length === 0 ? (
                <p
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: "13px",
                    color: "#888",
                  }}
                >
                  No events recorded yet
                </p>
              ) : (
                <div>
                  {[...audit].reverse().map((event, i) => (
                    <div key={i} className="audit-row">
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                        }}
                      >
                        <div
                          style={{
                            width: "10px",
                            height: "10px",
                            borderRadius: "50%",
                            border: "2px solid #0D0D0D",
                            background: actionColors[event.action] || "#888",
                            flexShrink: 0,
                          }}
                        />
                        <div>
                          <span
                            style={{
                              fontFamily: "'DM Mono', monospace",
                              fontSize: "13px",
                              fontWeight: "500",
                            }}
                          >
                            {event.action}
                          </span>
                          {event.detail && (
                            <p
                              style={{
                                fontFamily: "'DM Mono', monospace",
                                fontSize: "11px",
                                color: "#888",
                                marginTop: "2px",
                              }}
                            >
                              {event.detail}
                            </p>
                          )}
                        </div>
                      </div>
                      <span
                        style={{
                          fontFamily: "'DM Mono', monospace",
                          fontSize: "11px",
                          color: "#999",
                          flexShrink: 0,
                          marginLeft: "16px",
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
    </>
  );
}
