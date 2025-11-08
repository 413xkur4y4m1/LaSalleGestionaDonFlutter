import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default withAuth(
  function middleware(req: NextRequest) {
    // lógica adicional si se necesita
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: async ({ req, token }: { req: NextRequest; token: any | null }) => {
        // Protege rutas /estudiante
        if (req.nextUrl.pathname.startsWith("/estudiante")) {
          return Boolean(token && token.email?.endsWith("@ulsaneza.edu.mx"));
        }
        return true; // Siempre retorna boolean
      },
    },
  }
);

export const config = {
  matcher: ["/estudiante/:path*"],
};
