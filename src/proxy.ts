import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// Next.js 16 renamed middleware.ts/middleware() to proxy.ts/proxy() -- same role.
// Gates every route except /login and the NextAuth handler (excluded via matcher below).
export const proxy = auth((req) => {
  const isLoggedIn = !!req.auth;
  const isLoginPage = req.nextUrl.pathname === "/login";

  if (!isLoggedIn && !isLoginPage) {
    return NextResponse.redirect(new URL("/login", req.nextUrl.origin));
  }

  if (isLoggedIn && isLoginPage) {
    return NextResponse.redirect(new URL("/", req.nextUrl.origin));
  }
});

export const config = {
  // manifest + icons are fetched by the browser without cookies, so they must bypass the gate.
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|manifest.webmanifest|pwa-icon).*)"],
};
