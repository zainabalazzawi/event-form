import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("next-auth.session-token");

  if (!token && request.nextUrl.pathname === "/create-event") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (!token && request.nextUrl.pathname === "/create-group") {
    return NextResponse.redirect(new URL("/groups", request.url));
  }


  return NextResponse.next();
}

export const config = {
  matcher: ["/create-event", "/create-group", ]
};