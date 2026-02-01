import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// POST /api/streams/[id]/funds - Add or withdraw funds
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { type, amount, note } = body;

    if (!type || !['deposit', 'withdraw'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be "deposit" or "withdraw"' },
        { status: 400 }
      );
    }

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      );
    }

    const stream = await prisma.stream.findUnique({
      where: { id },
    });

    if (!stream) {
      return NextResponse.json(
        { error: 'Stream not found' },
        { status: 404 }
      );
    }

    if (type === 'withdraw' && amount > stream.currentBalance) {
      return NextResponse.json(
        { error: 'Insufficient balance in stream' },
        { status: 400 }
      );
    }

    // Calculate new balance
    const newBalance = type === 'deposit' 
      ? stream.currentBalance + amount 
      : stream.currentBalance - amount;

    // Update stream and bankroll in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update stream balance
      const updatedStream = await tx.stream.update({
        where: { id },
        data: {
          currentBalance: newBalance,
          // If depositing, also update starting balance to reflect total investment
          ...(type === 'deposit' && {
            startingBalance: stream.startingBalance + amount,
          }),
        },
      });

      // Update bankroll
      const bankroll = await tx.bankroll.findFirst();
      if (bankroll) {
        if (type === 'deposit') {
          // Deposit: money moves from available capital to stream
          await tx.bankroll.update({
            where: { id: bankroll.id },
            data: {
              availableCapital: { decrement: amount },
              deployedCapital: { increment: amount },
            },
          });
        } else {
          // Withdraw: money moves from stream back to available capital
          await tx.bankroll.update({
            where: { id: bankroll.id },
            data: {
              availableCapital: { increment: amount },
              deployedCapital: { decrement: amount },
            },
          });
        }
      }

      // Create a transaction record (optional - for history)
      // You could create a StreamTransaction model for this

      return updatedStream;
    });

    return NextResponse.json({
      success: true,
      stream: result,
      message: `Successfully ${type === 'deposit' ? 'added' : 'withdrew'} £${amount.toFixed(2)} ${type === 'deposit' ? 'to' : 'from'} stream`,
    });
  } catch (error) {
    console.error('Error managing stream funds:', error);
    return NextResponse.json(
      { error: 'Failed to manage funds' },
      { status: 500 }
    );
  }
}