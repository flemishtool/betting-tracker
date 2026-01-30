import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET all bets
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const streamId = searchParams.get('streamId');
    const status = searchParams.get('status');

    const where: any = {};
    if (streamId) where.streamId = streamId;
    if (status) where.status = status;

    const bets = await prisma.bet.findMany({
      where,
      include: {
        stream: true,
        selections: true,
      },
      orderBy: { placedAt: 'desc' },
    });

    return NextResponse.json(bets);
  } catch (error) {
    console.error('Failed to fetch bets:', error);
    return NextResponse.json({ error: 'Failed to fetch bets' }, { status: 500 });
  }
}

// POST create new bet
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { streamId, stake, totalOdds, selections } = body;

    console.log('Creating bet:', { streamId, stake, totalOdds, selectionsCount: selections?.length });

    // Validate required fields
    if (!streamId) {
      return NextResponse.json({ error: 'Stream ID is required' }, { status: 400 });
    }
    if (!stake || stake <= 0) {
      return NextResponse.json({ error: 'Valid stake is required' }, { status: 400 });
    }
    if (!totalOdds || totalOdds <= 1) {
      return NextResponse.json({ error: 'Valid odds are required' }, { status: 400 });
    }
    if (!selections || selections.length === 0) {
      return NextResponse.json({ error: 'At least one selection is required' }, { status: 400 });
    }

    // Get stream
    const stream = await prisma.stream.findUnique({ where: { id: streamId } });
    if (!stream) {
      return NextResponse.json({ error: 'Stream not found' }, { status: 404 });
    }
    if (stream.status !== 'active') {
      return NextResponse.json({ error: 'Stream is not active' }, { status: 400 });
    }

    const dayNumber = stream.currentDay + 1;

    // Create bet with selections in a transaction
    const bet = await prisma.$transaction(async (tx) => {
      // Create the bet
      const newBet = await tx.bet.create({
        data: {
          streamId,
          dayNumber,
          stake,
          totalOdds,
          status: 'pending',
        },
      });

      // Create selections
      for (const sel of selections) {
        await tx.selection.create({
          data: {
            betId: newBet.id,
            leagueId: sel.leagueId || null,
            homeTeam: sel.homeTeam,
            awayTeam: sel.awayTeam,
            matchDate: new Date(sel.matchDate),
            market: sel.market,
            selection: sel.selection,
            odds: sel.odds,
            estimatedProbability: sel.estimatedProbability || 0.9,
            status: 'pending',
          },
        });
      }

      // Update stream
      await tx.stream.update({
        where: { id: streamId },
        data: {
          currentDay: dayNumber,
          totalBets: stream.totalBets + 1,
        },
      });

      return newBet;
    });

    // Fetch the complete bet with selections
    const completeBet = await prisma.bet.findUnique({
      where: { id: bet.id },
      include: { selections: true },
    });

    console.log('Bet created successfully:', bet.id);
    return NextResponse.json(completeBet, { status: 201 });

  } catch (error) {
    console.error('Failed to create bet:', error);
    return NextResponse.json(
      { error: 'Failed to create bet: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}