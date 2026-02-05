import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const config = await prisma.aPIConfig.findFirst();
    if (!config?.apiKey) {
      return NextResponse.json({ error: 'No API key' }, { status: 400 });
    }

    const today = new Date().toISOString().split('T')[0];
    const url = `https://v3.football.api-sports.io/fixtures?date=${today}`;
    const response = await fetch(url, {
      headers: { 'x-apisports-key': config.apiKey },
    });
    const data = await response.json();

    if (!data.response) {
      return NextResponse.json({ error: 'No response from API', data });
    }

    const majorLeagueIds = [39, 140, 78, 135, 61, 88, 94, 144, 179, 203, 2, 3];
    const majorFixtures = data.response.filter((f: any) => 
      majorLeagueIds.includes(f.league.id)
    );

    const created = [];
    for (const fix of majorFixtures.slice(0, 10)) {
      try {
        await prisma.aPIFixture.create({
          data: {
            apiFootballId: fix.fixture.id,
            apiLeagueId: fix.league.id,
            season: fix.league.season,
            homeTeamId: fix.teams.home.id,
            homeTeamName: fix.teams.home.name,
            awayTeamId: fix.teams.away.id,
            awayTeamName: fix.teams.away.name,
            kickoff: new Date(fix.fixture.date),
            venue: fix.fixture.venue?.name || null,
            status: fix.fixture.status.long,
            statusShort: fix.fixture.status.short,
            minute: fix.fixture.status.elapsed,
            homeGoals: fix.goals.home,
            awayGoals: fix.goals.away,
          }
        });
        created.push(`${fix.teams.home.name} vs ${fix.teams.away.name} (ID: ${fix.fixture.id})`);
      } catch (e: any) {
        created.push(`ERROR: ${e.message.slice(0, 150)}`);
      }
    }

    return NextResponse.json({
      apiTotal: data.response.length,
      majorLeagues: majorFixtures.length,
      created
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
