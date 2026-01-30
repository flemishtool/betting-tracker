import prisma from './prisma';

const API_BASE_URL = 'https://v3.football.api-sports.io';

interface APIResponse<T> {
  response: T;
  errors: any;
  results: number;
}

interface LeagueStats {
  league: {
    id: number;
    name: string;
    country: string;
    season: number;
  };
  fixtures: {
    played: { total: number };
  };
  goals: {
    for: { total: { total: number } };
    against: { total: { total: number } };
  };
}

async function getApiKey(): Promise<string | null> {
  const config = await prisma.aPIConfig.findFirst();
  return config?.apiKey || null;
}

async function incrementRequestCount() {
  const config = await prisma.aPIConfig.findFirst();
  if (config) {
    const now = new Date();
    const lastReset = new Date(config.lastResetAt);
    
    // Reset daily counter if it's a new day
    const isNewDay = now.toDateString() !== lastReset.toDateString();
    
    await prisma.aPIConfig.update({
      where: { id: config.id },
      data: {
        requestsToday: isNewDay ? 1 : config.requestsToday + 1,
        lastRequestAt: now,
        lastResetAt: isNewDay ? now : config.lastResetAt,
      },
    });
  }
}

export async function fetchFromAPI<T>(endpoint: string): Promise<T | null> {
  const apiKey = await getApiKey();
  
  if (!apiKey) {
    console.error('No API key configured');
    return null;
  }
  
  try {
    await incrementRequestCount();
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'x-apisports-key': apiKey,
      },
    });
    
    if (!response.ok) {
      console.error(`API error: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API fetch error:', error);
    return null;
  }
}

export async function fetchLeagueStatistics(leagueApiId: number, season: number = 2024): Promise<any> {
  const endpoint = `/leagues?id=${leagueApiId}&season=${season}`;
  return fetchFromAPI(endpoint);
}

export async function fetchLeagueFixturesStats(leagueApiId: number, season: number = 2024): Promise<any> {
  // Get fixtures to calculate goal stats
  const endpoint = `/fixtures?league=${leagueApiId}&season=${season}&status=FT`;
  return fetchFromAPI(endpoint);
}

export async function syncLeagueStats(leagueId: string): Promise<boolean> {
  try {
    const league = await prisma.league.findUnique({ where: { id: leagueId } });
    
    if (!league || !league.apiFootballId) {
      console.log('League not found or no API ID');
      return false;
    }
    
    const season = 2024;
    const data = await fetchLeagueFixturesStats(league.apiFootballId, season);
    
    if (!data || !data.response || data.response.length === 0) {
      console.log('No data from API');
      return false;
    }
    
    const fixtures = data.response;
    const totalMatches = fixtures.length;
    
    if (totalMatches === 0) {
      return false;
    }
    
    // Calculate stats from fixtures
    let totalGoals = 0;
    let over05 = 0;
    let over15 = 0;
    let over25 = 0;
    let bttsYes = 0;
    
    for (const fixture of fixtures) {
      const homeGoals = fixture.goals?.home ?? 0;
      const awayGoals = fixture.goals?.away ?? 0;
      const total = homeGoals + awayGoals;
      
      totalGoals += total;
      if (total > 0) over05++;
      if (total > 1) over15++;
      if (total > 2) over25++;
      if (homeGoals > 0 && awayGoals > 0) bttsYes++;
    }
    
    const avgGoals = totalGoals / totalMatches;
    const over05Rate = over05 / totalMatches;
    const over15Rate = over15 / totalMatches;
    const over25Rate = over25 / totalMatches;
    const bttsRate = bttsYes / totalMatches;
    
    // Update league in database
    await prisma.league.update({
      where: { id: leagueId },
      data: {
        avgGoalsPerMatch: Math.round(avgGoals * 100) / 100,
        over05GoalsRate: Math.round(over05Rate * 100) / 100,
        over15GoalsRate: Math.round(over15Rate * 100) / 100,
        over25GoalsRate: Math.round(over25Rate * 100) / 100,
        bttsYesRate: Math.round(bttsRate * 100) / 100,
        updatedAt: new Date(),
      },
    });
    
    console.log(`Updated ${league.name}: Avg ${avgGoals.toFixed(2)} goals, O2.5 ${(over25Rate * 100).toFixed(1)}%`);
    return true;
  } catch (error) {
    console.error('Failed to sync league stats:', error);
    return false;
  }
}

export async function syncAllLeagues(): Promise<{ success: number; failed: number }> {
  const leagues = await prisma.league.findMany({
    where: {
      apiFootballId: { not: null },
      isActive: true,
    },
  });
  
  let success = 0;
  let failed = 0;
  
  for (const league of leagues) {
    // Add delay to respect rate limits (450 requests/minute)
    await new Promise(resolve => setTimeout(resolve, 150));
    
    const result = await syncLeagueStats(league.id);
    if (result) {
      success++;
    } else {
      failed++;
    }
  }
  
  return { success, failed };
}