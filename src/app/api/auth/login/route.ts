import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { signSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { password } = await req.json();

  const expected = process.env.DASHBOARD_PASSWORD ?? "";
  if (!expected) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  let match = false;
  try {
    match = timingSafeEqual(
      Buffer.from(password ?? ""),
      Buffer.from(expected)
    );
  } catch {
    match = false;
  }

  if (!match) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const token = await signSession();
  const res = NextResponse.json({ ok: true });
  res.cookies.set("dashboard_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
  return res;
}
