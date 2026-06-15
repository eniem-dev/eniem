import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/config";
import { env, routes } from "@/config";
import { hasActiveSubscription } from "@/features/billing";

// Routes accessible in landing mode ONLY
const LANDING_MODE_ALLOWED_ROUTES = [
  routes.landing,
  routes.legal.termsOfService,
  routes.legal.privacy,
];

// Public routes when NOT in landing mode (exact match)
const PUBLIC_ROUTES = [
  routes.home,
  routes.homeRedirect,
  routes.pricing,
  routes.auth.signup,
  routes.auth.login,
  routes.auth.forgotPassword,
  routes.auth.resetPassword,
  routes.legal.termsOfService,
  routes.legal.privacy,
];

// Public route prefixes (matches route and all sub-paths)
const PUBLIC_ROUTE_PREFIXES = [routes.blog];

const AUTH_API_PREFIX = "/api/auth";

const REQUIRE_ACCESS_ROUTES: string[] = [routes.dashboard];

function handleLandingMode(request: NextRequest): NextResponse | null {
  if (!env.landingMode) return null;

  const { pathname } = request.nextUrl;

  const isAllowedRoute = LANDING_MODE_ALLOWED_ROUTES.includes(pathname);
  return isAllowedRoute
    ? NextResponse.next()
    : NextResponse.redirect(new URL(routes.landing, request.url));
}

async function handleAccess(
  request: NextRequest,
  userId: string
): Promise<NextResponse | null> {
  const { pathname } = request.nextUrl;

  const requiresAccess = REQUIRE_ACCESS_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  if (!requiresAccess) return null;

  // Choose ONE based on your business model:
  // 1. Subscription-only (recurring payments)
  const hasUserAccess = await hasActiveSubscription(userId);

  // 2. One-time purchase (orders/benefits)
  // const hasUserAccess = await hasActiveOrder(userId);

  // 3. Hybrid (subscription OR one-time)
  // const hasUserAccess = await hasActiveSubscription(userId) || await hasActiveOrder(userId);

  return hasUserAccess
    ? null
    : NextResponse.redirect(new URL(routes.choosePlan, request.url));
}

async function handleAuthentication(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  const isPublicRoute =
    PUBLIC_ROUTES.includes(pathname) ||
    PUBLIC_ROUTE_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    ) ||
    pathname.startsWith(AUTH_API_PREFIX);

  if (isPublicRoute) return NextResponse.next();

  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session) {
      return NextResponse.redirect(new URL(routes.auth.login, request.url));
    }

    const accessResponse = await handleAccess(request, session.user.id);
    if (accessResponse) return accessResponse;

    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL(routes.auth.login, request.url));
  }
}

export async function middleware(request: NextRequest) {
  return handleLandingMode(request) ?? (await handleAuthentication(request));
}

export const config = {
  runtime: "nodejs",
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - opengraph-image, twitter-image, icon, apple-icon (Next.js generated images)
     * - manifest, robots.txt, sitemap
     * - Static assets like .png, .jpg, .svg
     */
    "/((?!_next/static|_next/image|favicon.ico|ingest|manifest|manifest.json|robots.txt|sitemap|brand.png|android-chrome-|apple-touch-icon|favicon-|opengraph-image|twitter-image|icon|apple-icon|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)",
  ],
};
