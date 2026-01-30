import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { result, selectionResults } = body;

    const bet = await prisma.bet.findUnique({
      where: { id: params.id },
      include: {
        selections: true,
        stream: true,
      },
    });

    if (!bet) {
      return NextResponse.json({ error: 'Bet not found' }, { status: 404 });
    }

    if (bet.status !== 'pending') {
      return NextResponse.json({ error: 'Bet already settled' }, { status: 400 });
    }

    // Update each selection's result
    if (selectionResults && typeof selectionResults === 'object') {
      for (const [selectionId, selResult] of Object.entries(selectionResults)) {
        await prisma.selection.update({
          where: { id: selectionId },
          data: {
            status: selResult as string,
            result: selResult as string,
            settledAt: new Date(),
          },
        });
      }
    }

    // Determine overall bet result
    const allSelectionsWon = bet.selections.length > 0 && 
      Object.values(selectionResults || {}).every(r => r === 'won');
    const betResult = result || (allSelectionsWon ? 'won' : 'lost');

    // Calculate returns
    const returns = betResult === 'won' ? bet.stake * bet.totalOdds : 0;

    // Update bet - ONLY status, returns, settledAt
    const updatedBet = await prisma.bet.update({
      where: { id: params.id },
      data: {
        status: betResult,
        returns: returns,
        settledAt: new Date(),
      },
    });

    // Update stream
    if (bet.stream) {
      if (betResult === 'won') {
        await prisma.stream.update({
          where: { id: bet.streamId },
          data: {
            currentDay: bet.stream.currentDay + 1,
            currentBalance: returns,
            wonBets: bet.stream.wonBets + 1,
          },
        });
      } else {
        await prisma.stream.update({
          where: { id: bet.streamId },
          data: {
            currentDay: bet.stream.currentDay + 1,
            currentBalance: 0,
            lostBets: bet.stream.lostBets + 1,
            status: 'failed',
          },
        });
      }
    }

    return NextResponse.json(updatedBet);
  } catch (error) {
    console.error('Failed to settle bet:', error);
    return NextResponse.json(
      { error: 'Failed to settle bet' },
      { status: 500 }
    );
  }
}