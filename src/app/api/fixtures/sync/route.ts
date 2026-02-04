export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const API_BASE_URL = 'https://v3.football.api-sports.io';

interface FixtureResponse {
  fixture: {
    id: number;
    date: string;
    venue?: { name: string };
    status: { short: string };
  };
  league: {
    id: number;
    name: string;
    country: string;
    season: number;
  };
  teams: {
    home: { id: number; name: string };
    away: { id: number; name: string };
  };
  goals: {
    home: number | null;
    away: number | null;
  };
}

interface OddsResponse {
  fixture: { id: number };
  bookmakers: Array<{
    name: string;
    bets: Array<{
      name: string;
      values: Array<{ value: string; odd: string }>;
    }>;
  }>;
}

async function fetchWithRetry(url: string, apiKey: string, retries = 2): Promise<any> {
  for (let i = 0; i <= retries; i++) {
    try {
      const response = await fetch(url, {
        headers: { 'x-apisports-key': apiKey },
      });
      
      if (response.status === 429) {
        console.log('Rate limited, waiting...');
        await new Promise(r => setTimeout(r, 2000));
        continue;
      }
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      if (i === retries) throw error;
      await new Promise(r => setTimeout(r, 1000));
    }
  }
}

async function fetchFixturesForLeague(apiKey: string, leagueId: number, days: number = 7) {
  const today = new Date();
  const futureDate = new Date();
  futureDate.setDate(today.getDate() + days);
  
  const fromDate = today.toISOString().split('T')[0];
  const toDate = futureDate.toISOString().split('T')[0];
  
  // Try season 2025 first, then 2024
  for (const season of [2025, 2024]) {
    const url = `${API_BASE_URL}/fixtures?league=${leagueId}&season=${season}&from=${fromDate}&to=${toDate}`;
    
    const data = await fetchWithRetry(url, apiKey);
    if (data?.response?.length > 0) {
      console.log(`League ${leagueId}: Found ${data.response.length} fixtures in season ${season}`);
      return data.response;
    }
  }
  
  return [];
}

async function fetchOddsForFixture(apiKey: string, fixtureId: number) {
  const url = `${API_BASE_URL}/odds?fixture=${fixtureId}`;
  
  try {
    const data = await fetchWithRetry(url, apiKey);
    return data?.response?.[0] || null;
  } catch (error) {
    console.error(`Failed to fetch odds for fixture ${fixtureId}:`, error);
    return null;
  }
}

