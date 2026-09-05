import { NextResponse } from "next/server";
import { apiKeyUnauthorized, isApiKeyExempt, isValidApiKey, readApiKey } from "./server/lib/apiKey.js";

export function middleware(request) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/")) {
    if (!isApiKeyExempt(pathname, request.method) && !isValidApiKey(readApiKey(request))) {
      return apiKeyUnauthorized();
    }
    return NextResponse.next();
  }

  if (pathname === "/") {
    return NextResponse.rewrite(new URL("/index.html", request.url));
  }
  if (pathname === "/admin" || pathname === "/admin/") {
    return NextResponse.rewrite(new URL("/admin/index.html", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*", "/", "/admin", "/admin/"]
};
