import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const allCookies = req.cookies.getAll().map((c) => c.name);
  const hasSessionCookie =
    allCookies.includes("__Secure-next-auth.session-token") ||
    allCookies.includes("next-auth.session-token");
  const hasSecret = !!process.env.NEXTAUTH_SECRET;

  let token = null;
  let tokenError = "";
  try {
    token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  } catch (e) {
    tokenError = e instanceof Error ? e.message : String(e);
  }

  console.log("[middleware]", req.nextUrl.pathname, {
    cookieNames: allCookies,
    hasSessionCookie,
    hasSecret,
    tokenFound: !!token,
    tokenError: tokenError || undefined,
  });

  if (!token) {
    const signInUrl = new URL("/login", req.url);
    signInUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Admin routes require platform admin
  if (req.nextUrl.pathname.startsWith("/admin")) {
    if (token.email !== process.env.ADMIN_EMAIL) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/topics/:path*",
    "/content-health/:path*",
    "/validate/:path*",
    "/settings/:path*",
    "/onboarding/:path*",
    "/admin/:path*",
  ],
};
