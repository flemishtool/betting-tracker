import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const config = await prisma.aPIConfig.findFirst();
    if (!config?.apiKey) {
      return NextResponse.json({ error: 'No API key' }, { status: 400 });
    }

    // Get a fixture from DB
    const fixture = await prisma.aPIFixture.findFirst({
      where: { statusShort: 'NS' },
      orderBy: { kickoff: 'asc' }
    });

    if (!fixture) {
      return NextResponse.json({ error: 'No fixtures in DB' });
    }

    // Fetch odds from API for this REAL fixture ID
    const url = `https://v3.football.api-sports.io/odds?fixture=${fixture.apiFootballId}`;
    const response = await fetch(url, {
      headers: { 'x-apisports-key': config.apiKey },
    });
    const data = await response.json();

    return NextResponse.json({
      fixture: {
        id: fixture.id,
        apiFootballId: fixture.apiFootballId,
        match: `${fixture.homeTeamName} vs ${fixture.awayTeamName}`,
        kickoff: fixture.kickoff
      },
      apiUrl: url,
      oddsResponse: {
        resultsCount: data.results,
        hasData: data.response?.length > 0,
        bookmakers: data.response?.[0]?.bookmakers?.length || 0,
        sampleBookmaker: data.response?.[0]?.bookmakers?.[0]?.name,
        sampleBets: data.response?.[0]?.bookmakers?.[0]?.bets?.map((b: any) => b.name).slice(0, 5)
      },
      errors: data.errors
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
