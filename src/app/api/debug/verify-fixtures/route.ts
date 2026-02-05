import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const config = await prisma.aPIConfig.findFirst();
    if (!config?.apiKey) {
      return NextResponse.json({ error: 'No API key' }, { status: 400 });
    }

    // Get a fixture from our DB
    const dbFixture = await prisma.aPIFixture.findFirst({
      where: { statusShort: 'NS' },
      orderBy: { kickoff: 'asc' }
    });

    if (!dbFixture) {
      return NextResponse.json({ error: 'No fixtures in DB' });
    }

    // Try to look up this fixture ID in the API
    const url = `https://v3.football.api-sports.io/fixtures?id=${dbFixture.apiFixtureId}`;
    const response = await fetch(url, {
      headers: { 'x-apisports-key': config.apiKey },
    });
    const apiData = await response.json();

    // Also fetch today's REAL fixtures from API for Greek Super League (197)
    const today = new Date().toISOString().split('T')[0];
    const realUrl = `https://v3.football.api-sports.io/fixtures?date=${today}`;
    const realResponse = await fetch(realUrl, {
      headers: { 'x-apisports-key': config.apiKey },
    });
    const realData = await realResponse.json();

    return NextResponse.json({
      dbFixture: {
        apiFixtureId: dbFixture.apiFixtureId,
        match: `${dbFixture.homeTeamName} vs ${dbFixture.awayTeamName}`,
        kickoff: dbFixture.kickoff,
        league: dbFixture.leagueName
      },
      apiLookup: {
        found: apiData.response?.length > 0,
        fixture: apiData.response?.[0] ? {
          id: apiData.response[0].fixture.id,
          match: `${apiData.response[0].teams.home.name} vs ${apiData.response[0].teams.away.name}`,
          date: apiData.response[0].fixture.date
        } : null,
        errors: apiData.errors
      },
      todayRealFixtures: {
        count: realData.response?.length || 0,
        sample: realData.response?.slice(0, 3).map((f: any) => ({
          id: f.fixture.id,
          match: `${f.teams.home.name} vs ${f.teams.away.name}`,
          league: f.league.name,
          time: f.fixture.date
        }))
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
