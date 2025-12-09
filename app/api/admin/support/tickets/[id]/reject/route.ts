import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { rejection_reason } = body;

    const ticket = await prisma.supportTicket.update({
      where: { id },
      data: {
        status: 'rejected',
        resolutionNotes: rejection_reason || 'Request rejected',
        resolvedBy: currentUser.email,
        resolvedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      id: ticket.id,
      status: ticket.status,
      resolution_notes: ticket.resolutionNotes,
      resolved_by: ticket.resolvedBy,
      resolved_at: ticket.resolvedAt?.toISOString(),
    });
  } catch (error) {
    console.error('Failed to reject ticket:', error);
    return NextResponse.json({ error: 'Failed to reject ticket' }, { status: 500 });
  }
}
