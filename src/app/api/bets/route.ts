import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { streamId, stake, selections } = body;

    // Validation
    if (!streamId || !stake || !selections || selections.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get the stream
    const stream = await prisma.stream.findUnique({
      where: { id: streamId },
    });

    if (!stream) {
      return NextResponse.json(
        { error: 'Stream not found' },
        { status: 404 }
      );
    }

    if (stake > stream.currentBalance) {
      return NextResponse.json(
        { error: 'Insufficient balance in stream' },
        { status: 400 }
      );
    }

    // Calculate total odds
    const totalOdds = selections.reduce(
      (acc: number, sel: { odds: number }) => acc * sel.odds,
      1
    );

    // Create bet with selections in a transaction
    const bet = await prisma.$transaction(async (tx) => {
      // Create the bet
      const newBet = await tx.bet.create({
        data: {
          streamId,
          stake,
          totalOdds,
          status: 'pending',
          dayNumber: stream.currentDay,
          selections: {
            create: selections.map((sel: {
              leagueId?: string;
              market: string;
              selection: string;
              homeTeam: string;
              awayTeam: string;
              odds: number;
              estimatedProbability?: number;
              matchTime?: string;
            }) => ({
              homeTeam: sel.homeTeam,
              awayTeam: sel.awayTeam,
              market: sel.market,
              selection: sel.selection,
              odds: sel.odds,
              status: 'pending',
              matchDate: sel.matchTime ? new Date(sel.matchTime) : new Date(),
              estimatedProbability: sel.estimatedProbability || 0.5,
              ...(sel.leagueId && { leagueId: sel.leagueId }),
            })),
          },
        },
        include: {
          selections: true,
        },
      });

      // Update stream balance (deduct stake)
      await tx.stream.update({
        where: { id: streamId },
        data: {
          currentBalance: { decrement: stake },
        },
      });

      return newBet;
    });

    return NextResponse.json(bet, { status: 201 });
  } catch (error) {
    console.error('Error creating bet:', error);
    return NextResponse.json(
      { error: 'Failed to create bet' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const streamId = searchParams.get('streamId');
    const status = searchParams.get('status');

    const where: Record<string, unknown> = {};
    if (streamId) where.streamId = streamId;
    if (status) where.status = status;

    const bets = await prisma.bet.findMany({
      where,
      include: {
        selections: true,
        stream: true,
      },
      orderBy: { placedAt: 'desc' },
    });

    return NextResponse.json(bets);
  } catch (error) {
    console.error('Error fetching bets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bets' },
      { status: 500 }
    );
  }
}