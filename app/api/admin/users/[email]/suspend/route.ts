import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(
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
    const { reason } = body;

    const user = await prisma.usersExtended.update({
      where: { email: decodedEmail },
      data: {
        isSuspended: true,
      },
    });

    // Log the action with suspension details
    await prisma.auditLog.create({
      data: {
        actionType: 'user_suspended',
        adminEmail: currentUser.email,
        targetUserEmail: decodedEmail,
        details: `User suspended. Reason: ${reason || 'No reason provided'}`,
      },
    });

    return NextResponse.json({
      success: true,
      email: user.email,
      is_suspended: user.isSuspended,
    });
  } catch (error) {
    console.error('Failed to suspend user:', error);
    return NextResponse.json({ error: 'Failed to suspend user' }, { status: 500 });
  }
}
