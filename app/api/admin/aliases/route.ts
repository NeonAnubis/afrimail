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

    const aliases = await prisma.emailAlias.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const transformedAliases = aliases.map(alias => ({
      id: alias.id,
      alias_address: alias.aliasAddress,
      target_addresses: alias.targetAddresses,
      is_distribution_list: alias.isDistributionList,
      description: alias.description,
      active: alias.active,
      created_by: alias.createdBy,
      created_at: alias.createdAt.toISOString(),
      updated_at: alias.updatedAt.toISOString(),
    }));

    return NextResponse.json(transformedAliases);
  } catch (error) {
    console.error('Failed to fetch aliases:', error);
    return NextResponse.json({ error: 'Failed to fetch aliases' }, { status: 500 });
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
    const { alias_address, target_addresses, is_distribution_list, description, active } = body;

    // Check if alias already exists
    const existingAlias = await prisma.emailAlias.findUnique({
      where: { aliasAddress: alias_address },
    });

    if (existingAlias) {
      return NextResponse.json({ error: 'Alias already exists' }, { status: 400 });
    }

    const alias = await prisma.emailAlias.create({
      data: {
        aliasAddress: alias_address,
        targetAddresses: target_addresses,
        isDistributionList: is_distribution_list ?? false,
        description,
        active: active ?? true,
        createdBy: currentUser.id,
      },
    });

    return NextResponse.json({
      id: alias.id,
      alias_address: alias.aliasAddress,
      target_addresses: alias.targetAddresses,
      is_distribution_list: alias.isDistributionList,
      description: alias.description,
      active: alias.active,
      created_by: alias.createdBy,
      created_at: alias.createdAt.toISOString(),
      updated_at: alias.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error('Failed to create alias:', error);
    return NextResponse.json({ error: 'Failed to create alias' }, { status: 500 });
  }
}
