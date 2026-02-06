import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const config = await prisma.aPIConfig.findFirst();
    
    const upcomingFixtures = await prisma.aPIFixture.findMany({
      where: { 
        statusShort: 'NS',
        kickoff: { gte: new Date() }
      },
      orderBy: { kickoff: 'asc' },
      take: 3,
    });

    return NextResponse.json({
      hasApiKey: !!config?.apiKey,
      fixtureCount: upcomingFixtures.length,
      fixtures: upcomingFixtures.map(f => ({
        id: f.apiFootballId,
        match: `${f.homeTeamName} vs ${f.awayTeamName}`,
        kickoff: f.kickoff
      }))
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}

