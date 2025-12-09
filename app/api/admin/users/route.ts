import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const currentUser = await getCurrentUser();
    if (!currentUser?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const users = await prisma.usersExtended.findMany({
      orderBy: { createdAt: 'desc' },
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
        failedLoginAttempts: true,
        lockedUntil: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Transform to match expected format
    const transformedUsers = users.map(user => ({
      id: user.id,
      email: user.email,
      first_name: user.firstName,
      last_name: user.lastName,
      date_of_birth: user.dateOfBirth?.toISOString() || null,
      gender: user.gender,
      recovery_email: user.recoveryEmail,
      recovery_phone: user.recoveryPhone,
      is_suspended: user.isSuspended,
      last_login: user.lastLogin?.toISOString() || null,
      failed_login_attempts: user.failedLoginAttempts,
      locked_until: user.lockedUntil?.toISOString() || null,
      created_at: user.createdAt.toISOString(),
      updated_at: user.updatedAt.toISOString(),
    }));

    return NextResponse.json(transformedUsers);
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    const currentUser = await getCurrentUser();
    if (!currentUser?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { email, first_name, last_name, password, quota_bytes } = body;

    // Check if user already exists
    const existingUser = await prisma.usersExtended.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }

    // Create user
    const user = await prisma.usersExtended.create({
      data: {
        email,
        firstName: first_name,
        lastName: last_name,
        // In production, you'd also create the mailbox in Mailcow
      },
    });

    return NextResponse.json({
      id: user.id,
      email: user.email,
      first_name: user.firstName,
      last_name: user.lastName,
      is_suspended: user.isSuspended,
      created_at: user.createdAt.toISOString(),
    });
  } catch (error) {
    console.error('Failed to create user:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}
