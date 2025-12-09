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

    const alias = await prisma.emailAlias.findUnique({
      where: { id },
    });

    if (!alias) {
      return NextResponse.json({ error: 'Alias not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: alias.id,
      alias_address: alias.aliasAddress,
      target_addresses: alias.targetAddresses,
      is_distribution_list: alias.isDistributionList,
      is_active: alias.active,
      description: alias.description,
      created_at: alias.createdAt.toISOString(),
      updated_at: alias.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error('Failed to fetch alias:', error);
    return NextResponse.json({ error: 'Failed to fetch alias' }, { status: 500 });
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
    if (body.target_addresses !== undefined) updateData.targetAddresses = body.target_addresses;
    if (body.is_distribution_list !== undefined) updateData.isDistributionList = body.is_distribution_list;
    if (body.is_active !== undefined) updateData.active = body.is_active;
    if (body.description !== undefined) updateData.description = body.description;

    const alias = await prisma.emailAlias.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      id: alias.id,
      alias_address: alias.aliasAddress,
      target_addresses: alias.targetAddresses,
      is_distribution_list: alias.isDistributionList,
      is_active: alias.active,
      description: alias.description,
    });
  } catch (error) {
    console.error('Failed to update alias:', error);
    return NextResponse.json({ error: 'Failed to update alias' }, { status: 500 });
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

    await prisma.emailAlias.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete alias:', error);
    return NextResponse.json({ error: 'Failed to delete alias' }, { status: 500 });
  }
}
