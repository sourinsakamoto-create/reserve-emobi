import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth";

export async function proxy(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;
  const { pathname } = request.nextUrl;

  const needsAdmin = pathname.startsWith("/admin");
  const needsAnyStaff = pathname.startsWith("/guide");

  const unauthorized = needsAdmin
    ? !session || session.role !== "ADMIN"
    : needsAnyStaff
    ? !session
    : false;

  if (unauthorized) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/guide/:path*"],
};
