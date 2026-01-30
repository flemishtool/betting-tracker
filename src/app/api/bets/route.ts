import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const bets = await prisma.bet.findMany({
      include: {
        stream: true,
        selections: {
          include: {
            league: true,
          },
        },
      },
      orderBy: { placedAt: 'desc' },
    });

    return NextResponse.json(bets);
  } catch (error) {
    console.error('Failed to fetch bets:', error);
    return NextResponse.json({ error: 'Failed to fetch bets' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Received bet data:', JSON.stringify(body, null, 2));

    const { streamId, stake, selections } = body;

    // Validate required fields
    if (!streamId) {
      return NextResponse.json({ error: 'Stream ID is required' }, { status: 400 });
    }

    if (!selections || !Array.isArray(selections) || selections.length === 0) {
      return NextResponse.json({ error: 'At least one selection is required' }, { status: 400 });
    }

    // Get the stream
    const stream = await prisma.stream.findUnique({
      where: { id: streamId },
    });

    if (!stream) {
      return NextResponse.json({ error: 'Stream not found' }, { status: 404 });
    }

    if (stream.status !== 'active') {
      return NextResponse.json({ error: 'Stream is not active' }, { status: 400 });
    }

    // Validate selections
    for (let i = 0; i < selections.length; i++) {
      const sel = selections[i];
      if (!sel.odds || typeof sel.odds !== 'number' || sel.odds < 1.01) {
        return NextResponse.json({ 
          error: `Selection ${i + 1} has invalid odds: ${sel.odds}` 
        }, { status: 400 });
      }
    }

    // Calculate total odds
    const totalOdds = selections.reduce((acc: number, sel: any) => {
      return acc * (parseFloat(sel.odds) || 1);
    }, 1);

    // Use current balance as stake
    const actualStake = stake || stream.currentBalance;

    // Default match date to today if not provided
    const defaultMatchDate = new Date();

    // Build selection data matching your ACTUAL schema
    const selectionData = selections.map((sel: any) => ({
      leagueId: sel.leagueId || null,  // Direct field, not relation
      homeTeam: sel.homeTeam,
      awayTeam: sel.awayTeam,
      market: sel.market,               // Store market name here
      selection: sel.selection || sel.market,
      odds: parseFloat(sel.odds),
      status: 'pending',
      matchDate: sel.matchDate ? new Date(sel.matchDate) : defaultMatchDate,
      estimatedProbability: sel.estimatedProbability || 0.90,
    }));

    console.log('Selection data:', JSON.stringify(selectionData, null, 2));

    // Create the bet with selections
    const bet = await prisma.bet.create({
      data: {
        streamId: streamId,  // Direct field
        dayNumber: stream.currentDay + 1,
        stake: actualStake,
        totalOdds: Math.round(totalOdds * 100) / 100,
        status: 'pending',
        placedAt: new Date(),
        selections: {
          create: selectionData,
        },
      },
      include: {
        selections: {
          include: {
            league: true,
          },
        },
      },
    });

    // Update stream
    await prisma.stream.update({
      where: { id: streamId },
      data: {
        totalBets: stream.totalBets + 1,
      },
    });

    console.log('Bet created successfully:', bet.id);

    return NextResponse.json(bet);
  } catch (error) {
    console.error('Failed to create bet:', error);
    return NextResponse.json({ 
      error: 'Failed to create bet: ' + (error instanceof Error ? error.message : 'Unknown error') 
    }, { status: 500 });
  }
}