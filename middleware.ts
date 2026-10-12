import { NextResponse, type NextRequest } from "next/server";

// Chặn nhanh: chưa có cookie thì đẩy về /login. Xác thực thật nằm ở lib/auth.ts (requireOfficer).
export function middleware(req: NextRequest) {
  if (!req.cookies.get("mdt_session")) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/mdt/:path*", "/api/search"] };
