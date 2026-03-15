import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const BACKEND = process.env.NEXT_PUBLIC_API_URL;

// Org registration doesn't need the session cookie — it returns a new API key.
// We still require Clerk auth so random visitors can't spam it.
export async function POST(request) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await request.json();
  const backendRes = await fetch(`${BACKEND}/v1/orgs/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await backendRes.json();
  return NextResponse.json(data, { status: backendRes.status });
}
