"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  .approval-card {
    border: 3px solid #0D0D0D; background: #fff; padding: 24px 28px; margin-bottom: 12px;
    transition: all 0.1s;
  }
  .approval-card:hover { box-shadow: 5px 5px 0 #0D0D0D; transform: translate(-2px,-2px); }
  .cap-tag {
    display: inline-block; background: #FFE135; border: 2px solid #0D0D0D;
    box-shadow: 2px 2px 0 #0D0D0D; padding: 4px 12px;
    font-family: 'DM Mono', monospace; font-size: 12px; font-weight: 500;
  }
`;

export default function Approvals() {
  const router = useRouter();
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deciding, setDeciding] = useState(null);
  const apiKey = Cookies.get("agentid_api_key");

  useEffect(() => {
    if (!apiKey) {
      router.push("/");
      return;
    }
    fetchApprovals();
  }, []);

  const fetchApprovals = async () => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/approvals`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    const data = await res.json();
    setLoading(false);
    if (res.status === 401) {
      Cookies.remove("agentid_api_key");
      router.push("/");
      return;
    }
    if (res.ok) setApprovals(data.approvals || []);
  };

  const handleDecide = async (approvalId, decision) => {
    setDeciding(approvalId);
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/v1/approvals/${approvalId}/decide`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ decision }),
      },
    );
    setDeciding(null);
    if (res.ok) {
      setApprovals((prev) =>
        prev.map((a) =>
          a.approval_id === approvalId ? { ...a, status: decision } : a,
        ),
      );
    }
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
              Loading approvals...
            </p>
          </div>
        </div>
      </>
    );

  const pending = approvals.filter((a) => a.status === "pending");
  const decided = approvals.filter((a) => a.status !== "pending");

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
              maxWidth: "900px",
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
          style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 32px" }}
        >
          {/* Title */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              marginBottom: "32px",
            }}
          >
            <div
              style={{
                background: "#FF8C00",
                border: "3px solid #0D0D0D",
                boxShadow: "4px 4px 0 #0D0D0D",
                padding: "6px 18px",
              }}
            >
              <h1
                style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: "36px",
                  letterSpacing: "3px",
                  lineHeight: 1,
                }}
              >
                Human Approvals
              </h1>
            </div>
            {pending.length > 0 && (
              <div
                style={{
                  background: "#FF4D4D",
                  border: "3px solid #0D0D0D",
                  boxShadow: "3px 3px 0 #0D0D0D",
                  width: "36px",
                  height: "36px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span
                  style={{
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: "20px",
                    color: "#fff",
                  }}
                >
                  {pending.length}
                </span>
              </div>
            )}
          </div>

          {/* Pending section */}
          {pending.length === 0 ? (
            <div
              className="b-card"
              style={{
                padding: "60px 40px",
                textAlign: "center",
                marginBottom: "32px",
              }}
            >
              <p
                style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: "32px",
                  letterSpacing: "2px",
                  color: "#00C46A",
                  marginBottom: "8px",
                }}
              >
                All Clear!
              </p>
              <p
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: "13px",
                  color: "#777",
                }}
              >
                No pending approvals. Agents are operating within their limits.
              </p>
            </div>
          ) : (
            <div style={{ marginBottom: "40px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  marginBottom: "16px",
                }}
              >
                <h2
                  style={{
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: "24px",
                    letterSpacing: "2px",
                  }}
                >
                  Pending
                </h2>
                <div
                  style={{ flex: 1, height: "3px", background: "#0D0D0D" }}
                />
              </div>

              {pending.map((approval) => {
                const ctx = approval.context || {};
                return (
                  <div
                    key={approval.approval_id}
                    className="approval-card"
                    style={{ borderLeft: "6px solid #FF8C00" }}
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
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            marginBottom: "10px",
                          }}
                        >
                          <span className="cap-tag">{approval.capability}</span>
                          <span
                            style={{
                              fontFamily: "'DM Mono', monospace",
                              fontSize: "11px",
                              color: "#888",
                            }}
                          >
                            {approval.agent_id}
                          </span>
                        </div>

                        {/* Context details */}
                        {Object.keys(ctx).length > 0 && (
                          <div
                            style={{
                              background: "#FFFEF0",
                              border: "2px solid #0D0D0D",
                              padding: "10px 14px",
                              marginBottom: "12px",
                            }}
                          >
                            <p
                              style={{
                                fontWeight: "700",
                                fontSize: "11px",
                                textTransform: "uppercase",
                                letterSpacing: "0.1em",
                                marginBottom: "6px",
                              }}
                            >
                              Action Context
                            </p>
                            {Object.entries(ctx).map(([k, v]) => (
                              <p
                                key={k}
                                style={{
                                  fontFamily: "'DM Mono', monospace",
                                  fontSize: "12px",
                                  color: "#555",
                                }}
                              >
                                <span style={{ fontWeight: "600" }}>{k}:</span>{" "}
                                {String(v)}
                              </p>
                            ))}
                          </div>
                        )}

                        <p
                          style={{
                            fontFamily: "'DM Mono', monospace",
                            fontSize: "11px",
                            color: "#999",
                          }}
                        >
                          Requested{" "}
                          {new Date(approval.created_at).toLocaleString()}
                        </p>
                      </div>

                      {/* Decision buttons */}
                      <div
                        style={{ display: "flex", gap: "10px", flexShrink: 0 }}
                      >
                        <button
                          className="b-btn"
                          onClick={() =>
                            handleDecide(approval.approval_id, "denied")
                          }
                          disabled={deciding === approval.approval_id}
                          style={{
                            padding: "10px 18px",
                            fontSize: "13px",
                            background: "#fff",
                          }}
                        >
                          Deny
                        </button>
                        <button
                          className="b-btn"
                          onClick={() =>
                            handleDecide(approval.approval_id, "approved")
                          }
                          disabled={deciding === approval.approval_id}
                          style={{
                            padding: "10px 18px",
                            fontSize: "13px",
                            background: "#00C46A",
                            color: "#fff",
                            opacity:
                              deciding === approval.approval_id ? 0.6 : 1,
                          }}
                        >
                          {deciding === approval.approval_id
                            ? "..."
                            : "Approve"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Decided section */}
          {decided.length > 0 && (
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  marginBottom: "16px",
                }}
              >
                <h2
                  style={{
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: "24px",
                    letterSpacing: "2px",
                    color: "#888",
                  }}
                >
                  History
                </h2>
                <div style={{ flex: 1, height: "3px", background: "#ccc" }} />
              </div>

              {decided.map((approval) => (
                <div
                  key={approval.approval_id}
                  className="approval-card"
                  style={{
                    borderLeft: `6px solid ${approval.status === "approved" ? "#00C46A" : "#FF4D4D"}`,
                    opacity: 0.75,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: "12px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                      }}
                    >
                      <span className="cap-tag" style={{ background: "#eee" }}>
                        {approval.capability}
                      </span>
                      <span
                        style={{
                          fontFamily: "'DM Mono', monospace",
                          fontSize: "11px",
                          color: "#888",
                        }}
                      >
                        {approval.agent_id}
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "'Space Grotesk', sans-serif",
                          fontWeight: "700",
                          fontSize: "13px",
                          textTransform: "uppercase",
                          color:
                            approval.status === "approved"
                              ? "#00C46A"
                              : "#FF4D4D",
                        }}
                      >
                        {approval.status === "approved"
                          ? "✓ Approved"
                          : "✗ Denied"}
                      </span>
                      <span
                        style={{
                          fontFamily: "'DM Mono', monospace",
                          fontSize: "11px",
                          color: "#999",
                        }}
                      >
                        {new Date(approval.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
