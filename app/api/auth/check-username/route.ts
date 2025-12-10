import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { username } = await request.json();

    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    // Format email to include domain
    const formattedEmail = username.includes('@')
      ? username
      : `${username}@afrimail.com`;

    // Check if user exists in users_extended table
    const existingUser = await prisma.usersExtended.findUnique({
      where: { email: formattedEmail },
      select: { id: true },
    });

    if (existingUser) {
      return NextResponse.json({ available: false });
    }

    // Also check Supabase Auth for pending registrations
    // Create a temporary Supabase client to check
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll() {
            // No-op for this check
          },
        },
      }
    );

    // Try to get user from Supabase Auth admin API (if service role key is available)
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const { data } = await supabase.auth.admin.listUsers();
        const userExists = data?.users?.some(
          (user) => user.email?.toLowerCase() === formattedEmail.toLowerCase()
        );
        if (userExists) {
          return NextResponse.json({ available: false });
        }
      } catch {
        // If admin API fails, continue with just the database check
      }
    }

    return NextResponse.json({ available: true });
  } catch (error) {
    console.error('Check username error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
