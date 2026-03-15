"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DashNav from "../components/dashNav";

export default function Dashboard() {
  const router = useRouter();
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [provisioning, setProvisioning] = useState(false);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    const res = await fetch("/api/v1/agents");
    if (res.status === 401) {
      setProvisioning(true);
      const provRes = await fetch("/api/provision", { method: "POST" });
      setProvisioning(false);
      if (!provRes.ok) {
        router.push("/sign-in");
        return;
      }
      const retry = await fetch("/api/v1/agents");
      if (!retry.ok) {
        router.push("/sign-in");
        return;
      }
      const data = await retry.json();
      setAgents(data.agents || []);
      setLoading(false);
      return;
    }
    if (!res.ok) {
      router.push("/sign-in");
      return;
    }
    const data = await res.json();
    setAgents(data.agents || []);
    setLoading(false);
  };

  const handleRevoke = async (agentId, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Revoke this agent? This cannot be undone.")) return;
    const res = await fetch(`/api/v1/agents/${agentId}/revoke`, {
      method: "DELETE",
    });
    if (res.ok)
      setAgents((prev) =>
        prev.map((a) => (a.agent_id === agentId ? { ...a, revoked: true } : a)),
      );
  };

  const filtered = agents.filter((a) =>
    filter === "all" ? true : filter === "active" ? !a.revoked : a.revoked,
  );

  const stats = [
    { label: "Total agents", value: agents.length, bg: "var(--white)" },
    {
      label: "Active",
      value: agents.filter((a) => !a.revoked).length,
      bg: "var(--green)",
    },
    {
      label: "Revoked",
      value: agents.filter((a) => a.revoked).length,
      bg: "var(--red)",
      color: "var(--white)",
    },
  ];

  if (loading)
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
        <DashNav />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "60vh",
            gap: "16px",
          }}
        >
          <div
            className="card"
            style={{ padding: "28px 48px", textAlign: "center" }}
          >
            <p
              className="mono"
              style={{ fontSize: "14px", marginBottom: "8px" }}
            >
              {provisioning ? "Setting up your workspace..." : "Loading..."}
            </p>
            {provisioning && (
              <p
                className="mono"
                style={{ fontSize: "11px", color: "var(--gray)" }}
              >
                Creating your org and API key
              </p>
            )}
          </div>
        </div>
      </div>
    );

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <DashNav />

      <div className="container" style={{ padding: "48px 24px" }}>
        {/* Stats */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3,1fr)",
            gap: "0",
            border: "var(--border)",
            boxShadow: "var(--shadow-lg)",
            marginBottom: "40px",
          }}
          className="fade-up"
        >
          {stats.map((s, i) => (
            <div
              key={s.label}
              style={{
                padding: "28px",
                background: s.bg,
                borderRight: i < 2 ? "var(--border)" : "none",
                color: s.color || "var(--black)",
              }}
            >
              <p
                style={{
                  fontSize: "52px",
                  fontWeight: "800",
                  fontFamily: "var(--font-mono)",
                  lineHeight: 1,
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
                  opacity: 0.7,
                }}
              >
                {s.label}
              </p>
            </div>
          ))}
        </div>

        {/* Section header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "20px",
          }}
          className="fade-up-1"
        >
          <div
            className="section-header"
            style={{ margin: 0, flex: 1, marginRight: "24px" }}
          >
            <h2>All Agents</h2>
            <div className="section-divider" />
          </div>
          <div
            style={{
              display: "flex",
              border: "var(--border)",
              boxShadow: "var(--shadow)",
            }}
          >
            {["all", "active", "revoked"].map((f, i) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="btn"
                style={{
                  borderRadius: 0,
                  border: "none",
                  borderRight: i < 2 ? "var(--border)" : "none",
                  boxShadow: "none",
                  background: filter === f ? "var(--black)" : "var(--white)",
                  color: filter === f ? "var(--yellow)" : "var(--black)",
                  padding: "8px 18px",
                  fontSize: "12px",
                }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Agent list */}
        {filtered.length === 0 ? (
          <div
            className="card card-lg fade-up-2"
            style={{ padding: "80px 40px", textAlign: "center" }}
          >
            <p
              style={{
                fontSize: "40px",
                fontWeight: "800",
                color: "#ddd",
                marginBottom: "16px",
              }}
            >
              {agents.length === 0
                ? "No agents yet"
                : "No agents match this filter"}
            </p>
            {agents.length === 0 && (
              <div
                style={{
                  background: "var(--bg)",
                  border: "var(--border)",
                  padding: "20px 28px",
                  display: "inline-block",
                  textAlign: "left",
                }}
              >
                <p
                  className="mono"
                  style={{
                    fontSize: "12px",
                    color: "var(--gray)",
                    marginBottom: "8px",
                  }}
                >
                  Register agents via the SDK:
                </p>
                <p
                  className="mono"
                  style={{ fontSize: "13px", color: "var(--black)" }}
                >
                  npm install @vouchid/sdk
                </p>
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {filtered.map((agent, i) => (
              <Link
                key={agent.agent_id}
                href={`/agents/${agent.agent_id}`}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <div
                  className={`fade-up-${Math.min(i + 2, 5)}`}
                  style={{
                    background: "var(--white)",
                    border: "var(--border)",
                    borderTop: i === 0 ? "var(--border)" : "none",
                    padding: "20px 24px",
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                    transition: "transform 0.1s, box-shadow 0.1s",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translate(-2px,-2px)";
                    e.currentTarget.style.boxShadow = "var(--shadow-lg)";
                    e.currentTarget.style.zIndex = "1";
                    e.currentTarget.style.position = "relative";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "";
                    e.currentTarget.style.boxShadow = "";
                    e.currentTarget.style.zIndex = "";
                  }}
                >
                  <div
                    style={{
                      width: "14px",
                      height: "14px",
                      borderRadius: "50%",
                      border: "var(--border-2)",
                      background: agent.revoked ? "var(--red)" : "var(--green)",
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        flexWrap: "wrap",
                        marginBottom: "6px",
                      }}
                    >
                      <span style={{ fontWeight: "800", fontSize: "16px" }}>
                        {agent.name}
                      </span>
                      <span
                        className={`tag ${agent.revoked ? "tag-red" : "tag-green"}`}
                      >
                        {agent.revoked ? "Revoked" : "Active"}
                      </span>
                      {agent.trust_level &&
                        agent.trust_level !== "untrusted" && (
                          <span className="tag tag-blue">
                            {agent.trust_level}
                          </span>
                        )}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: "6px",
                        flexWrap: "wrap",
                        marginBottom: "4px",
                      }}
                    >
                      {(agent.capabilities || []).map((cap) => (
                        <span
                          key={cap}
                          className="tag"
                          style={{
                            fontSize: "10px",
                            padding: "2px 8px",
                            boxShadow: "1px 1px 0 var(--black)",
                          }}
                        >
                          {cap}
                        </span>
                      ))}
                    </div>
                    <p
                      className="mono"
                      style={{ fontSize: "11px", color: "var(--gray)" }}
                    >
                      {agent.agent_id}
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                    <span className="btn btn-sm">View →</span>
                    {!agent.revoked && (
                      <button
                        className="btn btn-sm btn-red"
                        onClick={(e) => handleRevoke(agent.agent_id, e)}
                      >
                        Revoke
                      </button>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
