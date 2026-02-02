import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { type, amount } = body;

    if (!type || !['deposit', 'withdraw'].includes(type)) {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    const bankroll = await prisma.bankroll.findUnique({ where: { id } });

    if (!bankroll) {
      return NextResponse.json({ error: 'Bankroll not found' }, { status: 404 });
    }

    if (type === 'withdraw' && amount > bankroll.availableCapital) {
      return NextResponse.json(
        { error: 'Insufficient available capital' },
        { status: 400 }
      );
    }

    const updatedBankroll = await prisma.bankroll.update({
      where: { id },
      data: type === 'deposit'
        ? {
            totalCapital: { increment: amount },
            availableCapital: { increment: amount },
            totalDeposited: { increment: amount },
          }
        : {
            totalCapital: { decrement: amount },
            availableCapital: { decrement: amount },
            totalWithdrawn: { increment: amount },
          },
    });

    const symbol = bankroll.currency === 'GBP' ? '£' : bankroll.currency === 'EUR' ? '€' : '$';

    return NextResponse.json({
      success: true,
      bankroll: updatedBankroll,
      message: `Successfully ${type === 'deposit' ? 'added' : 'withdrew'} ${symbol}${amount.toFixed(2)}`,
    });
  } catch (error) {
    console.error('Error managing bankroll:', error);
    return NextResponse.json({ error: 'Failed to manage bankroll' }, { status: 500 });
  }
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const bankroll = await prisma.bankroll.findUnique({ where: { id } });

    if (!bankroll) {
      return NextResponse.json({ error: 'Bankroll not found' }, { status: 404 });
    }

    return NextResponse.json(bankroll);
  } catch (error) {
    console.error('Error fetching bankroll:', error);
    return NextResponse.json({ error: 'Failed to fetch bankroll' }, { status: 500 });
  }
}