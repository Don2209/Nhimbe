import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

// Optimistic check only: pages and actions re-verify the user against the DB.
export const proxy = auth((req) => {
  const { pathname, search } = req.nextUrl;
  if (req.auth || pathname === "/login") return;
  const url = new URL("/login", req.nextUrl);
  if (pathname !== "/") url.searchParams.set("callbackUrl", pathname + search);
  return NextResponse.redirect(url);
});

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
