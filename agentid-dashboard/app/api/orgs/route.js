import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// FIX: use API_URL — backend URL must not be in the browser bundle
const BACKEND = process.env.API_URL;

export async function POST(request) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  if (!BACKEND)
    return NextResponse.json(
      { error: "API_URL not configured" },
      { status: 500 },
    );

  let backendRes;
  try {
    const body = await request.json();
    backendRes = await fetch(`${BACKEND}/v1/orgs/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
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
    data = {
      error: `Backend returned non-JSON response (${backendRes.status})`,
    };
  }

  return NextResponse.json(data, { status: backendRes.status });
}
