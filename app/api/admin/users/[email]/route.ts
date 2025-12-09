import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Convert bytes to MB for display
const bytesToMb = (bytes: bigint | null) => bytes ? Math.round(Number(bytes) / (1024 * 1024)) : 0;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ email: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { email } = await params;
    const decodedEmail = decodeURIComponent(email);

    const user = await prisma.usersExtended.findUnique({
      where: { email: decodedEmail },
      include: {
        mailboxMetadata: {
          select: {
            quotaBytes: true,
            usageBytes: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user is currently locked
    const isLocked = user.lockedUntil ? user.lockedUntil > new Date() : false;

    return NextResponse.json({
      id: user.id,
      email: user.email,
      first_name: user.firstName,
      last_name: user.lastName,
      date_of_birth: user.dateOfBirth?.toISOString() || null,
      gender: user.gender,
      recovery_email: user.recoveryEmail,
      recovery_phone: user.recoveryPhone,
      is_suspended: user.isSuspended,
      is_locked: isLocked,
      failed_login_attempts: user.failedLoginAttempts,
      locked_until: user.lockedUntil?.toISOString() || null,
      quota_mb: user.mailboxMetadata ? bytesToMb(user.mailboxMetadata.quotaBytes) : 0,
      storage_used_mb: user.mailboxMetadata ? bytesToMb(user.mailboxMetadata.usageBytes) : 0,
      last_login: user.lastLogin?.toISOString() || null,
      created_at: user.createdAt.toISOString(),
      updated_at: user.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error('Failed to fetch user:', error);
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ email: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { email } = await params;
    const decodedEmail = decodeURIComponent(email);
    const body = await request.json();

    const updateData: Record<string, unknown> = {};

    if (body.first_name !== undefined) updateData.firstName = body.first_name;
    if (body.last_name !== undefined) updateData.lastName = body.last_name;
    if (body.recovery_email !== undefined) updateData.recoveryEmail = body.recovery_email;
    if (body.recovery_phone !== undefined) updateData.recoveryPhone = body.recovery_phone;

    const user = await prisma.usersExtended.update({
      where: { email: decodedEmail },
      data: updateData,
      include: {
        mailboxMetadata: {
          select: {
            quotaBytes: true,
            usageBytes: true,
          },
        },
      },
    });

    // Handle quota update separately if provided
    if (body.quota_mb !== undefined) {
      await prisma.mailboxMetadata.upsert({
        where: { email: decodedEmail },
        update: {
          quotaBytes: BigInt(body.quota_mb * 1024 * 1024),
        },
        create: {
          email: decodedEmail,
          userId: user.id,
          quotaBytes: BigInt(body.quota_mb * 1024 * 1024),
          usageBytes: BigInt(0),
        },
      });
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      first_name: user.firstName,
      last_name: user.lastName,
      quota_mb: user.mailboxMetadata ? bytesToMb(user.mailboxMetadata.quotaBytes) : 0,
    });
  } catch (error) {
    console.error('Failed to update user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ email: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { email } = await params;
    const decodedEmail = decodeURIComponent(email);

    await prisma.usersExtended.delete({
      where: { email: decodedEmail },
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        actionType: 'user_deleted',
        adminEmail: currentUser.email,
        targetUserEmail: decodedEmail,
        details: `User ${decodedEmail} deleted`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete user:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
