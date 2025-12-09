import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Create response object for cookie handling
    const response = NextResponse.json({ error: 'Processing' });

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
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    // Get authenticated user (more secure than getSession)
    const { data: { user: authUser }, error: userError } = await supabase.auth.getUser();

    if (userError || !authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userEmail = authUser.email;

    if (!userEmail) {
      return NextResponse.json(
        { error: 'User email not found' },
        { status: 400 }
      );
    }

    // Check if user is an admin
    const admin = await prisma.adminUser.findUnique({
      where: { email: userEmail },
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
        createdAt: true,
        lastLogin: true,
      },
    });

    if (admin) {
      return NextResponse.json({
        ...admin,
        isAdmin: true,
      });
    }

    // Regular user
    const user = await prisma.usersExtended.findUnique({
      where: { email: userEmail },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        dateOfBirth: true,
        gender: true,
        recoveryEmail: true,
        recoveryPhone: true,
        isSuspended: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      // Create user from Supabase data if not exists
      const metadata = authUser.user_metadata;
      const newUser = await prisma.usersExtended.create({
        data: {
          id: authUser.id,
          email: userEmail,
          firstName: metadata.first_name || '',
          lastName: metadata.last_name || '',
          dateOfBirth: metadata.date_of_birth ? new Date(metadata.date_of_birth) : null,
          gender: metadata.gender || null,
          recoveryEmail: metadata.recovery_email || null,
          recoveryPhone: metadata.recovery_phone || null,
        },
      });

      return NextResponse.json({
        id: newUser.id,
        email: newUser.email,
        first_name: newUser.firstName,
        last_name: newUser.lastName,
        date_of_birth: newUser.dateOfBirth?.toISOString(),
        gender: newUser.gender,
        recovery_email: newUser.recoveryEmail,
        recovery_phone: newUser.recoveryPhone,
        is_suspended: newUser.isSuspended,
        last_login: newUser.lastLogin?.toISOString(),
        created_at: newUser.createdAt.toISOString(),
        updated_at: newUser.updatedAt.toISOString(),
        isAdmin: false,
      });
    }

    // Transform to expected format
    return NextResponse.json({
      id: user.id,
      email: user.email,
      first_name: user.firstName,
      last_name: user.lastName,
      date_of_birth: user.dateOfBirth?.toISOString(),
      gender: user.gender,
      recovery_email: user.recoveryEmail,
      recovery_phone: user.recoveryPhone,
      is_suspended: user.isSuspended,
      last_login: user.lastLogin?.toISOString(),
      created_at: user.createdAt.toISOString(),
      updated_at: user.updatedAt.toISOString(),
      isAdmin: false,
    });
  } catch (error) {
    console.error('Get current user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
