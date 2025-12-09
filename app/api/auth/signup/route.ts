import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      first_name,
      last_name,
      email,
      password,
      date_of_birth,
      gender,
      recovery_email,
      recovery_phone,
      hcaptcha_token,
      honeypot,
    } = body;

    // Check honeypot (spam protection)
    if (honeypot) {
      return NextResponse.json(
        { error: 'Invalid request' },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!first_name || !last_name || !email || !password || !recovery_email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify hCaptcha token
    if (hcaptcha_token) {
      const verifyResponse = await fetch('https://hcaptcha.com/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          secret: process.env.HCAPTCHA_SECRET_KEY || '',
          response: hcaptcha_token,
        }),
      });

      const verifyResult = await verifyResponse.json();
      if (!verifyResult.success) {
        return NextResponse.json(
          { error: 'Captcha verification failed' },
          { status: 400 }
        );
      }
    }

    // Format email to include domain if not present
    const formattedEmail = email.includes('@') ? email : `${email}@afrimail.com`;

    // Check if user already exists in users_extended table
    const existingUser = await prisma.usersExtended.findUnique({
      where: { email: formattedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      );
    }

    // Check rate limiting
    const ipAddress = request.headers.get('x-forwarded-for') || 'unknown';
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [hourlyAttempts, dailyAttempts] = await Promise.all([
      prisma.signupAttempt.count({
        where: {
          ipAddress,
          createdAt: { gte: hourAgo },
        },
      }),
      prisma.signupAttempt.count({
        where: {
          ipAddress,
          createdAt: { gte: dayAgo },
        },
      }),
    ]);

    const maxPerHour = parseInt(process.env.RATE_LIMIT_SIGNUPS_PER_HOUR || '5');
    const maxPerDay = parseInt(process.env.RATE_LIMIT_SIGNUPS_PER_DAY || '10');

    if (hourlyAttempts >= maxPerHour || dailyAttempts >= maxPerDay) {
      await prisma.signupAttempt.create({
        data: {
          ipAddress,
          emailAttempted: formattedEmail,
          hcaptchaVerified: !!hcaptcha_token,
          honeypotFilled: !!honeypot,
          success: false,
          failureReason: 'Rate limit exceeded',
          userAgent: request.headers.get('user-agent') || 'unknown',
        },
      });

      return NextResponse.json(
        { error: 'Too many signup attempts. Please try again later.' },
        { status: 429 }
      );
    }

    // Create response object for setting cookies
    const response = NextResponse.json({
      success: true,
      message: 'Please check your email to confirm your account.',
      requiresEmailConfirmation: true,
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

    // Create user in Supabase Auth with email confirmation
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: formattedEmail,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin}/auth/callback`,
        data: {
          first_name,
          last_name,
          date_of_birth: date_of_birth || null,
          gender: gender || null,
          recovery_email,
          recovery_phone: recovery_phone || null,
        },
      },
    });

    if (authError) {
      console.error('Supabase Auth Error:', authError);

      await prisma.signupAttempt.create({
        data: {
          ipAddress,
          emailAttempted: formattedEmail,
          hcaptchaVerified: !!hcaptcha_token,
          honeypotFilled: false,
          success: false,
          failureReason: authError.message,
          userAgent: request.headers.get('user-agent') || 'unknown',
        },
      });

      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      );
    }

    // If user already exists in Supabase Auth but not confirmed
    if (authData.user && !authData.user.confirmed_at) {
      // User exists but email not confirmed - this is the expected flow
    }

    // Create or update user in users_extended table
    if (authData.user) {
      await prisma.usersExtended.upsert({
        where: { email: formattedEmail },
        update: {
          firstName: first_name,
          lastName: last_name,
          dateOfBirth: date_of_birth ? new Date(date_of_birth) : null,
          gender,
          recoveryEmail: recovery_email,
          recoveryPhone: recovery_phone,
        },
        create: {
          id: authData.user.id,
          email: formattedEmail,
          firstName: first_name,
          lastName: last_name,
          dateOfBirth: date_of_birth ? new Date(date_of_birth) : null,
          gender,
          recoveryEmail: recovery_email,
          recoveryPhone: recovery_phone,
        },
      });
    }

    // Log successful signup attempt
    await prisma.signupAttempt.create({
      data: {
        ipAddress,
        emailAttempted: formattedEmail,
        hcaptchaVerified: !!hcaptcha_token,
        honeypotFilled: false,
        success: true,
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    return response;
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
