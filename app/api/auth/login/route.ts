import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Format email to include domain if not present
    const formattedEmail = email.includes('@') ? email : `${email}@afrimail.com`;

    // Create response object for setting cookies
    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
    });

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

    // Authenticate with Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: formattedEmail,
      password,
    });

    if (authError) {
      // Log failed login attempt
      await prisma.loginActivity.create({
        data: {
          userEmail: formattedEmail,
          success: false,
          failureReason: authError.message,
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
        },
      });

      // Check if email not confirmed
      if (authError.message.includes('Email not confirmed')) {
        return NextResponse.json(
          { error: 'Please confirm your email address before logging in. Check your inbox for the confirmation link.' },
          { status: 401 }
        );
      }

      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Login failed' },
        { status: 401 }
      );
    }

    // Check if user exists in users_extended table
    let user = await prisma.usersExtended.findUnique({
      where: { email: formattedEmail },
    });

    // If user doesn't exist in users_extended, create them from Supabase Auth data
    if (!user) {
      const metadata = authData.user.user_metadata;
      user = await prisma.usersExtended.create({
        data: {
          id: authData.user.id,
          email: formattedEmail,
          firstName: metadata.first_name || '',
          lastName: metadata.last_name || '',
          dateOfBirth: metadata.date_of_birth ? new Date(metadata.date_of_birth) : null,
          gender: metadata.gender || null,
          recoveryEmail: metadata.recovery_email || null,
          recoveryPhone: metadata.recovery_phone || null,
        },
      });
    }

    // Check if user is suspended
    if (user.isSuspended) {
      await supabase.auth.signOut();
      return NextResponse.json(
        { error: 'Your account has been suspended' },
        { status: 403 }
      );
    }

    // Check if account is locked
    if (user.lockedUntil && new Date() < user.lockedUntil) {
      await supabase.auth.signOut();
      return NextResponse.json(
        { error: 'Account is temporarily locked. Please try again later.' },
        { status: 403 }
      );
    }

    // Log successful login
    await prisma.loginActivity.create({
      data: {
        userEmail: formattedEmail,
        success: true,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    // Update last login and reset failed attempts
    await prisma.usersExtended.update({
      where: { email: formattedEmail },
      data: {
        lastLogin: new Date(),
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });

    // Return success with user data
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.firstName,
        last_name: user.lastName,
      },
    }, {
      headers: response.headers,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
