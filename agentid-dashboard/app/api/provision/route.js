import { auth, currentUser } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const BACKEND = process.env.API_URL;
const CONVEX_URL = process.env.CONVEX_URL;
const COOKIE_NAME = "vouchid_session";
const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  path: "/",
  maxAge: 60 * 60 * 24 * 30,
};

// Call Convex HTTP API directly — no generated types needed in the dashboard
async function convexQuery(functionPath, args) {
  const res = await fetch(`${CONVEX_URL}/api/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path: functionPath, args }),
  });
  const data = await res.json();
  if (data.status === "error") return null;
  return data.value ?? null;
}

async function convexMutation(functionPath, args) {
  const res = await fetch(`${CONVEX_URL}/api/mutation`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path: functionPath, args }),
  });
  const data = await res.json();
  return data.value ?? null;
}

export async function POST() {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const cookieStore = await cookies();

  // 1. Check if this Clerk user already has an org in Convex
  const existingOrg = await convexQuery("agents:getOrgByClerkUserId", {
    clerkUserId: userId,
  });

  if (existingOrg) {
    // User has an org — restore their session cookie and return
    cookieStore.set(COOKIE_NAME, existingOrg.apiKey, COOKIE_OPTS);
    return NextResponse.json({ ok: true, provisioned: false });
  }

  // 2. Cookie already set (legacy session without clerkUserId linked)
  const existing = cookieStore.get(COOKIE_NAME);
  if (existing?.value)
    return NextResponse.json({ ok: true, provisioned: false });

  // 3. Brand new user — create a fresh org
  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress || "";
  const username = email.split("@")[0] || userId.slice(0, 12);
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
    if (backendRes.status === 409) {
      // Name collision — retry with full userId
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

      await convexMutation("agents:setOrgClerkUserId", {
        orgId: retryData.org_id,
        clerkUserId: userId,
      });
      cookieStore.set(COOKIE_NAME, retryData.api_key, COOKIE_OPTS);
      return NextResponse.json({ ok: true, provisioned: true });
    }
    return NextResponse.json(
      { error: data.error || "Failed to create org" },
      { status: 500 },
    );
  }

  // Link Clerk user ID to the new org for future logins on any device
  await convexMutation("agents:setOrgClerkUserId", {
    orgId: data.org_id,
    clerkUserId: userId,
  });
  cookieStore.set(COOKIE_NAME, data.api_key, COOKIE_OPTS);
  return NextResponse.json({ ok: true, provisioned: true });
}
