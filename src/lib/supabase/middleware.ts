import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: "", ...options });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Public paths — no auth required
  const publicPaths = [
    "/login",
    "/signup",
    "/callback",
    // Stripe webhook — validated by Stripe signature
    "/api/webhooks",
    // GHL Agent Studio sub-agents — validated by x-sal-key header
    "/api/mcp/chat",
    "/api/launchpad",
    "/api/creative",
    "/api/builder/agent",
    "/api/ghl/contacts",
    // Public health check
    "/api/health",
  ];

  const isPublicPath = publicPaths.some((path) =>
    pathname.startsWith(path)
  );

  // API routes that don't need redirect (return 401 instead)
  const isApiRoute = pathname.startsWith("/api/");

  if (!user && !isPublicPath) {
    if (isApiRoute) {
      // For protected API routes, return 401 JSON (not a redirect)
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return response;
}
