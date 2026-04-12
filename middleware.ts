import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";

export const config = {
  matcher: ["/((?!login|api/auth|_next/static|_next/image|favicon).*)"],
};

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("dashboard_session")?.value;

  if (token && (await verifySession(token))) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}
