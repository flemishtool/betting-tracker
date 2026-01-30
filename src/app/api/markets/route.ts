export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const markets = await prisma.marketType.findMany({
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });
    
    return NextResponse.json(markets);
  } catch (error) {
    console.error('Failed to fetch markets:', error);
    return NextResponse.json({ error: 'Failed to fetch markets' }, { status: 500 });
  }
}
