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

    const domains = await prisma.mailDomain.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const transformedDomains = domains.map(domain => ({
      id: domain.id,
      domain: domain.domain,
      is_primary: domain.isPrimary,
      is_active: domain.isActive,
      description: domain.description,
      created_at: domain.createdAt.toISOString(),
      updated_at: domain.updatedAt.toISOString(),
    }));

    return NextResponse.json(transformedDomains);
  } catch (error) {
    console.error('Failed to fetch domains:', error);
    return NextResponse.json({ error: 'Failed to fetch domains' }, { status: 500 });
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
    const { domain, description, is_active } = body;

    // Check if domain already exists
    const existingDomain = await prisma.mailDomain.findUnique({
      where: { domain },
    });

    if (existingDomain) {
      return NextResponse.json({ error: 'Domain already exists' }, { status: 400 });
    }

    // Check if there are any existing domains
    const domainCount = await prisma.mailDomain.count();

    const newDomain = await prisma.mailDomain.create({
      data: {
        domain,
        description,
        isActive: is_active ?? true,
        isPrimary: domainCount === 0, // First domain is primary
      },
    });

    return NextResponse.json({
      id: newDomain.id,
      domain: newDomain.domain,
      is_primary: newDomain.isPrimary,
      is_active: newDomain.isActive,
      description: newDomain.description,
      created_at: newDomain.createdAt.toISOString(),
      updated_at: newDomain.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error('Failed to create domain:', error);
    return NextResponse.json({ error: 'Failed to create domain' }, { status: 500 });
  }
}
