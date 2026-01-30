import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const API_BASE_URL = 'https://v3.football.api-sports.io';

async function fetchFixtures(apiKey: string, leagueId: number, season: number) {
  try {
    const url = `${API_BASE_URL}/fixtures?league=${leagueId}&season=${season}&status=FT`;
    
    const response = await fetch(url, {
      headers: {
        'x-apisports-key': apiKey,
      },
    });
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    
    if (data.errors && Object.keys(data.errors).length > 0) {
      return null;
    }
    
    return data;
  } catch (error) {
    console.error(`Failed to fetch fixtures for league ${leagueId}:`, error);
    return null;
  }
}

async function syncLeague(apiKey: string, league: any): Promise<{ success: boolean; message: string }> {
  if (!league.apiFootballId) {
    return { success: false, message: 'No API ID' };
  }

  // Try current season first (2024), then previous season (2023)
  const seasons = [2024, 2023];
  let fixtures: any[] = [];
  let usedSeason = 0;
  
  for (const season of seasons) {
    const data = await fetchFixtures(apiKey, league.apiFootballId, season);
    
    if (data && data.response && data.response.length >= 10) {
      fixtures = data.response;
      usedSeason = season;
      break;
    }
    
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  if (fixtures.length < 10) {
    return { success: false, message: `Not enough matches (${fixtures.length})` };
  }
  
  const totalMatches = fixtures.length;
  
  // Calculate statistics
  let totalGoals = 0;
  let over05 = 0;
  let over15 = 0;
  let over25 = 0;
  let over35 = 0;
  let bttsYes = 0;
  
  for (const fixture of fixtures) {
    const homeGoals = fixture.goals?.home ?? 0;
    const awayGoals = fixture.goals?.away ?? 0;
    const total = homeGoals + awayGoals;
    
    totalGoals += total;
    if (total > 0) over05++;
    if (total > 1) over15++;
    if (total > 2) over25++;
    if (total > 3) over35++;
    if (homeGoals > 0 && awayGoals > 0) bttsYes++;
  }
  
  // Calculate rates (round to 3 decimal places)
  const avgGoals = Math.round((totalGoals / totalMatches) * 100) / 100;
  const over05Rate = Math.round((over05 / totalMatches) * 1000) / 1000;
  const over15Rate = Math.round((over15 / totalMatches) * 1000) / 1000;
  const over25Rate = Math.round((over25 / totalMatches) * 1000) / 1000;
  const over35Rate = Math.round((over35 / totalMatches) * 1000) / 1000;
  const bttsRate = Math.round((bttsYes / totalMatches) * 1000) / 1000;
  
  // Update database
  try {
    await prisma.league.update({
      where: { id: league.id },
      data: {
        avgGoalsPerMatch: avgGoals,
        over05GoalsRate: over05Rate,
        over15GoalsRate: over15Rate,
        over25GoalsRate: over25Rate,
        over35GoalsRate: over35Rate,
        bttsYesRate: bttsRate,
        updatedAt: new Date(),
      },
    });
    
    return { 
      success: true, 
      message: `${totalMatches} matches, ${avgGoals} avg, ${Math.round(over25Rate * 100)}% O2.5` 
    };
  } catch (dbError) {
    console.error(`DB error for ${league.name}:`, dbError);
    return { success: false, message: `DB Error: ${dbError}` };
  }
}

export async function POST(request: NextRequest) {
  try {
    const config = await prisma.aPIConfig.findFirst();
    
    if (!config?.apiKey) {
      return NextResponse.json(
        { error: 'API key not configured. Please add your API key in Settings.' },
        { status: 400 }
      );
    }
    
    // Get all leagues with API IDs
    const leagues = await prisma.league.findMany({
      where: {
        apiFootballId: { not: null },
      },
      orderBy: { name: 'asc' },
    });
    
    if (leagues.length === 0) {
      return NextResponse.json({ error: 'No leagues to sync' }, { status: 400 });
    }
    
    console.log(`Starting sync for ${leagues.length} leagues...`);
    
    let success = 0;
    let failed = 0;
    const results: { name: string; status: string }[] = [];
    
    for (const league of leagues) {
      // Rate limiting - 250ms between requests
      await new Promise(resolve => setTimeout(resolve, 250));
      
      try {
        const result = await syncLeague(config.apiKey, league);
        
        if (result.success) {
          success++;
          results.push({ name: league.name, status: `✓ ${result.message}` });
          console.log(`✓ ${league.name}: ${result.message}`);
        } else {
          failed++;
          results.push({ name: league.name, status: `✗ ${result.message}` });
          console.log(`✗ ${league.name}: ${result.message}`);
        }
      } catch (error) {
        failed++;
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        results.push({ name: league.name, status: `✗ ${errorMsg}` });
        console.error(`✗ ${league.name}:`, error);
      }
    }
    
    // Update request counter
    await prisma.aPIConfig.update({
      where: { id: config.id },
      data: {
        requestsToday: config.requestsToday + (leagues.length * 2),
        lastRequestAt: new Date(),
      },
    });
    
    console.log(`Sync complete: ${success} success, ${failed} failed`);
    
    return NextResponse.json({
      message: `Synced ${success} leagues`,
      success,
      failed,
      total: leagues.length,
      results,
    });
  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json(
      { error: 'Sync failed: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}