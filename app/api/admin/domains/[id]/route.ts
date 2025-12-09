import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(
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

    return NextResponse.json({
      id: domain.id,
      domain: domain.domain,
      is_active: domain.isActive,
      is_primary: domain.isPrimary,
      description: domain.description,
      created_at: domain.createdAt.toISOString(),
      updated_at: domain.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error('Failed to fetch domain:', error);
    return NextResponse.json({ error: 'Failed to fetch domain' }, { status: 500 });
  }
}

export async function PUT(
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

    const updateData: Record<string, unknown> = {};
    if (body.is_active !== undefined) updateData.isActive = body.is_active;
    if (body.is_primary !== undefined) updateData.isPrimary = body.is_primary;
    if (body.description !== undefined) updateData.description = body.description;

    const domain = await prisma.mailDomain.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      id: domain.id,
      domain: domain.domain,
      is_active: domain.isActive,
      is_primary: domain.isPrimary,
      description: domain.description,
    });
  } catch (error) {
    console.error('Failed to update domain:', error);
    return NextResponse.json({ error: 'Failed to update domain' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    await prisma.mailDomain.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete domain:', error);
    return NextResponse.json({ error: 'Failed to delete domain' }, { status: 500 });
  }
}
