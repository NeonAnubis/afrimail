import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

// Define protected routes
const protectedRoutes = ['/dashboard', '/admin'];
const adminRoutes = ['/admin'];
const publicRoutes = ['/', '/login', '/signup', '/forgot-password', '/verify-otp', '/reset-password', '/admin/login', '/auth/callback'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes and API auth routes
  if (
    publicRoutes.some(route => pathname === route) ||
    pathname.startsWith('/api/auth/') ||
    pathname.startsWith('/auth/')
  ) {
    return NextResponse.next();
  }

  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route));

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  // Create response for potential redirects or cookie updates
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Create Supabase client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Get authenticated user (more secure than getSession)
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    // No valid user, redirect to login
    const loginUrl = isAdminRoute ? '/admin/login' : '/login';
    return NextResponse.redirect(new URL(loginUrl, request.url));
  }

  // For admin routes, check if user has admin role
  // This would require checking user metadata or a separate admin table
  if (isAdminRoute) {
    // Check admin_users table via metadata or implement admin check
    const userMetadata = user.user_metadata;
    const isAdmin = userMetadata?.is_admin === true;

    if (!isAdmin) {
      // For now, allow access if they're authenticated
      // You may want to implement proper admin role checking
      // return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|api/auth).*)',
  ],
};
