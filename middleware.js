import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

function homeFor(role) {
  if (role === "admin") return "/painel";
  if (role === "parceiro") return "/parceiro";
  return "/tecnico";
}

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;
    const role = token?.role;

    // Cada papel só acessa a própria área — /ordens/:path* é liberado pra qualquer
    // papel logado (posse é validada na própria página do recibo).
    if (path.startsWith("/painel") && role !== "admin") {
      return NextResponse.redirect(new URL(homeFor(role), req.url));
    }
    if (path.startsWith("/tecnico") && role !== "tecnico" && role !== "admin") {
      return NextResponse.redirect(new URL(homeFor(role), req.url));
    }
    if (path.startsWith("/parceiro") && role !== "parceiro" && role !== "admin") {
      return NextResponse.redirect(new URL(homeFor(role), req.url));
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
  matcher: ["/painel/:path*", "/tecnico/:path*", "/parceiro/:path*", "/ordens/:path*", "/conta/:path*"],
};
