import { auth, currentUser } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const BACKEND = process.env.NEXT_PUBLIC_API_URL;
const COOKIE_NAME = "vouchid_session";
const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  path: "/",
  maxAge: 60 * 60 * 24 * 30, // 30 days
};

// Called once on first dashboard visit.
// If the user already has a session cookie, does nothing.
// If not, auto-creates an org using their Clerk identity and stores the key.
export async function POST() {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  // Already provisioned — nothing to do
  const cookieStore = await cookies();
  const existing = cookieStore.get(COOKIE_NAME);
  if (existing?.value)
    return NextResponse.json({ ok: true, provisioned: false });

  // Get Clerk user details to build the org name
  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress || "";
  const username = email.split("@")[0] || userId.slice(0, 12);
  // Use clerk user ID suffix to ensure uniqueness across re-registrations
  const orgName = `${username}-${userId.slice(-6)}`;

  let backendRes;
  try {
    backendRes = await fetch(`${BACKEND}/v1/orgs/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: orgName }),
    });
  } catch (err) {
    return NextResponse.json(
      { error: `Backend unreachable: ${err.message}` },
      { status: 502 },
    );
  }

  const text = await backendRes.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return NextResponse.json(
      { error: "Backend returned invalid response" },
      { status: 502 },
    );
  }

  if (!backendRes.ok) {
    // If org name already exists (409), try with full userId to guarantee uniqueness
    if (backendRes.status === 409) {
      const retryRes = await fetch(`${BACKEND}/v1/orgs/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `user-${userId.replace(/[^a-z0-9]/gi, "").slice(0, 24)}`,
        }),
      });
      const retryData = await retryRes.json().catch(() => ({}));
      if (!retryRes.ok)
        return NextResponse.json(
          { error: retryData.error || "Failed to provision org" },
          { status: 500 },
        );
      cookieStore.set(COOKIE_NAME, retryData.api_key, COOKIE_OPTS);
      return NextResponse.json({ ok: true, provisioned: true });
    }
    return NextResponse.json(
      { error: data.error || "Failed to create org" },
      { status: 500 },
    );
  }

  cookieStore.set(COOKIE_NAME, data.api_key, COOKIE_OPTS);
  return NextResponse.json({ ok: true, provisioned: true });
}
