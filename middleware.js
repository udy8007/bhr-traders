import { NextResponse } from "next/server";

export function middleware(request) {
  const { pathname } = request.nextUrl;
  if (pathname === "/") {
    return NextResponse.rewrite(new URL("/index.html", request.url));
  }
  if (pathname === "/admin" || pathname === "/admin/") {
    return NextResponse.rewrite(new URL("/admin/index.html", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/admin", "/admin/"]
};
