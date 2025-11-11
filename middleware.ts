import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequestWithAuth } from "next-auth/middleware";

export default withAuth(
  async function middleware(request: NextRequestWithAuth) {
    // Check if the user is authenticated and has the correct email domain
    if (
      request.nextUrl.pathname.startsWith("/estudiante") &&
      !request.nextauth.token?.email?.endsWith("@lasalle.mx")
    ) {
      return NextResponse.redirect(new URL("/", request.url)); // Redirect to home if not authorized
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        // Only allow if token exists and email ends with @lasalle.mx
        return !!token && token.email?.endsWith("@lasalle.mx") === true;
      },
    },
    pages: {
        signIn: "/",
    },
  }
);

export const config = {
  matcher: ["/estudiante/:path*"],
};