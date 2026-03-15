"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Setup() {
  const router = useRouter();
  const [mode, setMode] = useState("new"); // "new" | "existing"
  const [orgName, setOrgName] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const handleCreateOrg = async () => {
    if (!orgName.trim()) return setError("Enter an org name");
    setLoading(true);
    setError("");
    const res = await fetch("/api/orgs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: orgName }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) return setError(data.error || "Failed to create org");
    setResult(data);
  };

  const storeKey = async (key) => {
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey: key }),
    });
    if (res.ok) {
      router.push("/dashboard");
    } else {
      const data = await res.json().catch(() => ({}));
      setError(
        data.error || `Auth failed (${res.status}) — check your API key`,
      );
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result.api_key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <nav className="nav">
        <div className="container nav-inner">
          <Link href="/" className="nav-logo">
            VOUCHID
          </Link>
        </div>
      </nav>

      <div
        className="halftone"
        style={{
          minHeight: "calc(100vh - 64px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "48px 24px",
        }}
      >
        <div style={{ width: "100%", maxWidth: "520px" }} className="fade-up">
          {result ? (
            /* Success — show API key */
            <>
              <div
                style={{
                  background: "var(--green)",
                  border: "var(--border)",
                  boxShadow: "var(--shadow-lg)",
                  padding: "24px 28px",
                  marginBottom: "-3px",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "12px" }}
                >
                  <span style={{ fontSize: "24px" }}>✓</span>
                  <div>
                    <h1 style={{ fontSize: "24px", fontWeight: "800" }}>
                      Org created!
                    </h1>
                    <p
                      className="mono"
                      style={{ fontSize: "12px", color: "#333" }}
                    >
                      Save your API key — shown only once
                    </p>
                  </div>
                </div>
              </div>
              <div className="card card-lg" style={{ padding: "28px" }}>
                <div
                  style={{
                    background: "var(--black)",
                    padding: "16px 20px",
                    marginBottom: "16px",
                  }}
                >
                  <p
                    className="mono"
                    style={{
                      fontSize: "11px",
                      color: "#888",
                      marginBottom: "6px",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                    }}
                  >
                    Your API key
                  </p>
                  <p
                    className="mono"
                    style={{
                      fontSize: "13px",
                      color: "var(--yellow)",
                      wordBreak: "break-all",
                      lineHeight: 1.6,
                    }}
                  >
                    {result.api_key}
                  </p>
                </div>
                <button
                  onClick={handleCopy}
                  className="btn btn-sm"
                  style={{
                    width: "100%",
                    background: copied ? "var(--green)" : "var(--white)",
                    marginBottom: "10px",
                  }}
                >
                  {copied ? "✓ Copied!" : "Copy to clipboard"}
                </button>
                <button
                  onClick={() => storeKey(result.api_key)}
                  className="btn btn-yellow"
                  style={{ width: "100%" }}
                >
                  Go to Dashboard →
                </button>
              </div>
            </>
          ) : (
            <>
              <div
                style={{
                  background: "var(--yellow)",
                  border: "var(--border)",
                  boxShadow: "var(--shadow-lg)",
                  padding: "24px 28px",
                  marginBottom: "-3px",
                }}
              >
                <h1 style={{ fontSize: "28px", fontWeight: "800" }}>
                  Connect your org
                </h1>
                <p
                  className="mono"
                  style={{ fontSize: "12px", color: "#555", marginTop: "4px" }}
                >
                  Create a new org or connect an existing one
                </p>
              </div>

              <div className="card card-lg">
                {/* Mode tabs */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    borderBottom: "var(--border)",
                  }}
                >
                  {[
                    ["new", "New org"],
                    ["existing", "Existing key"],
                  ].map(([m, label]) => (
                    <button
                      key={m}
                      onClick={() => {
                        setMode(m);
                        setError("");
                      }}
                      style={{
                        borderRadius: 0,
                        border: "none",
                        borderRight: m === "new" ? "var(--border)" : "none",
                        boxShadow: "none",
                        background:
                          mode === m ? "var(--yellow)" : "var(--white)",
                        padding: "16px",
                        fontSize: "13px",
                        fontFamily: "var(--font-display)",
                        fontWeight: "700",
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        cursor: "pointer",
                        transition: "background 0.15s, color 0.15s",
                        color: "var(--black)",
                      }}
                      onMouseEnter={(e) => {
                        if (m !== mode)
                          e.currentTarget.style.background = "#f5f5f5";
                      }}
                      onMouseLeave={(e) => {
                        if (m !== mode)
                          e.currentTarget.style.background = "var(--white)";
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <div style={{ padding: "28px" }}>
                  {mode === "new" ? (
                    <>
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
                        Organization name
                      </label>
                      <input
                        className="input"
                        value={orgName}
                        onChange={(e) => setOrgName(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === "Enter" && handleCreateOrg()
                        }
                        placeholder="acme-corp"
                        style={{ marginBottom: "16px" }}
                      />
                      {error && (
                        <p
                          className="mono"
                          style={{
                            color: "var(--red)",
                            fontSize: "12px",
                            fontWeight: "700",
                            marginBottom: "12px",
                          }}
                        >
                          ⚠ {error}
                        </p>
                      )}
                      <button
                        onClick={handleCreateOrg}
                        disabled={loading}
                        className="btn btn-yellow"
                        style={{ width: "100%" }}
                      >
                        {loading ? "Creating..." : "Create organization →"}
                      </button>
                    </>
                  ) : (
                    <>
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
                        API key
                      </label>
                      <input
                        className="input"
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && storeKey(apiKey)}
                        placeholder="sk_live_..."
                        style={{ marginBottom: "16px" }}
                      />
                      {error && (
                        <p
                          className="mono"
                          style={{
                            color: "var(--red)",
                            fontSize: "12px",
                            fontWeight: "700",
                            marginBottom: "12px",
                          }}
                        >
                          ⚠ {error}
                        </p>
                      )}
                      <button
                        onClick={() => storeKey(apiKey)}
                        className="btn btn-black"
                        style={{ width: "100%" }}
                      >
                        Connect →
                      </button>
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
