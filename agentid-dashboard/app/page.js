"use client";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";

const features = [
  {
    color: "#FFE135",
    icon: "🪪",
    title: "Cryptographic Identity",
    body: "Every AI agent gets a signed JWT. Not a shared secret — a real identity with capabilities encoded.",
  },
  {
    color: "#00D97E",
    icon: "🛡",
    title: "Tool-Level Auth",
    body: "MCP middleware intercepts every tool call. Handlers only run after the token passes.",
  },
  {
    color: "#005FFF",
    icon: "📋",
    title: "Immutable Audit Trail",
    body: "Every verify, every revocation, every permission check — logged to Convex and queryable.",
  },
  {
    color: "#FF2D55",
    icon: "⚡",
    title: "Instant Revocation",
    body: "Compromised agent? One API call and it's dead everywhere within milliseconds.",
  },
  {
    color: "#FF6B35",
    icon: "🧠",
    title: "Trust Scoring",
    body: "Agents build reputation over time. Each successful verify nudges the score up. Failures pull it down.",
  },
  {
    color: "#0A0A0A",
    icon: "👤",
    title: "Human Approvals",
    body: "Set policies that require a human to approve before a sensitive action runs. Enterprise-grade control.",
  },
];

const steps = [
  {
    n: "01",
    code: `import { AgentID } from '@vouchid/sdk';\n\nconst agent = await agentid.register({\n  name: 'research-bot',\n  capabilities: ['read:data'],\n});`,
    label: "Register your agent",
  },
  {
    n: "02",
    code: `import { AgentIDMiddleware } from '@vouchid/mcp';\n\nconst middleware = new AgentIDMiddleware({\n  toolCapabilities: { read_file: 'read:data' },\n});`,
    label: "Protect your MCP server",
  },
  {
    n: "03",
    code: `// Every tool call verified automatically.\n// Handler only runs if token is valid.\n// Audit log written. Score updated.`,
    label: "Ship with confidence",
  },
];

