import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { selections } = body;

    const bet = await prisma.bet.findUnique({
      where: { id: params.id },
      include: { stream: true, selections: true },
    });

    if (!bet) {
      return NextResponse.json({ error: 'Bet not found' }, { status: 404 });
    }

    if (bet.status !== 'pending') {
      return NextResponse.json({ error: 'Bet already settled' }, { status: 400 });
    }

    // Update each selection
    for (const sel of selections) {
      await prisma.selection.update({
        where: { id: sel.id },
        data: {
          status: sel.status,
          settledAt: new Date(),
        },
      });
    }

    const anyLost = selections.some((s: any) => s.status === 'lost');
    const stream = bet.stream!;

    if (anyLost) {
      // BET LOST - Stream fails
      await prisma.bet.update({
        where: { id: params.id },
        data: {
          status: 'lost',
          returns: 0,
          profit: -bet.stake,
          settledAt: new Date(),
        },
      });

      await prisma.stream.update({
        where: { id: stream.id },
        data: {
          status: 'failed',
          currentBalance: 0,
          lostBets: stream.lostBets + 1,
          actualWinRate: stream.totalBets > 0 ? stream.wonBets / stream.totalBets : 0,
          endedAt: new Date(),
        },
      });

      // Update bankroll
      const bankroll = await prisma.bankroll.findFirst();
      if (bankroll) {
        const netLoss = stream.initialStake - stream.totalCashedOut;
        await prisma.bankroll.update({
          where: { id: bankroll.id },
          data: {
            deployedCapital: Math.max(0, bankroll.deployedCapital - stream.currentBalance),
            lifetimeProfitLoss: bankroll.lifetimeProfitLoss - netLoss,
          },
        });
      }
    } else {
      // BET WON
      const returns = bet.stake * bet.totalOdds;
      const profit = returns - bet.stake;
      const cashoutAmount = returns * stream.cashoutPercentage;
      const reinvestAmount = returns * stream.reinvestmentPercentage;

      await prisma.bet.update({
        where: { id: params.id },
        data: {
          status: 'won',
          returns,
          profit,
          amountReinvested: reinvestAmount,
          amountCashedOut: cashoutAmount,
          balanceAfter: reinvestAmount,
          settledAt: new Date(),
        },
      });

      const targetReached = stream.targetBalance && reinvestAmount >= stream.targetBalance;

      await prisma.stream.update({
        where: { id: stream.id },
        data: {
          currentBalance: reinvestAmount,
          totalCashedOut: stream.totalCashedOut + cashoutAmount,
          wonBets: stream.wonBets + 1,
          actualWinRate: (stream.wonBets + 1) / stream.totalBets,
          status: targetReached ? 'completed' : 'active',
          endedAt: targetReached ? new Date() : null,
        },
      });

      // Update bankroll
      const bankroll = await prisma.bankroll.findFirst();
      if (bankroll) {
        const balanceChange = reinvestAmount - stream.currentBalance;
        await prisma.bankroll.update({
          where: { id: bankroll.id },
          data: {
            availableCapital: bankroll.availableCapital + cashoutAmount,
            totalCashedOutFromStreams: bankroll.totalCashedOutFromStreams + cashoutAmount,
            deployedCapital: bankroll.deployedCapital + balanceChange,
            lifetimeProfitLoss: bankroll.lifetimeProfitLoss + cashoutAmount,
          },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to settle bet:', error);
    return NextResponse.json({ error: 'Failed to settle bet' }, { status: 500 });
  }
}