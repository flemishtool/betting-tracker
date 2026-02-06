import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

interface OddsValue {
  value: string;
  odd: string;
}

interface BookmakerBet {
  id: number;
  name: string;
  values: OddsValue[];
}

interface Bookmaker {
  id: number;
  name: string;
  bets: BookmakerBet[];
}

interface OddsAPIResponse {
  response: Array<{
    bookmakers: Bookmaker[];
  }>;
}

function getOdd(bet: BookmakerBet | undefined, valueName: string): number | null {
  if (!bet) return null;
  const value = bet.values.find(v => v.value === valueName);
  return value ? parseFloat(value.odd) : null;
}

export async function POST(request: Request) {
  try {
    const config = await prisma.aPIConfig.findFirst();
    if (!config?.apiKey) {
      return NextResponse.json({ error: 'API not configured' }, { status: 500 });
    }

    const body = await request.json().catch(() => ({}));
    const limit = body.limit || 10;

    // Get upcoming fixtures that need odds
    const fixtures = await prisma.aPIFixture.findMany({
      where: {
        statusShort: 'NS',
        kickoff: { gte: new Date() },
      },
      take: limit,
      orderBy: { kickoff: 'asc' },
    });

    let oddsUpdated = 0;

    for (const fixture of fixtures) {
      try {
        const url = `https://v3.football.api-sports.io/odds?fixture=${fixture.apiFootballId}`;
        const response = await fetch(url, {
          headers: { 'x-apisports-key': config.apiKey },
        });
        const data: OddsAPIResponse = await response.json();

        if (!data.response?.[0]?.bookmakers?.length) continue;

        // Use first bookmaker
        const bookmaker = data.response[0].bookmakers[0];
        const bets = bookmaker.bets;

        const matchWinner = bets.find(b => b.name === 'Match Winner');
        const goalsOU = bets.find(b => b.name === 'Goals Over/Under');
        const btts = bets.find(b => b.name === 'Both Teams Score');
        const doubleChance = bets.find(b => b.name === 'Double Chance');

        const oddsData = {
          bookmakerName: bookmaker.name,
          homeWin: getOdd(matchWinner, 'Home'),
          draw: getOdd(matchWinner, 'Draw'),
          awayWin: getOdd(matchWinner, 'Away'),
          over05Goals: getOdd(goalsOU, 'Over 0.5'),
          under05Goals: getOdd(goalsOU, 'Under 0.5'),
          over15Goals: getOdd(goalsOU, 'Over 1.5'),
          under15Goals: getOdd(goalsOU, 'Under 1.5'),
          over25Goals: getOdd(goalsOU, 'Over 2.5'),
          under25Goals: getOdd(goalsOU, 'Under 2.5'),
          over35Goals: getOdd(goalsOU, 'Over 3.5'),
          under35Goals: getOdd(goalsOU, 'Under 3.5'),
          bttsYes: getOdd(btts, 'Yes'),
          bttsNo: getOdd(btts, 'No'),
          homeOrDraw: getOdd(doubleChance, 'Home/Draw'),
          awayOrDraw: getOdd(doubleChance, 'Draw/Away'),
          homeOrAway: getOdd(doubleChance, 'Home/Away'),
          fetchedAt: new Date(),
        };

        await prisma.aPIFixtureOdds.upsert({
          where: {
            fixtureId_bookmakerName: {
              fixtureId: fixture.id,
              bookmakerName: bookmaker.name,
            },
          },
          update: oddsData,
          create: {
            fixtureId: fixture.id,
            ...oddsData,
          },
        });

        oddsUpdated++;
        await new Promise(resolve => setTimeout(resolve, 300));

      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error(`Fixture ${fixture.apiFootballId}:`, message);
      }
    }

    return NextResponse.json({
      success: true,
      stats: { fixturesProcessed: fixtures.length, oddsUpdated },
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Odds sync error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const count = await prisma.aPIFixtureOdds.count();
    
    if (count === 0) {
      return NextResponse.json({ message: 'No odds in database', count: 0 });
    }

    const sample = await prisma.aPIFixtureOdds.findMany({
      take: 5,
      include: { fixture: true },
      orderBy: { fetchedAt: 'desc' },
    });

    return NextResponse.json({ count, sample });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
