"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashNav from "../components/dashNav";

export default function Approvals() {
  const router = useRouter();
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deciding, setDeciding] = useState(null);

  useEffect(() => {
    fetchApprovals();
  }, []);

  const fetchApprovals = async () => {
    const res = await fetch("/api/v1/approvals");
    if (res.status === 401) {
      router.push("/setup");
      return;
    }
    const data = await res.json();
    setLoading(false);
    if (res.ok) setApprovals(data.approvals || []);
  };

  const handleDecide = async (approvalId, decision) => {
    setDeciding(approvalId);
    const res = await fetch(`/api/v1/approvals/${approvalId}/decide`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision }),
    });
    setDeciding(null);
    if (res.ok)
      setApprovals((prev) =>
        prev.map((a) =>
          a.approval_id === approvalId ? { ...a, status: decision } : a,
        ),
      );
  };

  const pending = approvals.filter((a) => a.status === "pending");
  const decided = approvals.filter((a) => a.status !== "pending");

  if (loading)
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
        <DashNav pendingCount={0} />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "60vh",
          }}
        >
          <div className="card" style={{ padding: "24px 40px" }}>
            <p className="mono">Loading approvals...</p>
          </div>
        </div>
      </div>
    );

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <DashNav pendingCount={pending.length} />

      <div className="container" style={{ padding: "48px 24px" }}>
        {/* Page title */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "40px",
          }}
          className="fade-up"
        >
          <div
            style={{
              background: "var(--orange)",
              border: "var(--border)",
              boxShadow: "var(--shadow-lg)",
              padding: "12px 24px",
            }}
          >
            <h1
              style={{
                fontSize: "32px",
                fontWeight: "800",
                color: "var(--white)",
                letterSpacing: "-0.5px",
              }}
            >
              Human Approvals
            </h1>
          </div>
          {pending.length > 0 && (
            <div
              style={{
                background: "var(--red)",
                border: "var(--border)",
                boxShadow: "var(--shadow)",
                width: "44px",
                height: "44px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "20px",
                  fontWeight: "800",
                  color: "var(--white)",
                }}
              >
                {pending.length}
              </span>
            </div>
          )}
        </div>

        {/* Pending */}
        {pending.length === 0 ? (
          <div
            className="card card-lg fade-up-1"
            style={{
              padding: "80px 40px",
              textAlign: "center",
              marginBottom: "40px",
            }}
          >
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>✓</div>
            <p
              style={{
                fontSize: "28px",
                fontWeight: "800",
                color: "var(--green)",
                marginBottom: "8px",
              }}
            >
              All clear
            </p>
            <p
              className="mono"
              style={{ fontSize: "13px", color: "var(--gray)" }}
            >
              No pending approvals. Agents are operating within their limits.
            </p>
          </div>
        ) : (
          <div style={{ marginBottom: "48px" }}>
            <div className="section-header fade-up-1">
              <h2>Pending ({pending.length})</h2>
              <div className="section-divider" />
            </div>

            {pending.map((approval, i) => {
              const ctx = approval.context || {};
              return (
                <div
                  key={approval.approval_id}
                  className={`card card-lg fade-up-${Math.min(i + 2, 5)}`}
                  style={{
                    marginBottom: "12px",
                    borderLeft: "6px solid var(--orange)",
                    overflow: "hidden",
                  }}
                >
                  {/* Orange header bar */}
                  <div
                    style={{
                      background: "var(--orange)",
                      padding: "12px 24px",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <span style={{ fontSize: "18px" }}>⏳</span>
                    <span
                      style={{
                        fontWeight: "800",
                        fontSize: "14px",
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        color: "var(--white)",
                      }}
                    >
                      Awaiting approval
                    </span>
                    <span
                      className="mono"
                      style={{
                        fontSize: "11px",
                        color: "rgba(255,255,255,0.7)",
                        marginLeft: "auto",
                      }}
                    >
                      {new Date(approval.created_at).toLocaleString()}
                    </span>
                  </div>

                  <div
                    style={{
                      padding: "24px 28px",
                      display: "flex",
                      gap: "24px",
                      alignItems: "flex-start",
                      flexWrap: "wrap",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          marginBottom: "12px",
                        }}
                      >
                        <span className="tag tag-orange">
                          {approval.capability}
                        </span>
                        <span
                          className="mono"
                          style={{ fontSize: "11px", color: "var(--gray)" }}
                        >
                          {approval.agent_id}
                        </span>
                      </div>

                      {Object.keys(ctx).length > 0 && (
                        <div
                          style={{
                            background: "var(--bg)",
                            border: "var(--border)",
                            padding: "12px 16px",
                          }}
                        >
                          <p
                            style={{
                              fontWeight: "700",
                              fontSize: "10px",
                              textTransform: "uppercase",
                              letterSpacing: "0.1em",
                              marginBottom: "8px",
                              color: "var(--gray)",
                            }}
                          >
                            Action context
                          </p>
                          {Object.entries(ctx).map(([k, v]) => (
                            <p
                              key={k}
                              className="mono"
                              style={{ fontSize: "12px", color: "#444" }}
                            >
                              <span style={{ fontWeight: "700" }}>{k}:</span>{" "}
                              {String(v)}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>

                    <div
                      style={{ display: "flex", gap: "10px", flexShrink: 0 }}
                    >
                      <button
                        onClick={() =>
                          handleDecide(approval.approval_id, "denied")
                        }
                        disabled={deciding === approval.approval_id}
                        className="btn btn-sm"
                        style={{ minWidth: "90px" }}
                      >
                        ✗ Deny
                      </button>
                      <button
                        onClick={() =>
                          handleDecide(approval.approval_id, "approved")
                        }
                        disabled={deciding === approval.approval_id}
                        className="btn btn-sm btn-green"
                        style={{ minWidth: "100px" }}
                      >
                        {deciding === approval.approval_id
                          ? "..."
                          : "✓ Approve"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* History */}
        {decided.length > 0 && (
          <div className="fade-up-3">
            <div className="section-header" style={{ opacity: 0.6 }}>
              <h2 style={{ color: "var(--gray)" }}>History</h2>
              <div className="section-divider" style={{ background: "#ddd" }} />
            </div>

            {decided.map((approval, i) => (
              <div
                key={approval.approval_id}
                style={{
                  background: "var(--white)",
                  border: "var(--border)",
                  borderLeft: `6px solid ${approval.status === "approved" ? "var(--green)" : "var(--red)"}`,
                  padding: "16px 24px",
                  marginBottom: "8px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "12px",
                  opacity: 0.75,
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "12px" }}
                >
                  <span className="tag tag-gray">{approval.capability}</span>
                  <span
                    className="mono"
                    style={{ fontSize: "11px", color: "var(--gray)" }}
                  >
                    {approval.agent_id}
                  </span>
                </div>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "16px" }}
                >
                  <span
                    style={{
                      fontWeight: "800",
                      fontSize: "13px",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      color:
                        approval.status === "approved"
                          ? "var(--green)"
                          : "var(--red)",
                    }}
                  >
                    {approval.status === "approved" ? "✓ Approved" : "✗ Denied"}
                  </span>
                  <span
                    className="mono"
                    style={{ fontSize: "11px", color: "#bbb" }}
                  >
                    {new Date(approval.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
