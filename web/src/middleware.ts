import { auth } from "@/auth";

export default auth((req) => {
  const isAuth = !!req.auth;
  const p = req.nextUrl.pathname;
  const isPublic = p === "/signin" || p.startsWith("/api/auth") || p.startsWith("/_next") || p === "/favicon.ico";
  if (!isAuth && !isPublic) {
    const signInUrl = new URL("/signin", req.nextUrl.origin);
    signInUrl.searchParams.set("callbackUrl", req.nextUrl.href);
    return Response.redirect(signInUrl);
  }
  return undefined;
});

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
