import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const announcement = await prisma.announcement.update({
      where: { id },
      data: {
        published: false,
      },
    });

    return NextResponse.json({
      success: true,
      id: announcement.id,
      is_published: announcement.published,
    });
  } catch (error) {
    console.error('Failed to unpublish announcement:', error);
    return NextResponse.json({ error: 'Failed to unpublish announcement' }, { status: 500 });
  }
}
