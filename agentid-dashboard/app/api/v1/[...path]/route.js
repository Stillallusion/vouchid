import { cookies } from "next/headers";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// FIX: use API_URL (no NEXT_PUBLIC_ prefix) — backend URL must not leak to browser bundle
const BACKEND = process.env.API_URL;

export async function GET(request, { params }) {
  return proxy(request, params, "GET");
}
export async function POST(request, { params }) {
  return proxy(request, params, "POST");
}
export async function DELETE(request, { params }) {
  return proxy(request, params, "DELETE");
}
export async function PATCH(request, { params }) {
  return proxy(request, params, "PATCH");
}
export async function PUT(request, { params }) {
  return proxy(request, params, "PUT");
}

async function proxy(request, params, method) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const cookieStore = await cookies();
  const apiKey = cookieStore.get("vouchid_session")?.value;
  if (!apiKey)
    return NextResponse.json(
      { error: "No org connected — visit /setup" },
      { status: 401 },
    );

  const resolvedParams = await params;
  const pathSegments = resolvedParams.path ?? [];

  // FIX: prevent path traversal — reject segments containing .. or backslashes
  if (pathSegments.some((s) => s.includes("..") || s.includes("\\"))) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  const backendPath = `/v1/${pathSegments.join("/")}`;
  const { search } = new URL(request.url);
  const url = `${BACKEND}${backendPath}${search}`;

  const headers = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };

  let body = undefined;
  if (method !== "GET" && method !== "DELETE") {
    try {
      body = await request.text();
    } catch {
      body = undefined;
    }
  }

  const backendRes = await fetch(url, { method, headers, body });
  const data = await backendRes.json();
  return NextResponse.json(data, { status: backendRes.status });
}
