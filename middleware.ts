import { NextResponse, NextRequest } from "next/server";

const protectedRoutes = ["/dashboard", "/"];
const publicRoutes = ["/login"];

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isProtectedRoute = protectedRoutes.includes(path);
  const isPublicRoute = publicRoutes.includes(path);

  const session = request.cookies.get("session")?.value;

  // 4. Redirect to /login if the user is not authenticated
  if (isProtectedRoute && !session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 5. Redirect to / if the user is authenticated
  if (isPublicRoute && session) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // If session exists, continue to the requested page
  return NextResponse.next();
}

// Routes Middleware should not run on
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
};
