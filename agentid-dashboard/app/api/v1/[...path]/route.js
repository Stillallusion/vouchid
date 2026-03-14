import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const BACKEND = process.env.NEXT_PUBLIC_API_URL;

// Catch-all proxy: /api/v1/[...path] → backend /v1/[...path]
// Reads the httpOnly session cookie server-side and injects the Authorization header.
// The API key never touches the browser.
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
  const cookieStore = await cookies();
  const apiKey = cookieStore.get("vouchid_session")?.value;

  if (!apiKey) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const resolvedParams = await params;
  const pathSegments = resolvedParams.path ?? [];
  const backendPath = `/v1/${pathSegments.join("/")}`;

  // Forward query string if present
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
