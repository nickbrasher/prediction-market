import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "./lib/session";

const adminRoutes = ["/admin"];
const publicRoutes = ["/login", "/signup"];

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const token = req.cookies.get("session")?.value;
  const session = token ? await verifySession(token) : null;

  if (publicRoutes.some((r) => path === r || path.startsWith(r + "/"))) {
    if (session) return NextResponse.redirect(new URL("/", req.url));
    return NextResponse.next();
  }

  if (!session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (adminRoutes.some((r) => path === r || path.startsWith(r + "/")) && !session.isAdmin) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/markets/:path*",
    "/profile",
    "/leaderboard",
    "/admin/:path*",
    "/login",
    "/signup",
  ],
};
