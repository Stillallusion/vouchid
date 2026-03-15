"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashNav from "../components/dashNav";

export default function Settings() {
  const router = useRouter();
  const [org, setOrg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const [rotating, setRotating] = useState(false);
  const [newKey, setNewKey] = useState(null);
  const [newKeyCopied, setNewKeyCopied] = useState(false);
  const [confirmRotate, setConfirmRotate] = useState(false);

  useEffect(() => {
    fetchOrg();
  }, []);

  const fetchOrg = async () => {
    const res = await fetch("/api/v1/orgs/me");
    if (res.status === 401) {
      router.push("/sign-in");
      return;
    }
    const data = await res.json();
    setLoading(false);
    if (res.ok) setOrg(data);
  };

  const handleCopy = (key) => {
    navigator.clipboard.writeText(key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRotate = async () => {
    if (!confirmRotate) {
      setConfirmRotate(true);
      return;
    }
    setRotating(true);
    setConfirmRotate(false);
    const res = await fetch("/api/v1/orgs/rotate-key", { method: "POST" });
    const data = await res.json();
    setRotating(false);
    if (res.ok) {
      setNewKey(data.api_key);
      setOrg((prev) => ({ ...prev, api_key: data.api_key }));
      // Update the session cookie with the new key
      await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: data.api_key }),
      });
    }
  };

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
            <p className="mono">Loading...</p>
          </div>
        </div>
      </div>
    );

  const maskedKey = org?.api_key
    ? `${org.api_key.slice(0, 12)}${"•".repeat(24)}${org.api_key.slice(-4)}`
    : "";

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <DashNav />

      <div
        className="container"
        style={{ padding: "48px 24px", maxWidth: "720px" }}
      >
        <div
          className="section-header fade-up"
          style={{ marginBottom: "32px" }}
        >
          <h2>Settings</h2>
          <div className="section-divider" />
        </div>

        {/* Org info */}
        <div
          className="card card-lg fade-up-1"
          style={{ marginBottom: "24px" }}
        >
          <div
            style={{
              background: "var(--yellow)",
              borderBottom: "var(--border)",
              padding: "16px 24px",
            }}
          >
            <h3
              style={{
                fontSize: "16px",
                fontWeight: "800",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              Organization
            </h3>
          </div>
          <div style={{ padding: "24px" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
              }}
            >
              {[
                { label: "Org name", value: org?.name },
                { label: "Org ID", value: org?.org_id },
                { label: "Plan", value: (org?.plan || "free").toUpperCase() },
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
                    style={{
                      fontSize: "13px",
                      fontWeight: "600",
                      wordBreak: "break-all",
                    }}
                  >
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* API Key */}
        <div className="card card-lg fade-up-2">
          <div
            style={{
              background: "var(--black)",
              borderBottom: "var(--border)",
              padding: "16px 24px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h3
              style={{
                fontSize: "16px",
                fontWeight: "800",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "var(--yellow)",
              }}
            >
              API Key
            </h3>
            <span className="tag tag-gray" style={{ fontSize: "10px" }}>
              Keep this secret
            </span>
          </div>

          <div style={{ padding: "24px" }}>
            {/* Key display */}
            <div
              style={{
                background: "var(--black)",
                padding: "16px 20px",
                marginBottom: "16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
              }}
            >
              <p
                className="mono"
                style={{
                  fontSize: "13px",
                  color: "var(--yellow)",
                  wordBreak: "break-all",
                  flex: 1,
                  lineHeight: 1.6,
                }}
              >
                {visible ? org?.api_key : maskedKey}
              </p>
              <button
                onClick={() => setVisible((v) => !v)}
                className="btn btn-sm"
                style={{
                  background: "#1a1a1a",
                  color: "var(--white)",
                  flexShrink: 0,
                  border: "2px solid #333",
                  boxShadow: "none",
                }}
              >
                {visible ? "Hide" : "Show"}
              </button>
            </div>

            <div style={{ display: "flex", gap: "10px", marginBottom: "24px" }}>
              <button
                onClick={() => handleCopy(org?.api_key)}
                className="btn btn-sm"
                style={{
                  flex: 1,
                  background: copied ? "var(--green)" : "var(--white)",
                }}
              >
                {copied ? "✓ Copied!" : "Copy key"}
              </button>
            </div>

            {/* New key shown after rotation */}
            {newKey && (
              <div
                style={{
                  background: "#E8FFF4",
                  border: "2px solid var(--green)",
                  padding: "16px 20px",
                  marginBottom: "20px",
                }}
              >
                <p
                  style={{
                    fontWeight: "700",
                    fontSize: "12px",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: "var(--green)",
                    marginBottom: "8px",
                  }}
                >
                  ✓ New key generated — copy it now
                </p>
                <p
                  className="mono"
                  style={{
                    fontSize: "12px",
                    color: "#333",
                    wordBreak: "break-all",
                    marginBottom: "12px",
                    lineHeight: 1.6,
                  }}
                >
                  {newKey}
                </p>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(newKey);
                    setNewKeyCopied(true);
                    setTimeout(() => setNewKeyCopied(false), 2000);
                  }}
                  className="btn btn-sm btn-green"
                >
                  {newKeyCopied ? "✓ Copied" : "Copy new key"}
                </button>
              </div>
            )}

            {/* Rotate section */}
            <div style={{ borderTop: "var(--border)", paddingTop: "20px" }}>
              <p
                style={{
                  fontWeight: "700",
                  fontSize: "13px",
                  marginBottom: "4px",
                }}
              >
                Rotate API key
              </p>
              <p
                className="mono"
                style={{
                  fontSize: "12px",
                  color: "var(--gray)",
                  marginBottom: "16px",
                  lineHeight: 1.6,
                }}
              >
                Generates a new key and immediately invalidates the old one.
                Update your .env files and any agents using the current key.
              </p>

              {confirmRotate ? (
                <div
                  style={{
                    background: "#FFF5F5",
                    border: "2px solid var(--red)",
                    padding: "16px 20px",
                    marginBottom: "12px",
                  }}
                >
                  <p
                    style={{
                      fontWeight: "700",
                      fontSize: "13px",
                      color: "var(--red)",
                      marginBottom: "12px",
                    }}
                  >
                    ⚠ This will break all agents using the current key. Are you
                    sure?
                  </p>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button
                      onClick={() => setConfirmRotate(false)}
                      className="btn btn-sm"
                      style={{ flex: 1 }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleRotate}
                      disabled={rotating}
                      className="btn btn-sm btn-red"
                      style={{ flex: 1 }}
                    >
                      {rotating ? "Rotating..." : "Yes, rotate key"}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleRotate}
                  className="btn btn-sm"
                  style={{ borderColor: "var(--red)", color: "var(--red)" }}
                >
                  ↻ Rotate key
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
