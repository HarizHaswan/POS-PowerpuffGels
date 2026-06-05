import { NextResponse } from "next/server";
import { verifySession } from "./lib/session";

export async function proxy(request) {
  const { pathname } = request.nextUrl;

  // Let static files, favicon, and auth API routes bypass the middleware
  if (
    pathname.startsWith("/_next") ||
    pathname.includes("/favicon.ico") ||
    pathname.startsWith("/api/auth/login") ||
    pathname.startsWith("/api/auth/logout")
  ) {
    return NextResponse.next();
  }

  // Get the session cookie
  const sessionCookie = request.cookies.get("session");
  const sessionToken = sessionCookie ? sessionCookie.value : null;

  // Verify the session
  const session = await verifySession(sessionToken);

  const isLoginPage = pathname === "/login";
  const isApiRoute = pathname.startsWith("/api");

  // If not logged in and trying to access a protected page
  if (!session && !isLoginPage) {
    if (isApiRoute) {
      return new NextResponse(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // If logged in and trying to access the login page, redirect to home
  if (session && isLoginPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Run middleware on all paths except static files
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc. - in our case, favicon is enough)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
