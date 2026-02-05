import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const minOdds = parseFloat(searchParams.get('minOdds') || '1.01');
    const maxOdds = parseFloat(searchParams.get('maxOdds') || '1.50');
    const days = parseInt(searchParams.get('days') || '7');

    const now = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    // Get upcoming fixtures with odds
    const fixtures = await prisma.aPIFixture.findMany({
      where: {
        kickoff: {
          gte: now,
          lte: endDate,
        },
        statusShort: 'NS', // Not started
      },
      include: {
        odds: true,
        league: true,
      },
      orderBy: { kickoff: 'asc' },
    });

    const opportunities: any[] = [];

    for (const fixture of fixtures) {
      if (!fixture.odds || fixture.odds.length === 0) continue;

      // Use first bookmaker's odds (or average them if multiple)
      const odds = fixture.odds[0];
      const league = fixture.league;

      const fixtureOpps: any[] = [];

      // Check Over 0.5 Goals
      if (odds.over05Goals && odds.over05Goals >= minOdds && odds.over05Goals <= maxOdds) {
        const impliedProb = 1 / odds.over05Goals;
        const leagueRate = league?.over05GoalsRate || null;
        fixtureOpps.push({
          market: 'Over 0.5 Goals',
          odds: odds.over05Goals,
          impliedProbability: impliedProb,
          leagueRate: leagueRate,
          edge: leagueRate ? leagueRate - impliedProb : null,
          rating: getRating(impliedProb, leagueRate),
        });
      }

      // Check Over 1.5 Goals
      if (odds.over15Goals && odds.over15Goals >= minOdds && odds.over15Goals <= maxOdds) {
        const impliedProb = 1 / odds.over15Goals;
        const leagueRate = league?.over15GoalsRate || null;
        fixtureOpps.push({
          market: 'Over 1.5 Goals',
          odds: odds.over15Goals,
          impliedProbability: impliedProb,
          leagueRate: leagueRate,
          edge: leagueRate ? leagueRate - impliedProb : null,
          rating: getRating(impliedProb, leagueRate),
        });
      }

      // Check Over 2.5 Goals
      if (odds.over25Goals && odds.over25Goals >= minOdds && odds.over25Goals <= maxOdds) {
        const impliedProb = 1 / odds.over25Goals;
        const leagueRate = league?.over25GoalsRate || null;
        fixtureOpps.push({
          market: 'Over 2.5 Goals',
          odds: odds.over25Goals,
          impliedProbability: impliedProb,
          leagueRate: leagueRate,
          edge: leagueRate ? leagueRate - impliedProb : null,
          rating: getRating(impliedProb, leagueRate),
        });
      }

      // Check Over 3.5 Goals
      if (odds.over35Goals && odds.over35Goals >= minOdds && odds.over35Goals <= maxOdds) {
        const impliedProb = 1 / odds.over35Goals;
        const leagueRate = league?.over35GoalsRate || null;
        fixtureOpps.push({
          market: 'Over 3.5 Goals',
          odds: odds.over35Goals,
          impliedProbability: impliedProb,
          leagueRate: leagueRate,
          edge: leagueRate ? leagueRate - impliedProb : null,
          rating: getRating(impliedProb, leagueRate),
        });
      }

      // Check BTTS Yes
      if (odds.bttsYes && odds.bttsYes >= minOdds && odds.bttsYes <= maxOdds) {
        const impliedProb = 1 / odds.bttsYes;
        const leagueRate = league?.bttsYesRate || null;
        fixtureOpps.push({
          market: 'BTTS Yes',
          odds: odds.bttsYes,
          impliedProbability: impliedProb,
          leagueRate: leagueRate,
          edge: leagueRate ? leagueRate - impliedProb : null,
          rating: getRating(impliedProb, leagueRate),
        });
      }

      // Check Home or Draw (Double Chance)
      if (odds.homeOrDraw && odds.homeOrDraw >= minOdds && odds.homeOrDraw <= maxOdds) {
        const impliedProb = 1 / odds.homeOrDraw;
        fixtureOpps.push({
          market: 'Home or Draw',
          odds: odds.homeOrDraw,
          impliedProbability: impliedProb,
          leagueRate: null,
          edge: null,
          rating: 'Low Odds',
        });
      }

      // Check Away or Draw (Double Chance)
      if (odds.awayOrDraw && odds.awayOrDraw >= minOdds && odds.awayOrDraw <= maxOdds) {
        const impliedProb = 1 / odds.awayOrDraw;
        fixtureOpps.push({
          market: 'Away or Draw',
          odds: odds.awayOrDraw,
          impliedProbability: impliedProb,
          leagueRate: null,
          edge: null,
          rating: 'Low Odds',
        });
      }

      if (fixtureOpps.length > 0) {
        opportunities.push({
          fixtureId: fixture.id,
          apiFixtureId: fixture.apiFootballId,
          homeTeam: fixture.homeTeamName,
          awayTeam: fixture.awayTeamName,
          league: league?.name || 'Unknown League',
          country: league?.country || 'Unknown',
          kickoff: fixture.kickoff,
          opportunities: fixtureOpps.sort((a, b) => a.odds - b.odds),
        });
      }
    }

    // Sort by kickoff time
    opportunities.sort((a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime());

    return NextResponse.json({
      success: true,
      count: opportunities.length,
      totalMarkets: opportunities.reduce((sum, o) => sum + o.opportunities.length, 0),
      filters: { minOdds, maxOdds, days },
      opportunities,
    });
  } catch (error: any) {
    console.error('Opportunities API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      opportunities: [] 
    }, { status: 500 });
  }
}

function getRating(impliedProb: number, leagueRate: number | null): string {
  if (!leagueRate) return 'No Data';
  
  const edge = leagueRate - impliedProb;
  
  if (edge > 0.10) return 'Excellent Value';
  if (edge > 0.05) return 'Good Value';
  if (edge > 0) return 'Fair Value';
  if (edge > -0.05) return 'Slight Undervalue';
  return 'Poor Value';
}