function parseOdds(oddsData: OddsResponse | null): Record<string, number | null> | null {
  if (!oddsData || !oddsData.bookmakers?.length) return null;
  
  // Prefer bet365, then first available
  const bookmaker = oddsData.bookmakers.find(b => 
    b.name.toLowerCase().includes('bet365')
  ) || oddsData.bookmakers[0];
  
  const odds: Record<string, number | null> = {
    bookmakerName: null as any,
    homeWin: null,
    draw: null,
    awayWin: null,
    over05Goals: null,
    under05Goals: null,
    over15Goals: null,
    under15Goals: null,
    over25Goals: null,
    under25Goals: null,
    over35Goals: null,
    under35Goals: null,
    bttsYes: null,
    bttsNo: null,
    homeOrDraw: null,
    awayOrDraw: null,
    homeOrAway: null,
  };
  
  odds.bookmakerName = bookmaker.name as any;
  
  for (const bet of bookmaker.bets) {
    const betName = bet.name.toLowerCase();
    
    // Match Winner (1X2)
    if (betName.includes('match winner') || betName === 'home/away') {
      for (const v of bet.values) {
        if (v.value === 'Home') odds.homeWin = parseFloat(v.odd);
        if (v.value === 'Draw') odds.draw = parseFloat(v.odd);
        if (v.value === 'Away') odds.awayWin = parseFloat(v.odd);
      }
    }
    
    // Goals Over/Under
    if (betName.includes('goals over/under') || betName.includes('over/under')) {
      for (const v of bet.values) {
        const val = v.value.toLowerCase();
        if (val === 'over 0.5') odds.over05Goals = parseFloat(v.odd);
        if (val === 'under 0.5') odds.under05Goals = parseFloat(v.odd);
        if (val === 'over 1.5') odds.over15Goals = parseFloat(v.odd);
        if (val === 'under 1.5') odds.under15Goals = parseFloat(v.odd);
        if (val === 'over 2.5') odds.over25Goals = parseFloat(v.odd);
        if (val === 'under 2.5') odds.under25Goals = parseFloat(v.odd);
        if (val === 'over 3.5') odds.over35Goals = parseFloat(v.odd);
        if (val === 'under 3.5') odds.under35Goals = parseFloat(v.odd);
      }
    }
    
    // BTTS
    if (betName.includes('both teams score') || betName === 'btts') {
      for (const v of bet.values) {
        if (v.value === 'Yes') odds.bttsYes = parseFloat(v.odd);
        if (v.value === 'No') odds.bttsNo = parseFloat(v.odd);
      }
    }
    
    // Double Chance
    if (betName.includes('double chance')) {
      for (const v of bet.values) {
        if (v.value === 'Home/Draw' || v.value === '1X') odds.homeOrDraw = parseFloat(v.odd);
        if (v.value === 'Away/Draw' || v.value === 'X2') odds.awayOrDraw = parseFloat(v.odd);
        if (v.value === 'Home/Away' || v.value === '12') odds.homeOrAway = parseFloat(v.odd);
      }
    }
  }
  
  return odds;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const days = body.days || 7;
    const fetchOdds = body.fetchOdds !== false;
    const maxFixtures = body.maxFixtures || 50;
    
    // Get API config
    const config = await prisma.aPIConfig.findFirst();
    if (!config?.apiKey) {
      return NextResponse.json(
        { error: 'API key not configured. Add it in Settings.' },
        { status: 400 }
      );
    }
    
    // Get leagues with API IDs
    const leagues = await prisma.league.findMany({
      where: { apiFootballId: { not: null } },
      select: { id: true, apiFootballId: true, name: true, country: true },
    });
    
    if (leagues.length === 0) {
      return NextResponse.json(
        { error: 'No leagues with API Football IDs configured.' },
        { status: 400 }
      );
    }
    
    console.log(`Syncing fixtures for ${leagues.length} leagues, ${days} days ahead...`);
    
    let fixturesCreated = 0;
    let fixturesUpdated = 0;
    let oddsCreated = 0;
    let apiCalls = 0;
    const errors: string[] = [];
    const leaguesWithFixtures: string[] = [];
    
    for (const league of leagues) {
      if (fixturesCreated + fixturesUpdated >= maxFixtures) break;
      
      try {
        // Rate limiting
        await new Promise(r => setTimeout(r, 300));
        apiCalls++;
        
        const fixtures = await fetchFixturesForLeague(
          config.apiKey,
          league.apiFootballId!,
          days
        );
        
        if (fixtures.length > 0) {
          leaguesWithFixtures.push(`${league.name}: ${fixtures.length}`);
        }
        
        for (const f of fixtures as FixtureResponse[]) {
          if (fixturesCreated + fixturesUpdated >= maxFixtures) break;
          
          // Check if fixture exists
          const existingFixture = await prisma.aPIFixture.findUnique({
            where: { apiFootballId: f.fixture.id },
          });
          
          const fixtureData = {
            apiFootballId: f.fixture.id,
            leagueId: league.id, // Link to our League model
            apiLeagueId: f.league.id, // Store the API league ID
            season: f.league.season,
            homeTeamId: f.teams.home.id,
            homeTeamName: f.teams.home.name,
            awayTeamId: f.teams.away.id,
            awayTeamName: f.teams.away.name,
            kickoff: new Date(f.fixture.date),
            venue: f.fixture.venue?.name || null,
            status: f.fixture.status.short === 'NS' ? 'scheduled' : 'in_progress',
            statusShort: f.fixture.status.short,
            homeGoals: f.goals.home,
            awayGoals: f.goals.away,
            lastSyncedAt: new Date(),
          };
          
          let fixture;
          if (existingFixture) {
            fixture = await prisma.aPIFixture.update({
              where: { id: existingFixture.id },
              data: fixtureData,
            });
            fixturesUpdated++;
          } else {
            fixture = await prisma.aPIFixture.create({
              data: fixtureData,
            });
            fixturesCreated++;
          }
          
          // Fetch odds if requested and fixture is scheduled
          if (fetchOdds && fixture.statusShort === 'NS') {
            await new Promise(r => setTimeout(r, 300));
            apiCalls++;
            
            const oddsData = await fetchOddsForFixture(config.apiKey, f.fixture.id);
            const parsedOdds = parseOdds(oddsData);
            
            if (parsedOdds && parsedOdds.bookmakerName) {
              const bookmakerName = parsedOdds.bookmakerName as string;
              delete parsedOdds.bookmakerName;
              
              // Upsert odds
              await prisma.aPIFixtureOdds.upsert({
                where: {
                  fixtureId_bookmakerName: {
                    fixtureId: fixture.id,
                    bookmakerName: bookmakerName,
                  },
                },
                create: {
                  fixtureId: fixture.id,
                  bookmakerName: bookmakerName,
                  ...parsedOdds,
                  fetchedAt: new Date(),
                },
                update: {
                  ...parsedOdds,
                  fetchedAt: new Date(),
                },
              });
              oddsCreated++;
            }
          }
        }
      } catch (error) {
        const msg = `${league.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        errors.push(msg);
        console.error(msg);
      }
    }
    
    // Update API usage counter
    await prisma.aPIConfig.update({
      where: { id: config.id },
      data: {
        requestsToday: config.requestsToday + apiCalls,
        lastRequestAt: new Date(),
      },
    });
    
    return NextResponse.json({
      success: true,
      message: `Synced ${fixturesCreated + fixturesUpdated} fixtures`,
      stats: {
        fixturesCreated,
        fixturesUpdated,
        oddsCreated,
        apiCalls,
        leaguesProcessed: leagues.length,
        leaguesWithFixtures: leaguesWithFixtures.length,
      },
      leaguesWithFixtures,
      errors: errors.length > 0 ? errors : undefined,
    });
    
  } catch (error) {
    console.error('Fixture sync error:', error);
    return NextResponse.json(
      { error: 'Sync failed: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const [fixtureCount, oddsCount, upcomingCount] = await Promise.all([
      prisma.aPIFixture.count(),
      prisma.aPIFixtureOdds.count(),
      prisma.aPIFixture.count({
        where: {
          kickoff: { gte: new Date() },
          statusShort: 'NS',
        },
      }),
    ]);
    
    const recentFixtures = await prisma.aPIFixture.findMany({
      where: { kickoff: { gte: new Date() } },
      include: {
        league: { select: { name: true, country: true } },
        odds: { take: 1, orderBy: { fetchedAt: 'desc' } },
      },
      orderBy: { kickoff: 'asc' },
      take: 10,
    });
    
    return NextResponse.json({
      stats: {
        totalFixtures: fixtureCount,
        upcomingFixtures: upcomingCount,
        totalOdds: oddsCount,
      },
      upcoming: recentFixtures.map(f => ({
        id: f.id,
        match: `${f.homeTeamName} vs ${f.awayTeamName}`,
        league: f.league?.name,
        kickoff: f.kickoff,
        hasOdds: f.odds.length > 0,
        over15Odds: f.odds[0]?.over15Goals,
        over25Odds: f.odds[0]?.over25Goals,
        bttsOdds: f.odds[0]?.bttsYes,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get fixture stats: ' + (error instanceof Error ? error.message : 'Unknown') },
      { status: 500 }
    );
  }
}
