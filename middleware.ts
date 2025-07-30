import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const sessionToken =
      req.cookies.get("next-auth.session-token")?.value ||
      req.cookies.get("__Secure-next-auth.session-token")?.value;

    console.log("[DEBUG] Middleware:", {
      pathname: req.nextUrl.pathname,
      sessionToken: sessionToken ? "EXISTS" : "NOT_FOUND",
      cookies: req.cookies.getAll().map((c) => c.name),
    });

    if (
      sessionToken &&
      (req.nextUrl.pathname === "/login" || req.nextUrl.pathname === "/")
    ) {
      console.log(
        "[DEBUG] Middleware: Redirecting authenticated user to /dashboard"
      );
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    // Let withAuth handle all other cases
  },
  {
    pages: {
      signIn: "/login",
    },
    callbacks: {
      authorized: ({ token }) => !!token, // Allow any authenticated user
    },
  }
);

export const config = {
  matcher: [
    // Protect specific routes that need authentication
    "/dashboard/:path*",
    "/doorcard/:path*",
    "/admin/:path*",
    "/profile/:path*",
  ],
};
