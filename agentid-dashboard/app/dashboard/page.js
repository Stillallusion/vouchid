"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:wght@400;500&family=Space+Grotesk:wght@400;500;700&display=swap');
  * { box-sizing: border-box; }
  body { background: #FFFEF0; font-family: 'Space Grotesk', sans-serif; }
  .b-card { background: #fff; border: 3px solid #0D0D0D; box-shadow: 5px 5px 0 #0D0D0D; }
  .b-btn { border: 3px solid #0D0D0D; box-shadow: 4px 4px 0 #0D0D0D; font-family: 'Space Grotesk', sans-serif; font-weight: 700; cursor: pointer; transition: all 0.1s ease; text-transform: uppercase; letter-spacing: 0.05em; display: inline-block; }
  .b-btn:hover { transform: translate(2px,2px); box-shadow: 2px 2px 0 #0D0D0D; }
  .b-btn:active { transform: translate(4px,4px); box-shadow: 0 0 0 #0D0D0D; }
  .b-input { border: 3px solid #0D0D0D; background: #FFFEF0; font-family: 'DM Mono', monospace; font-size: 13px; padding: 10px 12px; width: 100%; outline: none; }
  .b-input:focus { box-shadow: 3px 3px 0 #0D0D0D; }
  .cap-tag { display: inline-flex; align-items: center; gap: 6px; background: #FFE135; border: 2px solid #0D0D0D; box-shadow: 2px 2px 0 #0D0D0D; padding: 4px 10px; font-family: 'DM Mono', monospace; font-size: 12px; font-weight: 500; }
  .agent-row { border: 3px solid #0D0D0D; background: #fff; padding: 18px 20px; display: flex; align-items: center; justify-content: space-between; transition: all 0.1s; margin-bottom: 8px; }
  .agent-row:hover { box-shadow: 4px 4px 0 #0D0D0D; transform: translate(-1px,-1px); }
  .overlay { position: fixed; inset: 0; background: rgba(13,13,13,0.7); display: flex; align-items: center; justify-content: center; z-index: 50; padding: 20px; }
  .modal { background: #FFFEF0; border: 3px solid #0D0D0D; box-shadow: 8px 8px 0 #0D0D0D; width: 100%; max-width: 500px; max-height: 90vh; overflow-y: auto; }
  .stat-card { border: 3px solid #0D0D0D; padding: 20px 24px; }
`;

export default function Dashboard() {
  const router = useRouter();
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newModel, setNewModel] = useState("");
  const [capInput, setCapInput] = useState("");
  const [caps, setCaps] = useState([]);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    // All backend calls go through /api/v1/... — the proxy injects the auth cookie server-side
    const res = await fetch("/api/v1/agents");
    if (res.status === 401) {
      router.push("/");
      return;
    }
    const data = await res.json();
    setLoading(false);
    if (res.ok) setAgents(data.agents);
  };

  const handleRevoke = async (agentId) => {
    if (!confirm("Revoke this agent? This cannot be undone.")) return;
    const res = await fetch(`/api/v1/agents/${agentId}/revoke`, {
      method: "DELETE",
    });
    if (res.ok)
      setAgents((prev) =>
        prev.map((a) => (a.agent_id === agentId ? { ...a, revoked: true } : a)),
      );
  };

  const handleLogout = async () => {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/");
  };

  const addCap = () => {
    const val = capInput.trim();
    if (val && !caps.includes(val)) {
      setCaps((prev) => [...prev, val]);
      setCapInput("");
    }
  };

  const handleCreate = async () => {
    if (!newName.trim()) return setCreateError("Agent name is required");
    if (caps.length === 0) return setCreateError("Add at least one capability");
    setCreating(true);
    setCreateError("");
    const res = await fetch("/api/v1/agents/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newName,
        model: newModel || undefined,
        capabilities: caps,
      }),
    });
    const data = await res.json();
    setCreating(false);
    if (!res.ok) return setCreateError(data.error);
    setAgents((prev) => [
      ...prev,
      {
        agent_id: data.agent_id,
        name: newName,
        capabilities: caps,
        revoked: false,
        trust_level: "untrusted",
        created_at: Date.now(),
      },
    ]);
    resetModal();
  };

  const resetModal = () => {
    setShowModal(false);
    setNewName("");
    setNewModel("");
    setCaps([]);
    setCapInput("");
    setCreateError("");
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
            <p
              style={{ fontFamily: "'DM Mono', monospace", fontWeight: "500" }}
            >
              Loading agents...
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
        <div
          style={{
            borderBottom: "3px solid #0D0D0D",
            background: "#FFE135",
            padding: "0 32px",
          }}
        >
          <div
            style={{
              maxWidth: "1100px",
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
              VOUCHID
            </span>
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <Link
                href="/approvals"
                className="b-btn"
                style={{
                  padding: "8px 16px",
                  fontSize: "13px",
                  background: "#fff",
                  textDecoration: "none",
                  color: "#0D0D0D",
                }}
              >
                Approvals
              </Link>
              <button
                className="b-btn"
                onClick={() => setShowModal(true)}
                style={{
                  padding: "8px 16px",
                  fontSize: "13px",
                  background: "#0D0D0D",
                  color: "#FFE135",
                }}
              >
                + New Agent
              </button>
              <button
                onClick={handleLogout}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontWeight: "700",
                  fontSize: "13px",
                  textTransform: "uppercase",
                }}
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        <div
          style={{ maxWidth: "1100px", margin: "0 auto", padding: "40px 32px" }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3,1fr)",
              gap: "16px",
              marginBottom: "40px",
            }}
          >
            {[
              { label: "Total Agents", value: agents.length, bg: "#fff" },
              {
                label: "Active",
                value: agents.filter((a) => !a.revoked).length,
                bg: "#00C46A",
              },
              {
                label: "Revoked",
                value: agents.filter((a) => a.revoked).length,
                bg: "#FF4D4D",
              },
            ].map((s) => (
              <div
                key={s.label}
                className="stat-card"
                style={{ background: s.bg }}
              >
                <p
                  style={{
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: "52px",
                    lineHeight: 1,
                    color: "#0D0D0D",
                  }}
                >
                  {s.value}
                </p>
                <p
                  style={{
                    fontWeight: "700",
                    fontSize: "12px",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    marginTop: "4px",
                  }}
                >
                  {s.label}
                </p>
              </div>
            ))}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              marginBottom: "20px",
            }}
          >
            <h2
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: "32px",
                letterSpacing: "2px",
              }}
            >
              All Agents
            </h2>
            <div style={{ flex: 1, height: "3px", background: "#0D0D0D" }} />
          </div>

          {agents.length === 0 ? (
            <div
              className="b-card"
              style={{ padding: "60px 40px", textAlign: "center" }}
            >
              <p
                style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: "36px",
                  letterSpacing: "2px",
                  color: "#999",
                  marginBottom: "8px",
                }}
              >
                No Agents Yet
              </p>
              <p
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: "13px",
                  color: "#777",
                  marginBottom: "24px",
                }}
              >
                Register your first agent to get started
              </p>
              <button
                className="b-btn"
                onClick={() => setShowModal(true)}
                style={{
                  padding: "12px 28px",
                  background: "#FFE135",
                  fontSize: "14px",
                }}
              >
                + Register First Agent
              </button>
            </div>
          ) : (
            <div>
              {agents.map((agent) => (
                <div key={agent.agent_id} className="agent-row">
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "16px",
                      flex: 1,
                      minWidth: 0,
                    }}
                  >
                    <div
                      style={{
                        width: "14px",
                        height: "14px",
                        borderRadius: "50%",
                        border: "2px solid #0D0D0D",
                        background: agent.revoked ? "#FF4D4D" : "#00C46A",
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          flexWrap: "wrap",
                        }}
                      >
                        <span style={{ fontWeight: "700", fontSize: "16px" }}>
                          {agent.name}
                        </span>
                        <span
                          style={{
                            fontFamily: "'DM Mono', monospace",
                            fontSize: "11px",
                            background: agent.revoked
                              ? "#FF4D4D22"
                              : "#00C46A22",
                            border: `2px solid ${agent.revoked ? "#FF4D4D" : "#00C46A"}`,
                            padding: "2px 8px",
                            fontWeight: "600",
                            textTransform: "uppercase",
                          }}
                        >
                          {agent.revoked ? "Revoked" : "Active"}
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          gap: "6px",
                          marginTop: "8px",
                          flexWrap: "wrap",
                        }}
                      >
                        {(agent.capabilities || []).map((cap) => (
                          <span key={cap} className="cap-tag">
                            {cap}
                          </span>
                        ))}
                      </div>
                      <p
                        style={{
                          fontFamily: "'DM Mono', monospace",
                          fontSize: "11px",
                          color: "#888",
                          marginTop: "6px",
                        }}
                      >
                        {agent.agent_id}
                      </p>
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      flexShrink: 0,
                      marginLeft: "16px",
                    }}
                  >
                    <Link
                      href={`/agents/${agent.agent_id}`}
                      className="b-btn"
                      style={{
                        padding: "8px 14px",
                        fontSize: "12px",
                        background: "#fff",
                        textDecoration: "none",
                        color: "#0D0D0D",
                      }}
                    >
                      View
                    </Link>
                    {!agent.revoked && (
                      <button
                        className="b-btn"
                        onClick={() => handleRevoke(agent.agent_id)}
                        style={{
                          padding: "8px 14px",
                          fontSize: "12px",
                          background: "#FF4D4D",
                          color: "#fff",
                        }}
                      >
                        Revoke
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div
          className="overlay"
          onClick={(e) => e.target === e.currentTarget && resetModal()}
        >
          <div className="modal">
            <div
              style={{
                background: "#FFE135",
                borderBottom: "3px solid #0D0D0D",
                padding: "20px 28px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: "28px",
                  letterSpacing: "2px",
                }}
              >
                Register New Agent
              </span>
              <button
                onClick={resetModal}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "24px",
                  cursor: "pointer",
                  fontWeight: "700",
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>
            <div style={{ padding: "28px" }}>
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
                  Agent Name *
                </label>
                <input
                  className="b-input"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="support-bot"
                />
              </div>
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
                  Model{" "}
                  <span
                    style={{
                      fontWeight: "400",
                      textTransform: "none",
                      letterSpacing: 0,
                    }}
                  >
                    (optional)
                  </span>
                </label>
                <input
                  className="b-input"
                  value={newModel}
                  onChange={(e) => setNewModel(e.target.value)}
                  placeholder="gpt-4o, claude-3-5-sonnet, etc."
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
                  Capabilities *
                </label>
                <p
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: "11px",
                    color: "#666",
                    marginBottom: "10px",
                  }}
                >
                  Format: action:resource — e.g. read:tickets, write:payments
                </p>
                <div
                  style={{ display: "flex", gap: "8px", marginBottom: "10px" }}
                >
                  <input
                    className="b-input"
                    value={capInput}
                    onChange={(e) => setCapInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addCap()}
                    placeholder="read:tickets"
                    style={{ flex: 1 }}
                  />
                  <button
                    className="b-btn"
                    onClick={addCap}
                    style={{
                      padding: "10px 16px",
                      background: "#0D0D0D",
                      color: "#FFE135",
                      fontSize: "13px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Add
                  </button>
                </div>
                {caps.length > 0 ? (
                  <div
                    style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}
                  >
                    {caps.map((cap) => (
                      <span
                        key={cap}
                        className="cap-tag"
                        style={{ cursor: "pointer" }}
                        onClick={() =>
                          setCaps((prev) => prev.filter((c) => c !== cap))
                        }
                      >
                        {cap}{" "}
                        <span
                          style={{
                            fontWeight: "700",
                            fontSize: "14px",
                            lineHeight: 1,
                          }}
                        >
                          ×
                        </span>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p
                    style={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: "11px",
                      color: "#aaa",
                    }}
                  >
                    No capabilities added yet
                  </p>
                )}
              </div>
              {createError && (
                <div
                  style={{
                    background: "#FF4D4D22",
                    border: "2px solid #FF4D4D",
                    padding: "10px 14px",
                    marginBottom: "16px",
                    fontFamily: "'DM Mono', monospace",
                    fontSize: "12px",
                    color: "#c0392b",
                    fontWeight: "600",
                  }}
                >
                  ⚠ {createError}
                </div>
              )}
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  className="b-btn"
                  onClick={resetModal}
                  style={{
                    flex: 1,
                    padding: "12px",
                    background: "#fff",
                    fontSize: "14px",
                  }}
                >
                  Cancel
                </button>
                <button
                  className="b-btn"
                  onClick={handleCreate}
                  disabled={creating}
                  style={{
                    flex: 2,
                    padding: "12px",
                    background: "#FFE135",
                    fontSize: "14px",
                    opacity: creating ? 0.6 : 1,
                  }}
                >
                  {creating ? "Registering..." : "Register Agent"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
