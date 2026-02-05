export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const fixtureId = request.nextUrl.searchParams.get('fixture') || '1469646';
  
  const config = await prisma.aPIConfig.findFirst();
  if (!config?.apiKey) {
    return NextResponse.json({ error: 'No API key' }, { status: 400 });
  }

  const url = `https://v3.football.api-sports.io/odds?fixture=${fixtureId}`;
  
  const response = await fetch(url, {
    headers: { 'x-apisports-key': config.apiKey },
  });
  
  const data = await response.json();
  
  const bookmaker = data.response?.[0]?.bookmakers?.find((b: any) => 
    b.name.toLowerCase().includes('bet365')
  ) || data.response?.[0]?.bookmakers?.[0];

  // Filter only the bets we care about
  const relevantBetNames = [
    'match winner',
    'goals over/under',
    'both teams score',
    'double chance',
    'over/under',
  ];

  const filteredBets = bookmaker?.bets?.filter((b: any) => 
    relevantBetNames.some(name => b.name.toLowerCase().includes(name))
  );

  return NextResponse.json({
    fixtureId,
    bookmaker: bookmaker?.name,
    bets: filteredBets?.map((b: any) => ({
      id: b.id,
      name: b.name,
      values: b.values,
    })),
  });
}
