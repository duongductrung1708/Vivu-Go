import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Redirect uppercase routes to lowercase to prevent case-sensitivity issues
  if (pathname === "/Auth" || pathname === "/Dashboard") {
    const lowerPath = pathname.toLowerCase();
    return NextResponse.redirect(new URL(lowerPath, request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ["/Auth", "/Dashboard", "/Trip", "/Itinerary/:path*"],
};
