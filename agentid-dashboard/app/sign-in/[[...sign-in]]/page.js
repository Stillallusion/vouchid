import { SignIn } from "@clerk/nextjs";
import Link from "next/link";

export default function SignInPage() {
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
          borderTop: "none",
        }}
      >
        <div style={{ width: "100%", maxWidth: "480px" }}>
          {/* Header block */}
          <div
            style={{
              background: "var(--yellow)",
              border: "var(--border)",
              boxShadow: "var(--shadow-lg)",
              padding: "24px 28px",
              marginBottom: "-3px",
            }}
          >
            <h1
              style={{
                fontSize: "32px",
                fontWeight: "800",
                letterSpacing: "-0.5px",
              }}
            >
              Welcome back.
            </h1>
            <p
              className="mono"
              style={{ fontSize: "13px", color: "#555", marginTop: "4px" }}
            >
              Sign in to your VouchID dashboard
            </p>
          </div>

          {/* Clerk sign-in */}
          <div
            style={{
              border: "var(--border)",
              boxShadow: "var(--shadow-xl)",
              background: "var(--white)",
              overflow: "hidden",
            }}
          >
            <SignIn
              appearance={{
                elements: {
                  rootBox: { width: "100%", display: "block" },
                  card: {
                    boxShadow: "none",
                    border: "none",
                    borderRadius: 0,
                    width: "100%",
                    margin: 0,
                    padding: "24px",
                    fontFamily: "var(--font-display)",
                  },
                  headerTitle: { display: "none" },
                  headerSubtitle: { display: "none" },
                  socialButtonsBlockButton: {
                    border: "var(--border)",
                    borderRadius: 0,
                    boxShadow: "3px 3px 0 var(--black)",
                    fontWeight: "700",
                    fontFamily: "var(--font-display)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    transition: "transform 0.08s, box-shadow 0.08s",
                  },
                  formFieldInput: {
                    border: "var(--border)",
                    borderRadius: 0,
                    fontFamily: "var(--font-mono)",
                    background: "var(--bg)",
                    boxShadow: "none",
                  },
                  formButtonPrimary: {
                    background: "var(--black)",
                    border: "var(--border)",
                    borderRadius: 0,
                    boxShadow: "var(--shadow)",
                    fontFamily: "var(--font-display)",
                    fontWeight: "700",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  },
                  footerActionLink: { color: "var(--blue)", fontWeight: "700" },
                  dividerLine: { background: "var(--black)", height: "2px" },
                  dividerText: {
                    fontFamily: "var(--font-mono)",
                    fontSize: "12px",
                  },
                  formFieldLabel: {
                    fontFamily: "var(--font-display)",
                    fontWeight: "700",
                    textTransform: "uppercase",
                    fontSize: "11px",
                    letterSpacing: "0.08em",
                  },
                  identityPreviewText: { fontFamily: "var(--font-mono)" },
                  alertText: {
                    fontFamily: "var(--font-mono)",
                    fontSize: "13px",
                  },
                },
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
