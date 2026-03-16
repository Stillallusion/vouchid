import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const COOKIE_NAME = "vouchid_session";
const COOKIE_OPTS = {
  httpOnly: true, // JS cannot read this — XSS proof
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  path: "/",
  maxAge: 60 * 60 * 24 * 7, // 7 days
};

// POST /api/auth — log in by storing the API key in an httpOnly cookie
export async function POST(request) {
  const { apiKey } = await request.json();

  if (!apiKey || !apiKey.startsWith("sk_live_")) {
    return NextResponse.json({ error: "Invalid API key" }, { status: 400 });
  }

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, apiKey, COOKIE_OPTS);

  return NextResponse.json({ ok: true });
}

// DELETE /api/auth — log out by clearing the cookie
export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  return NextResponse.json({ ok: true });
}

// GET /api/auth — check if the user is authenticated (used by client components)
export async function GET() {
  const cookieStore = await cookies();
  const session = cookieStore.get(COOKIE_NAME);
  return NextResponse.json({ authenticated: !!session?.value });
}
