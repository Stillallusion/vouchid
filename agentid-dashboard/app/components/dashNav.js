"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton, useUser } from "@clerk/nextjs";

export default function DashNav({ pendingCount = 0 }) {
  const pathname = usePathname();
  const { user } = useUser();

  const links = [
    { href: "/dashboard", label: "Agents" },
    {
      href: "/approvals",
      label: `Approvals${pendingCount > 0 ? ` (${pendingCount})` : ""}`,
    },
    { href: "/settings", label: "Settings" },
  ];

  return (
    <nav className="nav">
      <div className="container nav-inner">
        <Link href="/dashboard" className="nav-logo">
          VOUCHID
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          {links.map(({ href, label }) => {
            const active =
              pathname === href ||
              (href !== "/dashboard" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className="btn btn-sm"
                style={{
                  background: active ? "var(--black)" : "transparent",
                  color: active ? "var(--yellow)" : "var(--black)",
                  boxShadow: active ? "3px 3px 0 var(--black)" : "none",
                  border: active ? "var(--border)" : "2px solid transparent",
                }}
              >
                {label}
                {label.includes("Approvals") && pendingCount > 0 && (
                  <span
                    style={{
                      background: "var(--red)",
                      color: "var(--white)",
                      borderRadius: "50%",
                      width: "18px",
                      height: "18px",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "10px",
                      fontWeight: "800",
                      marginLeft: "4px",
                    }}
                  >
                    {pendingCount}
                  </span>
                )}
              </Link>
            );
          })}

          <div
            style={{
              width: "1px",
              height: "24px",
              background: "var(--black)",
              margin: "0 8px",
              opacity: 0.3,
            }}
          />

          <UserButton
            afterSignOutUrl="/"
            appearance={{
              elements: {
                avatarBox: {
                  border: "var(--border)",
                  borderRadius: 0,
                  boxShadow: "3px 3px 0 var(--black)",
                },
                userButtonPopoverCard: {
                  border: "var(--border)",
                  borderRadius: 0,
                  boxShadow: "var(--shadow-xl)",
                  fontFamily: "var(--font-display)",
                },
                userButtonPopoverActionButton: {
                  fontFamily: "var(--font-display)",
                  fontWeight: "700",
                },
              },
            }}
          />
        </div>
      </div>
    </nav>
  );
}
