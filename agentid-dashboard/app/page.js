"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [orgName, setOrgName] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [mode, setMode] = useState("login");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSignup = async () => {
    if (!orgName.trim()) return setError("Enter an org name");
    setLoading(true);
    setError("");
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/v1/orgs/register`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: orgName }),
      },
    );
    const data = await res.json();
    setLoading(false);
    if (!res.ok) return setError(data.error);
    setResult(data);
  };

  const handleLogin = async () => {
    if (!apiKey.trim()) return setError("Enter your API key");
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey }),
    });
    setLoading(false);
    if (!res.ok) return setError("Invalid API key format");
    router.push("/dashboard");
  };

  const handleGoToDashboard = async () => {
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey: result.api_key }),
    });
    if (res.ok) router.push("/dashboard");
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result.api_key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:wght@400;500&family=Space+Grotesk:wght@400;500;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #FFFEF0; font-family: 'Space Grotesk', sans-serif; }
        .brutalist-card { background: #fff; border: 3px solid #0D0D0D; box-shadow: 6px 6px 0px #0D0D0D; }
        .brutalist-btn { border: 3px solid #0D0D0D; box-shadow: 4px 4px 0px #0D0D0D; font-family: 'Space Grotesk', sans-serif; font-weight: 700; cursor: pointer; transition: all 0.1s ease; text-transform: uppercase; letter-spacing: 0.05em; }
        .brutalist-btn:hover { transform: translate(2px, 2px); box-shadow: 2px 2px 0px #0D0D0D; }
        .brutalist-btn:active { transform: translate(4px, 4px); box-shadow: 0px 0px 0px #0D0D0D; }
        .brutalist-input { border: 3px solid #0D0D0D; background: #FFFEF0; font-family: 'DM Mono', monospace; font-size: 14px; padding: 12px 14px; width: 100%; outline: none; transition: box-shadow 0.1s; }
        .brutalist-input:focus { box-shadow: 4px 4px 0px #0D0D0D; }
        .tab-active { background: #FFE135; border: 3px solid #0D0D0D; box-shadow: 3px 3px 0px #0D0D0D; }
        .tab-inactive { background: transparent; border: 3px solid transparent; }
      `}</style>

      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          background: "#FFFEF0",
        }}
      >
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundImage: "radial-gradient(#0D0D0D22 1px, transparent 1px)",
            backgroundSize: "28px 28px",
            zIndex: 0,
          }}
        />

        <div
          style={{
            width: "100%",
            maxWidth: "440px",
            position: "relative",
            zIndex: 1,
          }}
        >
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <div
              style={{
                display: "inline-block",
                background: "#FFE135",
                border: "3px solid #0D0D0D",
                boxShadow: "6px 6px 0 #0D0D0D",
                padding: "8px 24px",
                marginBottom: "12px",
              }}
            >
              <span
                style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: "48px",
                  letterSpacing: "4px",
                  color: "#0D0D0D",
                }}
              >
                VOUCHID
              </span>
            </div>
            <p
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: "13px",
                color: "#555",
                marginTop: "8px",
              }}
            >
              Identity layer for AI agents
            </p>
          </div>

          <div className="brutalist-card" style={{ padding: "32px" }}>
            {result ? (
              <div>
                <div
                  style={{
                    background: "#00C46A",
                    border: "3px solid #0D0D0D",
                    padding: "12px 16px",
                    marginBottom: "20px",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <span style={{ fontSize: "20px" }}>✓</span>
                  <span
                    style={{
                      fontWeight: "700",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Org Created!
                  </span>
                </div>
                <p
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: "12px",
                    color: "#555",
                    marginBottom: "12px",
                  }}
                >
                  Copy your API key now — it will NEVER be shown again.
                </p>
                <div
                  style={{
                    background: "#0D0D0D",
                    border: "3px solid #0D0D0D",
                    padding: "14px",
                    fontFamily: "'DM Mono', monospace",
                    fontSize: "11px",
                    color: "#FFE135",
                    wordBreak: "break-all",
                    marginBottom: "12px",
                    lineHeight: "1.6",
                  }}
                >
                  {result.api_key}
                </div>
                <button
                  className="brutalist-btn"
                  onClick={handleCopy}
                  style={{
                    width: "100%",
                    padding: "12px",
                    background: copied ? "#00C46A" : "#fff",
                    fontSize: "14px",
                    marginBottom: "10px",
                  }}
                >
                  {copied ? "✓ Copied!" : "Copy to clipboard"}
                </button>
                <button
                  className="brutalist-btn"
                  onClick={handleGoToDashboard}
                  style={{
                    width: "100%",
                    padding: "12px",
                    background: "#FFE135",
                    fontSize: "14px",
                  }}
                >
                  Go to Dashboard →
                </button>
              </div>
            ) : (
              <div>
                <div
                  style={{ display: "flex", gap: "8px", marginBottom: "28px" }}
                >
                  {["login", "signup"].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => {
                        setMode(tab);
                        setError("");
                      }}
                      className={mode === tab ? "tab-active" : "tab-inactive"}
                      style={{
                        flex: 1,
                        padding: "10px",
                        fontFamily: "'Space Grotesk', sans-serif",
                        fontWeight: "700",
                        fontSize: "14px",
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        cursor: "pointer",
                        background: mode === tab ? "#FFE135" : "transparent",
                      }}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {mode === "signup" && (
                  <div>
                    <label
                      style={{
                        fontWeight: "700",
                        fontSize: "12px",
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        display: "block",
                        marginBottom: "8px",
                      }}
                    >
                      Organization Name
                    </label>
                    <input
                      className="brutalist-input"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSignup()}
                      placeholder="acme-corp"
                      style={{ marginBottom: "16px" }}
                    />
                    {error && (
                      <p
                        style={{
                          color: "#FF4D4D",
                          fontWeight: "700",
                          fontSize: "13px",
                          marginBottom: "12px",
                          fontFamily: "'DM Mono', monospace",
                        }}
                      >
                        ⚠ {error}
                      </p>
                    )}
                    <button
                      className="brutalist-btn"
                      onClick={handleSignup}
                      disabled={loading}
                      style={{
                        width: "100%",
                        padding: "14px",
                        background: "#FFE135",
                        fontSize: "15px",
                        opacity: loading ? 0.6 : 1,
                      }}
                    >
                      {loading ? "Creating..." : "Create Organization"}
                    </button>
                  </div>
                )}

                {mode === "login" && (
                  <div>
                    <label
                      style={{
                        fontWeight: "700",
                        fontSize: "12px",
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        display: "block",
                        marginBottom: "8px",
                      }}
                    >
                      API Key
                    </label>
                    <input
                      className="brutalist-input"
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                      placeholder="sk_live_..."
                      style={{ marginBottom: "16px" }}
                    />
                    {error && (
                      <p
                        style={{
                          color: "#FF4D4D",
                          fontWeight: "700",
                          fontSize: "13px",
                          marginBottom: "12px",
                          fontFamily: "'DM Mono', monospace",
                        }}
                      >
                        ⚠ {error}
                      </p>
                    )}
                    <button
                      className="brutalist-btn"
                      onClick={handleLogin}
                      disabled={loading}
                      style={{
                        width: "100%",
                        padding: "14px",
                        background: "#FFE135",
                        fontSize: "15px",
                        opacity: loading ? 0.6 : 1,
                      }}
                    >
                      {loading ? "Logging in..." : "Enter Dashboard →"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <p
            style={{
              textAlign: "center",
              fontFamily: "'DM Mono', monospace",
              fontSize: "11px",
              color: "#999",
              marginTop: "20px",
            }}
          >
            VouchID — Identity infrastructure for AI agents
          </p>
        </div>
      </div>
    </>
  );
}
