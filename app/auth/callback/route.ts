import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/login';

  if (code) {
    // Create response for redirect
    const redirectUrl = new URL(next, origin);
    redirectUrl.searchParams.set('confirmed', 'true');
    const response = NextResponse.redirect(redirectUrl);

    // Create Supabase client with cookie handling
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    // Exchange the code for a session
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Successfully confirmed email, redirect to login page with success message
      return response;
    }

    console.error('Auth callback error:', error);
  }

  // If there's an error or no code, redirect to error page or login
  const errorUrl = new URL('/login', origin);
  errorUrl.searchParams.set('error', 'email_confirmation_failed');
  return NextResponse.redirect(errorUrl);
}
