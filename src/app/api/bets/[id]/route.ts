export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bet = await prisma.bet.findUnique({
      where: { id: params.id },
      include: {
        stream: true,
        selections: true,
      },
    });

    if (!bet) {
      return NextResponse.json({ error: 'Bet not found' }, { status: 404 });
    }

    return NextResponse.json(bet);
  } catch (error) {
    console.error('Failed to fetch bet:', error);
    return NextResponse.json({ error: 'Failed to fetch bet' }, { status: 500 });
  }
}