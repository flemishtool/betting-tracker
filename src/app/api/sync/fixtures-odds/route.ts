import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const API_FOOTBALL_KEY = process.env.API_FOOTBALL_KEY;
const API_BASE = 'https://v3.football.api-sports.io';

async function fetchFromAPI(endpoint: string) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'x-apisports-key': API_FOOTBALL_KEY || '',
    },
  });
  return response.json();
}

// Get current football season (seasons run Aug-May, so Jan-Jul = previous year)
function getCurrentSeason(): number {
  const now = new Date();
  const month = now.getMonth(); // 0-11
  const year = now.getFullYear();
  // If Jan-Jul (0-6), we're in the second half of previous year's season
  return month < 7 ? year - 1 : year;
}

export async function POST(request: NextRequest) {
  try {
    const { leagueIds, days = 3 } = await request.json();

    // Get leagues to sync (either specific ones or all active)
    const leagues = await prisma.league.findMany({
      where: leagueIds ? { id: { in: leagueIds } } : { isActive: true },
      select: { id: true, name: true, apiFootballId: true }
    });

    const results = {
      leagues: leagues.length,
      fixturesCreated: 0,
      oddsCreated: 0,
      errors: [] as string[],
    };

    // Date range
    const today = new Date().toISOString().split('T')[0];
    const end = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const season = getCurrentSeason();

    for (const league of leagues) {
      if (!league.apiFootballId) continue;

      try {
        // Fetch fixtures for this league
        const fixturesData = await fetchFromAPI(
          `/fixtures?league=${league.apiFootballId}&season=${season}&from=${today}&to=${end}`
        );

        if (!fixturesData.response || fixturesData.response.length === 0) {
          continue;
        }

        for (const fixture of fixturesData.response) {
          // Upsert fixture with all required fields
          const dbFixture = await prisma.aPIFixture.upsert({
            where: { apiFootballId: fixture.fixture.id },
            update: {
              homeTeamName: fixture.teams.home.name,
              awayTeamName: fixture.teams.away.name,
              kickoff: new Date(fixture.fixture.date),
              status: fixture.fixture.status.long || 'scheduled',
              statusShort: fixture.fixture.status.short || 'NS',
              venue: fixture.fixture.venue?.name || null,
              homeGoals: fixture.goals.home,
              awayGoals: fixture.goals.away,
              leagueId: league.id,
            },
            create: {
              apiFootballId: fixture.fixture.id,
              apiLeagueId: league.apiFootballId,
              season: season,
              homeTeamId: fixture.teams.home.id,
              homeTeamName: fixture.teams.home.name,
              awayTeamId: fixture.teams.away.id,
              awayTeamName: fixture.teams.away.name,
              kickoff: new Date(fixture.fixture.date),
              status: fixture.fixture.status.long || 'scheduled',
              statusShort: fixture.fixture.status.short || 'NS',
              venue: fixture.fixture.venue?.name || null,
              homeGoals: fixture.goals.home,
              awayGoals: fixture.goals.away,
              leagueId: league.id,
            },
          });
          results.fixturesCreated++;

          // Fetch odds for this fixture
          const oddsData = await fetchFromAPI(`/odds?fixture=${fixture.fixture.id}`);
          
          if (oddsData.response && oddsData.response.length > 0) {
            const bookmakers = oddsData.response[0]?.bookmakers || [];
            
            for (const bookmaker of bookmakers.slice(0, 3)) { // Limit to 3 bookmakers
              const oddsObj: Record<string, number | null> = {};
              
              for (const bet of bookmaker.bets) {
                // Match Winner (1X2)
                if (bet.id === 1) {
                  for (const val of bet.values) {
                    if (val.value === 'Home') oddsObj.homeWin = parseFloat(val.odd);
                    if (val.value === 'Draw') oddsObj.draw = parseFloat(val.odd);
                    if (val.value === 'Away') oddsObj.awayWin = parseFloat(val.odd);
                  }
                }
                // Over/Under Goals
                if (bet.id === 5) {
                  for (const val of bet.values) {
                    if (val.value === 'Over 0.5') oddsObj.over05Goals = parseFloat(val.odd);
                    if (val.value === 'Under 0.5') oddsObj.under05Goals = parseFloat(val.odd);
                    if (val.value === 'Over 1.5') oddsObj.over15Goals = parseFloat(val.odd);
                    if (val.value === 'Under 1.5') oddsObj.under15Goals = parseFloat(val.odd);
                    if (val.value === 'Over 2.5') oddsObj.over25Goals = parseFloat(val.odd);
                    if (val.value === 'Under 2.5') oddsObj.under25Goals = parseFloat(val.odd);
                    if (val.value === 'Over 3.5') oddsObj.over35Goals = parseFloat(val.odd);
                    if (val.value === 'Under 3.5') oddsObj.under35Goals = parseFloat(val.odd);
                  }
                }
                // Both Teams Score
                if (bet.id === 8) {
                  for (const val of bet.values) {
                    if (val.value === 'Yes') oddsObj.bttsYes = parseFloat(val.odd);
                    if (val.value === 'No') oddsObj.bttsNo = parseFloat(val.odd);
                  }
                }
                // Double Chance
                if (bet.id === 12) {
                  for (const val of bet.values) {
                    if (val.value === 'Home/Draw') oddsObj.homeOrDraw = parseFloat(val.odd);
                    if (val.value === 'Away/Draw') oddsObj.awayOrDraw = parseFloat(val.odd);
                    if (val.value === 'Home/Away') oddsObj.homeOrAway = parseFloat(val.odd);
                  }
                }
              }

              // Only save if we have some odds
              if (Object.keys(oddsObj).length > 0) {
                await prisma.aPIFixtureOdds.upsert({
                  where: { 
                    fixtureId_bookmakerName: {
                      fixtureId: dbFixture.id,
                      bookmakerName: bookmaker.name
                    }
                  },
                  update: { ...oddsObj },
                  create: {
                    fixtureId: dbFixture.id,
                    bookmakerName: bookmaker.name,
                    ...oddsObj,
                  },
                });
                results.oddsCreated++;
              }
            }
          }
        }
      } catch (error) {
        results.errors.push(`${league.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Use POST to sync fixtures and odds',
    params: {
      leagueIds: 'optional array of league IDs to sync',
      days: 'number of days ahead to fetch (default: 3)'
    }
  });
}

