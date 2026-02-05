import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const fixtureOddsCount = await prisma.aPIFixtureOdds.count();
  
  // Sample from APIFixtureOdds with fixture info
  const sampleOdds = await prisma.aPIFixtureOdds.findMany({
    take: 3,
    include: { fixture: { select: { homeTeamName: true, awayTeamName: true } } }
  });
  
  return NextResponse.json({
    fixtureOddsCount,
    sampleOdds: sampleOdds.map(o => ({
      match: `${o.fixture.homeTeamName} vs ${o.fixture.awayTeamName}`,
      bookmaker: o.bookmakerName,
      over05: o.over05Goals,
      over15: o.over15Goals,
      over25: o.over25Goals,
      over35: o.over35Goals,
    })),
  });
}
