import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect admin routes (except login page)
  if (pathname.startsWith("/admin/") && pathname !== "/admin") {
    const token = request.cookies.get("admin_token")?.value;
    if (!token) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    // Token exists — actual verification happens in API routes
    // Middleware only checks presence; full JWT verification is server-side
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path+"],
};
