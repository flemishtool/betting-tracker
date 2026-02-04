export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const minOdds = parseFloat(searchParams.get('minOdds') || '1.05');
    const maxOdds = parseFloat(searchParams.get('maxOdds') || '1.35');
    const days = parseInt(searchParams.get('days') || '3');

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    // Get upcoming fixtures with odds in range
    const fixtures = await prisma.aPIFixture.findMany({
      where: {
        kickoff: {
          gte: new Date(),
          lte: futureDate,
        },
        status: 'scheduled',
        odds: {
          some: {},
        },
      },
      include: {
        league: {
          select: {
            name: true,
            country: true,
            over15GoalsRate: true,
            over25GoalsRate: true,
            bttsYesRate: true,
          },
        },
        odds: {
          take: 1,
          orderBy: { fetchedAt: 'desc' },
        },
      },
      orderBy: { kickoff: 'asc' },
      take: 100,
    });

    // Filter and format opportunities
    type Opportunity = {
      fixtureId: string;
      apiFixtureId: number;
      homeTeam: string;
      awayTeam: string;
      kickoff: Date;
      league: string;
      country: string;
      market: string;
      selection: string;
      odds: number;
      probability: number;
      leagueRate: number | null;
    };

    const opportunities: Opportunity[] = [];

    for (const fixture of fixtures) {
      const odds = fixture.odds[0];
      if (!odds) continue;

      const markets = [
        { name: 'Over 0.5 Goals', odds: odds.over05Goals, rate: 95 },
        { name: 'Over 1.5 Goals', odds: odds.over15Goals, rate: fixture.league?.over15GoalsRate || null },
        { name: 'Over 2.5 Goals', odds: odds.over25Goals, rate: fixture.league?.over25GoalsRate || null },
        { name: 'BTTS Yes', odds: odds.bttsYes, rate: fixture.league?.bttsYesRate || null },
        { name: 'Home or Draw', odds: odds.homeOrDraw, rate: null },
        { name: 'Away or Draw', odds: odds.awayOrDraw, rate: null },
      ];

      for (const market of markets) {
        if (market.odds && market.odds >= minOdds && market.odds <= maxOdds) {
          opportunities.push({
            fixtureId: fixture.id,
            apiFixtureId: fixture.apiFootballId,
            homeTeam: fixture.homeTeamName,
            awayTeam: fixture.awayTeamName,
            kickoff: fixture.kickoff,
            league: fixture.league?.name || 'Unknown',
            country: fixture.league?.country || 'Unknown',
            market: market.name,
            selection: market.name,
            odds: market.odds,
            probability: Math.round((1 / market.odds) * 100),
            leagueRate: market.rate,
          });
        }
      }
    }

    // Sort by odds (safest first)
    opportunities.sort((a, b) => a.odds - b.odds);

    return NextResponse.json({
      opportunities,
      filters: { minOdds, maxOdds, days },
      total: opportunities.length,
    });
  } catch (error) {
    console.error('Opportunities API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch opportunities', details: String(error) },
      { status: 500 }
    );
  }
}
