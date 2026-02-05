import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const config = await prisma.aPIConfig.findFirst();
  if (!config?.apiKey) {
    return NextResponse.json({ error: 'No API key' }, { status: 400 });
  }

  // Get a fixture that HAS odds in our DB
  const oddsRecord = await prisma.aPIFixtureOdds.findFirst({
    include: { fixture: true }
  });

  if (!oddsRecord) {
    return NextResponse.json({ error: 'No odds in DB' });
  }

  // Now fetch from API for this exact fixture
  const url = `https://v3.football.api-sports.io/odds?fixture=${oddsRecord.apiFixtureId}`;
  const response = await fetch(url, {
    headers: { 'x-apisports-key': config.apiKey },
  });
  const data = await response.json();

  const bookmaker = data.response?.[0]?.bookmakers?.find((b: any) =>
    b.name.toLowerCase().includes('bet365')
  ) || data.response?.[0]?.bookmakers?.[0];

  const goalsOU = bookmaker?.bets?.find((b: any) => 
    b.name.toLowerCase().includes('over/under') || b.name.toLowerCase().includes('goals')
  );

  return NextResponse.json({
    fixture: `${oddsRecord.fixture.homeTeamName} vs ${oddsRecord.fixture.awayTeamName}`,
    fixtureId: oddsRecord.apiFixtureId,
    storedInDB: {
      over05: oddsRecord.over05Goals,
      over15: oddsRecord.over15Goals,
      over25: oddsRecord.over25Goals,
    },
    fromAPI: {
      hasResponse: !!data.response?.length,
      bookmakersCount: data.response?.[0]?.bookmakers?.length || 0,
      bookmakerName: bookmaker?.name,
      goalsOUName: goalsOU?.name,
      goalsOUValues: goalsOU?.values?.slice(0, 10),
    }
  });
}
