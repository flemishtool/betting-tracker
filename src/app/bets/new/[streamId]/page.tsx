import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import BetForm from './BetForm';

interface Props {
  params: Promise<{ streamId: string }>;
  searchParams: Promise<{ betSlip?: string }>;
}

export default async function NewBetPage({ params, searchParams }: Props) {
  const { streamId } = await params;
  const { betSlip } = await searchParams;

  const [stream, leagues, marketTypes] = await Promise.all([
    prisma.stream.findUnique({
      where: { id: streamId },
    }),
    prisma.league.findMany({
      orderBy: [{ country: 'asc' }, { name: 'asc' }],
    }),
    prisma.marketType.findMany({
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    }),
  ]);

  if (!stream) {
    notFound();
  }

  const leaguesByCountry: Record<string, typeof leagues> = {};
  leagues.forEach((league) => {
    if (!leaguesByCountry[league.country]) {
      leaguesByCountry[league.country] = [];
    }
    leaguesByCountry[league.country].push(league);
  });

  const marketsByCategory: Record<string, typeof marketTypes> = {};
  marketTypes.forEach((market) => {
    if (!marketsByCategory[market.category]) {
      marketsByCategory[market.category] = [];
    }
    marketsByCategory[market.category].push(market);
  });

  let initialBetSlip: Array<{
    fixtureId: string;
    fixture: string;
    market: string;
    odds: number;
    league: string;
    matchTime?: string;
  }> = [];
  
  if (betSlip) {
    try {
      initialBetSlip = JSON.parse(betSlip);
    } catch (e) {
      console.error('Failed to parse betSlip:', e);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Place Bet</h1>
        <p className="text-muted-foreground">
          Stream: {stream.name} - Day {stream.currentDay + 1}
        </p>
      </div>

      <BetForm
        stream={stream}
        leaguesByCountry={leaguesByCountry}
        marketsByCategory={marketsByCategory}
        initialBetSlip={initialBetSlip}
      />
    </div>
  );
}