export default function Landing() {
  const { isSignedIn } = useUser();

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      {/* ── Nav ── */}
      <nav className="nav">
        <div className="container nav-inner">
          <a href="/" className="nav-logo">
            VOUCHID
          </a>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            {isSignedIn ? (
              <Link href="/dashboard" className="btn btn-sm btn-black">
                Dashboard →
              </Link>
            ) : (
              <>
                <Link href="/sign-in" className="btn btn-sm">
                  Log in
                </Link>
                <Link href="/sign-up" className="btn btn-sm btn-black">
                  Get started →
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section
        className="halftone"
        style={{ borderBottom: "var(--border)", padding: "80px 0 0" }}
      >
        <div className="container">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "48px",
              alignItems: "end",
            }}
          >
            <div className="fade-up">
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "var(--yellow)",
                  border: "var(--border)",
                  boxShadow: "var(--shadow)",
                  padding: "6px 14px",
                  marginBottom: "28px",
                }}
              >
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: "var(--red)",
                    display: "inline-block",
                    animation: "pulse 1.5s infinite",
                  }}
                />
                <span
                  className="mono"
                  style={{
                    fontSize: "12px",
                    fontWeight: "700",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                  }}
                >
                  Identity for AI agents
                </span>
              </div>
              <h1
                style={{
                  fontSize: "clamp(48px, 6vw, 80px)",
                  fontWeight: "800",
                  lineHeight: 1,
                  letterSpacing: "-2px",
                  marginBottom: "24px",
                }}
              >
                Your agents
                <br />
                <span
                  style={{
                    background: "var(--yellow)",
                    padding: "0 8px",
                    display: "inline-block",
                    border: "var(--border)",
                    marginTop: "4px",
                  }}
                >
                  need IDs.
                </span>
              </h1>
              <p
                style={{
                  fontSize: "18px",
                  lineHeight: 1.6,
                  color: "#444",
                  maxWidth: "460px",
                  marginBottom: "36px",
                }}
              >
                VouchID is Auth0 for AI agents. Every agent gets a signed JWT.
                Every MCP tool call is verified in under 10ms. Every action is
                logged.
              </p>
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                {isSignedIn ? (
                  <Link href="/dashboard" className="btn btn-yellow btn-lg">
                    Go to Dashboard →
                  </Link>
                ) : (
                  <>
                    <Link href="/sign-up" className="btn btn-yellow btn-lg">
                      Start for free →
                    </Link>
                    <a
                      href="https://github.com/Stillallusion/vouchid"
                      target="_blank"
                      rel="noopener"
                      className="btn btn-lg"
                    >
                      View on GitHub
                    </a>
                  </>
                )}
              </div>
              <div
                style={{
                  display: "flex",
                  gap: "0",
                  marginTop: "48px",
                  borderTop: "var(--border)",
                }}
              >
                {[
                  ["< 10ms", "verify latency"],
                  ["30-day", "JWT TTL"],
                  ["100%", "open source"],
                ].map(([val, label], i) => (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      padding: "20px 0",
                      borderRight: i < 2 ? "var(--border)" : "none",
                      paddingLeft: i > 0 ? "24px" : "0",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "28px",
                        fontWeight: "800",
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      {val}
                    </div>
                    <div
                      className="mono"
                      style={{
                        fontSize: "11px",
                        color: "var(--gray)",
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        marginTop: "2px",
                      }}
                    >
                      {label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="fade-up-2">
              <div
                className="card card-lg"
                style={{ background: "var(--black)", overflow: "hidden" }}
              >
                <div
                  style={{
                    background: "#1a1a1a",
                    borderBottom: "2px solid #333",
                    padding: "12px 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  {["#FF5F57", "#FEBC2E", "#28C840"].map((c) => (
                    <div
                      key={c}
                      style={{
                        width: "12px",
                        height: "12px",
                        borderRadius: "50%",
                        background: c,
                      }}
                    />
                  ))}
                  <span
                    className="mono"
                    style={{
                      fontSize: "12px",
                      color: "#666",
                      marginLeft: "8px",
                    }}
                  >
                    vouchid — agent registration
                  </span>
                </div>
                <div
                  style={{
                    padding: "24px",
                    fontFamily: "var(--font-mono)",
                    fontSize: "13px",
                    lineHeight: "1.8",
                    color: "#e0e0e0",
                  }}
                >
                  <div>
                    <span style={{ color: "#666" }}>$</span>{" "}
                    <span style={{ color: "#00D97E" }}>npm install</span>{" "}
                    <span style={{ color: "#FFE135" }}>@vouchid/sdk</span>
                  </div>
                  <div style={{ marginTop: "16px" }}>
                    <div>
                      <span style={{ color: "#aaa" }}>import</span>{" "}
                      {`{ AgentID } `}
                      <span style={{ color: "#aaa" }}>from</span>{" "}
                      <span style={{ color: "#FFE135" }}>'@vouchid/sdk'</span>;
                    </div>
                    <div style={{ marginTop: "8px" }}>
                      <span style={{ color: "#aaa" }}>const</span> agent ={" "}
                      <span style={{ color: "#aaa" }}>await</span> agentid.
                      <span style={{ color: "#00D97E" }}>register</span>
                      {"({"}
                    </div>
                    <div style={{ paddingLeft: "20px" }}>
                      <span style={{ color: "#005FFF" }}>name</span>:{" "}
                      <span style={{ color: "#FFE135" }}>'research-bot'</span>,
                    </div>
                    <div style={{ paddingLeft: "20px" }}>
                      <span style={{ color: "#005FFF" }}>capabilities</span>: [
                      <span style={{ color: "#FFE135" }}>'read:data'</span>],
                    </div>
                    <div>{"});"}</div>
                  </div>
                  <div
                    style={{
                      marginTop: "16px",
                      background: "#1a1a1a",
                      padding: "12px",
                      border: "1px solid #333",
                    }}
                  >
                    <div style={{ color: "#666" }}>// ✓ Agent registered</div>
                    <div>
                      <span style={{ color: "#00D97E" }}>agent_id:</span>{" "}
                      <span style={{ color: "#FFE135" }}>'agent_x8k2m...'</span>
                    </div>
                    <div>
                      <span style={{ color: "#00D97E" }}>token:</span>{" "}
                      <span style={{ color: "#FFE135" }}>'eyJhbGci...'</span>
                    </div>
                    <div>
                      <span style={{ color: "#00D97E" }}>trust_level:</span>{" "}
                      <span style={{ color: "#FF6B35" }}>'untrusted'</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section style={{ padding: "80px 0", borderBottom: "var(--border)" }}>
        <div className="container">
          <div style={{ marginBottom: "48px" }}>
            <div className="tag" style={{ marginBottom: "16px" }}>
              How it works
            </div>
            <h2
              style={{
                fontSize: "40px",
                fontWeight: "800",
                letterSpacing: "-1px",
              }}
            >
              Three lines.
              <br />
              Authenticated agents.
            </h2>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "0",
              border: "var(--border)",
            }}
          >
            {steps.map((s, i) => (
              <div
                key={i}
                style={{
                  padding: "36px 32px",
                  borderRight: i < 2 ? "var(--border)" : "none",
                  background: i === 1 ? "var(--yellow)" : "var(--white)",
                }}
              >
                <div
                  style={{
                    fontSize: "48px",
                    fontWeight: "800",
                    fontFamily: "var(--font-mono)",
                    color: i === 1 ? "var(--black)" : "#e0e0e0",
                    marginBottom: "16px",
                    lineHeight: 1,
                  }}
                >
                  {s.n}
                </div>
                <div
                  style={{
                    background: "var(--black)",
                    padding: "16px",
                    marginBottom: "20px",
                    fontFamily: "var(--font-mono)",
                    fontSize: "12px",
                    color: "#ccc",
                    lineHeight: 1.8,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {s.code}
                </div>
                <p style={{ fontWeight: "700", fontSize: "15px" }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section
        className="halftone-sm"
        style={{ padding: "80px 0", borderBottom: "var(--border)" }}
      >
        <div className="container">
          <div style={{ marginBottom: "48px" }}>
            <div className="tag" style={{ marginBottom: "16px" }}>
              Features
            </div>
            <h2
              style={{
                fontSize: "40px",
                fontWeight: "800",
                letterSpacing: "-1px",
              }}
            >
              Everything you need.
              <br />
              Nothing you don't.
            </h2>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "16px",
            }}
          >
            {features.map((f, i) => (
              <div
                key={i}
                className="card"
                style={{
                  padding: "28px",
                  transition: "transform 0.15s, box-shadow 0.15s",
                  cursor: "default",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translate(-2px,-2px)";
                  e.currentTarget.style.boxShadow = "var(--shadow-lg)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "";
                  e.currentTarget.style.boxShadow = "var(--shadow)";
                }}
              >
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    background: f.color,
                    border: "var(--border-2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "22px",
                    marginBottom: "16px",
                    boxShadow: "3px 3px 0 var(--black)",
                  }}
                >
                  {f.icon}
                </div>
                <h3
                  style={{
                    fontSize: "16px",
                    fontWeight: "800",
                    marginBottom: "8px",
                  }}
                >
                  {f.title}
                </h3>
                <p style={{ fontSize: "14px", color: "#555", lineHeight: 1.6 }}>
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section
        style={{
          padding: "80px 0",
          background: "var(--black)",
          borderTop: "var(--border)",
        }}
      >
        <div className="container" style={{ textAlign: "center" }}>
          <div
            className="tag"
            style={{ background: "var(--yellow)", marginBottom: "24px" }}
          >
            Open source & free to start
          </div>
          <h2
            style={{
              fontSize: "52px",
              fontWeight: "800",
              color: "var(--white)",
              letterSpacing: "-1px",
              marginBottom: "16px",
            }}
          >
            Your MCP server
            <br />
            has zero auth right now.
          </h2>
          <p
            className="mono"
            style={{ fontSize: "14px", color: "#888", marginBottom: "36px" }}
          >
            Fix it in 5 minutes.
          </p>
          <div
            style={{ display: "flex", gap: "12px", justifyContent: "center" }}
          >
            {isSignedIn ? (
              <Link href="/dashboard" className="btn btn-yellow btn-lg">
                Go to Dashboard →
              </Link>
            ) : (
              <Link href="/sign-up" className="btn btn-yellow btn-lg">
                Get started free →
              </Link>
            )}
            <a
              href="https://github.com/Stillallusion/vouchid"
              target="_blank"
              rel="noopener"
              className="btn btn-lg"
              style={{ background: "#1a1a1a", color: "var(--white)" }}
            >
              GitHub
            </a>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer
        style={{
          borderTop: "var(--border)",
          background: "var(--yellow)",
          padding: "24px 0",
        }}
      >
        <div
          className="container"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span className="nav-logo" style={{ fontSize: "18px" }}>
            VOUCHID
          </span>
          <span className="mono" style={{ fontSize: "12px", color: "#555" }}>
            Identity infrastructure for AI agents
          </span>
        </div>
      </footer>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>
    </div>
  );
}
