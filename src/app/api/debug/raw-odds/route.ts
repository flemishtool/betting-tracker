import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const config = await prisma.aPIConfig.findFirst();
    if (!config?.apiKey) {
      return NextResponse.json({ error: 'No API key configured' }, { status: 400 });
    }

    // Get a fixture to test
    const fixture = await prisma.aPIFixture.findFirst({
      where: {
        statusShort: 'NS',
        kickoff: { gte: new Date() },
      },
      orderBy: { kickoff: 'asc' },
    });

    if (!fixture) {
      return NextResponse.json({ error: 'No upcoming fixtures' }, { status: 404 });
    }

    const url = `https://v3.football.api-sports.io/odds?fixture=${fixture.apiFixtureId}`;
    const response = await fetch(url, {
      headers: { 'x-apisports-key': config.apiKey },
    });

    const data = await response.json();

    // Return raw response for debugging
    const bookmaker = data.response?.[0]?.bookmakers?.find((b: any) =>
      b.name.toLowerCase().includes('bet365')
    ) || data.response?.[0]?.bookmakers?.[0];

    const goalsOU = bookmaker?.bets?.find((b: any) => b.id === 5);

    return NextResponse.json({
      fixture: `${fixture.homeTeamName} vs ${fixture.awayTeamName}`,
      apiFixtureId: fixture.apiFixtureId,
      hasResponse: !!data.response?.length,
      bookmakersCount: data.response?.[0]?.bookmakers?.length || 0,
      bookmakerName: bookmaker?.name || 'none',
      goalsOUValues: goalsOU?.values || [],
      allBetNames: bookmaker?.bets?.map((b: any) => ({ id: b.id, name: b.name })) || [],
      rawFirstBookmaker: data.response?.[0]?.bookmakers?.[0] || null,
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}
