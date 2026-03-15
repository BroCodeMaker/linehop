import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect /admin/* routes
  if (!pathname.startsWith("/admin")) return NextResponse.next();

  // Allow login page through
  if (pathname === "/admin/login") return NextResponse.next();

  const session = request.cookies.get("superadmin_session")?.value;
  if (!session) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  // Verify session structure: must be a valid JWT-like token
  // Full verification happens in API routes; middleware just checks presence + basic format
  const parts = session.split(".");
  if (parts.length !== 3) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
