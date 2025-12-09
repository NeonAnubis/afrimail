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

    const domain = await prisma.mailDomain.findUnique({
      where: { id },
    });

    if (!domain) {
      return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
    }

    // TODO: Implement actual DNS verification
    // For now, we'll just return success
    return NextResponse.json({
      success: true,
      domain: domain.domain,
      message: 'Domain verification initiated',
    });
  } catch (error) {
    console.error('Failed to verify domain:', error);
    return NextResponse.json({ error: 'Failed to verify domain' }, { status: 500 });
  }
}
