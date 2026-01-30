export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    let bankroll = await prisma.bankroll.findFirst();
    if (!bankroll) {
      bankroll = await prisma.bankroll.create({
        data: { id: 'default-bankroll', totalCapital: 0, availableCapital: 0 },
      });
    }
    return NextResponse.json(bankroll);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch bankroll' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const bankroll = await prisma.bankroll.update({
      where: { id: 'default-bankroll' },
      data: body,
    });
    return NextResponse.json(bankroll);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update bankroll' }, { status: 500 });
  }
}