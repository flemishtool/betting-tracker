import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { amount, notes } = await request.json();
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    const bankroll = await prisma.bankroll.findFirst();
    if (!bankroll) {
      return NextResponse.json({ error: 'Bankroll not found' }, { status: 404 });
    }

    const updated = await prisma.bankroll.update({
      where: { id: bankroll.id },
      data: {
        totalCapital: bankroll.totalCapital + amount,
        availableCapital: bankroll.availableCapital + amount,
        totalDeposited: bankroll.totalDeposited + amount,
      },
    });

    await prisma.bankrollTransaction.create({
      data: {
        bankrollId: bankroll.id,
        type: 'deposit',
        amount,
        balanceBefore: bankroll.totalCapital,
        balanceAfter: updated.totalCapital,
        notes,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to deposit' }, { status: 500 });
  }
}