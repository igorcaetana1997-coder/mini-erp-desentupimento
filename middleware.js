import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Somente admin pode acessar o painel completo.
    if (path.startsWith("/painel") && token?.role !== "admin") {
      return NextResponse.redirect(new URL("/tecnico", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: ["/painel/:path*", "/tecnico/:path*", "/ordens/:path*"],
};
