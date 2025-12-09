import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tickets = await prisma.supportTicket.findMany({
      where: { userEmail: currentUser.email },
      orderBy: { createdAt: 'desc' },
    });

    const transformedTickets = tickets.map(ticket => ({
      id: ticket.id,
      ticket_type: ticket.ticketType,
      status: ticket.status,
      priority: ticket.priority,
      description: ticket.description,
      resolution_notes: ticket.resolutionNotes,
      resolved_at: ticket.resolvedAt?.toISOString() || null,
      created_at: ticket.createdAt.toISOString(),
      updated_at: ticket.updatedAt.toISOString(),
    }));

    return NextResponse.json(transformedTickets);
  } catch (error) {
    console.error('Failed to fetch tickets:', error);
    return NextResponse.json({ error: 'Failed to fetch tickets' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { ticket_type, description } = body;

    if (!ticket_type || !description) {
      return NextResponse.json(
        { error: 'Ticket type and description are required' },
        { status: 400 }
      );
    }

    const ticket = await prisma.supportTicket.create({
      data: {
        ticketType: ticket_type,
        userEmail: currentUser.email,
        description,
        status: 'pending',
        priority: 'normal',
      },
    });

    return NextResponse.json({
      id: ticket.id,
      ticket_type: ticket.ticketType,
      status: ticket.status,
      description: ticket.description,
      created_at: ticket.createdAt.toISOString(),
    });
  } catch (error) {
    console.error('Failed to create ticket:', error);
    return NextResponse.json({ error: 'Failed to create ticket' }, { status: 500 });
  }
}
