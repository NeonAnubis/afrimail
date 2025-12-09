import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Verify admin access
    const currentUser = await getCurrentUser();
    if (!currentUser?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tickets = await prisma.supportTicket.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const transformedTickets = tickets.map(ticket => ({
      id: ticket.id,
      ticket_type: ticket.ticketType,
      user_email: ticket.userEmail,
      status: ticket.status,
      priority: ticket.priority,
      description: ticket.description,
      resolution_notes: ticket.resolutionNotes,
      assigned_to: ticket.assignedTo,
      resolved_by: ticket.resolvedBy,
      resolved_at: ticket.resolvedAt?.toISOString() || null,
      created_at: ticket.createdAt.toISOString(),
      updated_at: ticket.updatedAt.toISOString(),
    }));

    return NextResponse.json(transformedTickets);
  } catch (error) {
    console.error('Failed to fetch support tickets:', error);
    return NextResponse.json({ error: 'Failed to fetch support tickets' }, { status: 500 });
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
    const { ticket_type, user_email, priority, description } = body;

    const ticket = await prisma.supportTicket.create({
      data: {
        ticketType: ticket_type,
        userEmail: user_email,
        priority: priority || 'normal',
        description,
        status: 'pending',
      },
    });

    return NextResponse.json({
      id: ticket.id,
      ticket_type: ticket.ticketType,
      user_email: ticket.userEmail,
      status: ticket.status,
      priority: ticket.priority,
      description: ticket.description,
      created_at: ticket.createdAt.toISOString(),
    });
  } catch (error) {
    console.error('Failed to create support ticket:', error);
    return NextResponse.json({ error: 'Failed to create support ticket' }, { status: 500 });
  }
}
