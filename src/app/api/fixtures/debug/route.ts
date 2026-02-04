export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const API_BASE_URL = 'https://v3.football.api-sports.io';

export async function GET() {
  try {
    const config = await prisma.aPIConfig.findFirst();
    if (!config?.apiKey) {
      return NextResponse.json({ error: 'No API key' }, { status: 400 });
    }

    // Get a sample league (Premier League = 39)
    const testLeagueId = 39;
    
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + 7);
    
    const fromDate = today.toISOString().split('T')[0];
    const toDate = futureDate.toISOString().split('T')[0];

    // Test with season 2024
    const url2024 = `${API_BASE_URL}/fixtures?league=${testLeagueId}&season=2024&from=${fromDate}&to=${toDate}`;
    const res2024 = await fetch(url2024, {
      headers: { 'x-apisports-key': config.apiKey },
    });
    const data2024 = await res2024.json();

    // Test with season 2025
    const url2025 = `${API_BASE_URL}/fixtures?league=${testLeagueId}&season=2025&from=${fromDate}&to=${toDate}`;
    const res2025 = await fetch(url2025, {
      headers: { 'x-apisports-key': config.apiKey },
    });
    const data2025 = await res2025.json();

    // Test without date filter (next fixtures)
    const urlNext = `${API_BASE_URL}/fixtures?league=${testLeagueId}&season=2024&next=10`;
    const resNext = await fetch(urlNext, {
      headers: { 'x-apisports-key': config.apiKey },
    });
    const dataNext = await resNext.json();

    // Get current leagues in DB
    const leagues = await prisma.league.findMany({
      where: { apiFootballId: { not: null } },
      select: { name: true, apiFootballId: true },
      take: 10,
    });

    return NextResponse.json({
      dates: { from: fromDate, to: toDate },
      season2024: {
        url: url2024,
        count: data2024.response?.length || 0,
        errors: data2024.errors,
        sample: data2024.response?.slice(0, 2),
      },
      season2025: {
        url: url2025,
        count: data2025.response?.length || 0,
        errors: data2025.errors,
        sample: data2025.response?.slice(0, 2),
      },
      nextFixtures: {
        count: dataNext.response?.length || 0,
        sample: dataNext.response?.slice(0, 3).map((f: any) => ({
          date: f.fixture.date,
          home: f.teams.home.name,
          away: f.teams.away.name,
        })),
      },
      yourLeagues: leagues,
    });
  } catch (error) {
    return NextResponse.json({ 
      error: String(error) 
    }, { status: 500 });
  }
}
