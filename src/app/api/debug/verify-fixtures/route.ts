import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const config = await prisma.aPIConfig.findFirst();
    if (!config) {
      return NextResponse.json({ error: 'API not configured' }, { status: 500 });
    }

    // Get a few upcoming fixtures from DB
    const dbFixtures = await prisma.aPIFixture.findMany({
      where: {
        kickoff: { gte: new Date() }
      },
      include: {
        league: true
      },
      take: 5,
      orderBy: { kickoff: 'asc' }
    });

    const results = [];

    for (const dbFixture of dbFixtures) {
      // Look up this fixture in API
      const url = `https://v3.football.api-sports.io/fixtures?id=${dbFixture.apiFootballId}`;
      const response = await fetch(url, {
        headers: { 'x-apisports-key': config.apiKey || '' },
      });
      const apiData = await response.json();

      results.push({
        database: {
          id: dbFixture.id,
          apiFootballId: dbFixture.apiFootballId,
          match: `${dbFixture.homeTeamName} vs ${dbFixture.awayTeamName}`,
          kickoff: dbFixture.kickoff,
          league: dbFixture.league?.name || 'Unknown'
        },
        apiLookup: {
          found: apiData.response?.length > 0,
          data: apiData.response?.[0] || null
        }
      });
    }

    return NextResponse.json({
      message: 'Fixture verification',
      results
    });
  } catch (error) {
    console.error('Verify error:', error);
    return NextResponse.json({ error: 'Failed to verify' }, { status: 500 });
  }
}
