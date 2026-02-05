import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const config = await prisma.aPIConfig.findFirst();
    if (!config?.apiKey) {
      return NextResponse.json({ error: 'No API key' }, { status: 400 });
    }

    const fixture = await prisma.aPIFixture.findFirst({
      where: { statusShort: 'NS' },
      orderBy: { kickoff: 'asc' }
    });

    if (!fixture) {
      return NextResponse.json({ error: 'No fixtures in DB' });
    }

    const url = `https://v3.football.api-sports.io/odds?fixture=${fixture.apiFootballId}`;
    const response = await fetch(url, {
      headers: { 'x-apisports-key': config.apiKey },
    });
    const data = await response.json();

    if (!data.response?.[0]?.bookmakers) {
      return NextResponse.json({ error: 'No bookmakers in response' });
    }

    const stored = [];
    for (const bookmaker of data.response[0].bookmakers.slice(0, 3)) {
      const oddsData: any = {
        fixtureId: fixture.id,
        bookmakerName: bookmaker.name,
      };

      for (const bet of bookmaker.bets) {
        if (bet.name === 'Goals Over/Under') {
          for (const value of bet.values) {
            const odd = parseFloat(value.odd);
            if (value.value === 'Over 0.5') oddsData.over05Goals = odd;
            if (value.value === 'Under 0.5') oddsData.under05Goals = odd;
            if (value.value === 'Over 1.5') oddsData.over15Goals = odd;
            if (value.value === 'Under 1.5') oddsData.under15Goals = odd;
            if (value.value === 'Over 2.5') oddsData.over25Goals = odd;
            if (value.value === 'Under 2.5') oddsData.under25Goals = odd;
            if (value.value === 'Over 3.5') oddsData.over35Goals = odd;
            if (value.value === 'Under 3.5') oddsData.under35Goals = odd;
          }
        }
        if (bet.name === 'Both Teams Score') {
          for (const value of bet.values) {
            if (value.value === 'Yes') oddsData.bttsYes = parseFloat(value.odd);
            if (value.value === 'No') oddsData.bttsNo = parseFloat(value.odd);
          }
        }
        if (bet.name === 'Match Winner') {
          for (const value of bet.values) {
            if (value.value === 'Home') oddsData.homeWin = parseFloat(value.odd);
            if (value.value === 'Draw') oddsData.draw = parseFloat(value.odd);
            if (value.value === 'Away') oddsData.awayWin = parseFloat(value.odd);
          }
        }
      }

      await prisma.aPIFixtureOdds.upsert({
        where: { fixtureId_bookmakerName: { fixtureId: fixture.id, bookmakerName: bookmaker.name } },
        update: oddsData,
        create: oddsData,
      });

      stored.push({ bookmaker: bookmaker.name, ...oddsData });
    }

    return NextResponse.json({
      fixture: `${fixture.homeTeamName} vs ${fixture.awayTeamName}`,
      storedOdds: stored
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
