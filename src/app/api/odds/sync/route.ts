export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const BET_IDS = {
  MATCH_WINNER: 1,
  GOALS_OVER_UNDER: 5,
  BTTS: 8,
  DOUBLE_CHANCE: 12,
};

export async function POST(request: NextRequest) {
  try {
    const config = await prisma.aPIConfig.findFirst();
    if (!config?.apiKey) {
      return NextResponse.json({ error: 'No API key configured' }, { status: 400 });
    }

    const fixtures = await prisma.aPIFixture.findMany({
      where: {
        statusShort: 'NS',
        kickoff: { gte: new Date() },
      },
      orderBy: { kickoff: 'asc' },
      take: 50,
    });

    let oddsCreated = 0;
    let oddsUpdated = 0;

    for (const fixture of fixtures) {
      try {
        const url = `https://v3.football.api-sports.io/odds?fixture=${fixture.apiFixtureId}`;
        const response = await fetch(url, {
          headers: { 'x-apisports-key': config.apiKey },
        });

        const data = await response.json();
        
        if (!data.response?.[0]?.bookmakers?.length) continue;

        const bookmaker = data.response[0].bookmakers.find((b: any) =>
          b.name.toLowerCase().includes('bet365')
        ) || data.response[0].bookmakers[0];

        if (!bookmaker) continue;

        const matchWinner = bookmaker.bets.find((b: any) => b.id === BET_IDS.MATCH_WINNER);
        const goalsOU = bookmaker.bets.find((b: any) => b.id === BET_IDS.GOALS_OVER_UNDER);
        const btts = bookmaker.bets.find((b: any) => b.id === BET_IDS.BTTS);
        const doubleChance = bookmaker.bets.find((b: any) => b.id === BET_IDS.DOUBLE_CHANCE);

        const getOdd = (bet: any, value: string): number | null => {
          if (!bet?.values) return null;
          const found = bet.values.find((v: any) => 
            v.value.toLowerCase() === value.toLowerCase()
          );
          return found ? parseFloat(found.odd) : null;
        };

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
          over45Goals: getOdd(goalsOU, 'Over 4.5'),
          under45Goals: getOdd(goalsOU, 'Under 4.5'),
          bttsYes: getOdd(btts, 'Yes'),
          bttsNo: getOdd(btts, 'No'),
          homeOrDraw: getOdd(doubleChance, 'Home/Draw'),
          awayOrDraw: getOdd(doubleChance, 'Draw/Away'),
          homeOrAway: getOdd(doubleChance, 'Home/Away'),
          updatedAt: new Date(),
        };

        await prisma.aPIOdds.upsert({
          where: {
            apiFixtureId_bookmakerName: {
              apiFixtureId: fixture.apiFixtureId,
              bookmakerName: bookmaker.name,
            },
          },
          update: oddsData,
          create: {
            apiFixtureId: fixture.apiFixtureId,
            ...oddsData,
          },
        });
        
        oddsUpdated++;
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (err: any) {
        console.error(`Fixture ${fixture.apiFixtureId}:`, err.message);
      }
    }

    return NextResponse.json({
      success: true,
      stats: { fixturesProcessed: fixtures.length, oddsUpdated },
    });

  } catch (error: any) {
    console.error('Odds sync error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const count = await prisma.aPIOdds.count();
    
    const sample = await prisma.aPIOdds.findMany({
      take: 5,
      orderBy: { updatedAt: 'desc' },
    });

    // Get fixture names separately
    const fixtureIds = sample.map(s => s.apiFixtureId);
    const fixtures = await prisma.aPIFixture.findMany({
      where: { apiFixtureId: { in: fixtureIds } },
      select: { apiFixtureId: true, homeTeamName: true, awayTeamName: true },
    });

    const fixtureMap = new Map(fixtures.map(f => [f.apiFixtureId, f]));

    return NextResponse.json({
      totalOdds: count,
      sample: sample.map(o => {
        const fix = fixtureMap.get(o.apiFixtureId);
        return {
          match: fix ? `${fix.homeTeamName} vs ${fix.awayTeamName}` : 'Unknown',
          over05: o.over05Goals,
          over15: o.over15Goals,
          over25: o.over25Goals,
          bttsYes: o.bttsYes,
        };
      }),
    });
  } catch (error: any) {
    console.error('Odds GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
