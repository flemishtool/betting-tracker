export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  const config = await prisma.aPIConfig.findFirst();
  if (!config?.apiKey) {
    return NextResponse.json({ error: 'No API key' });
  }

  const fixture = await prisma.aPIFixture.findFirst({
    where: { statusShort: 'NS', kickoff: { gte: new Date() } },
    orderBy: { kickoff: 'asc' },
  });

  if (!fixture) {
    return NextResponse.json({ error: 'No upcoming fixtures' });
  }

  const url = `https://v3.football.api-sports.io/odds?fixture=${fixture.apiFixtureId}`;
  const response = await fetch(url, {
    headers: { 'x-apisports-key': config.apiKey },
  });
  const data = await response.json();

  return NextResponse.json({
    fixture: `${fixture.homeTeamName} vs ${fixture.awayTeamName}`,
    fixtureId: fixture.apiFixtureId,
    kickoff: fixture.kickoff,
    hasOdds: data.response?.length > 0,
    bookmakerCount: data.response?.[0]?.bookmakers?.length || 0,
    rawErrors: data.errors,
  });
}
