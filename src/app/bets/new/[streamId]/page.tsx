import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import BetForm from './BetForm';

interface Props {
  params: Promise<{ streamId: string }>;
}

export default async function NewBetPage({ params }: Props) {
  const { streamId } = await params;

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

  // Group leagues by country
  const leaguesByCountry: Record<string, typeof leagues> = {};
  leagues.forEach((league) => {
    if (!leaguesByCountry[league.country]) {
      leaguesByCountry[league.country] = [];
    }
    leaguesByCountry[league.country].push(league);
  });

  // Group markets by category
  const marketsByCategory: Record<string, typeof marketTypes> = {};
  marketTypes.forEach((market) => {
    if (!marketsByCategory[market.category]) {
      marketsByCategory[market.category] = [];
    }
    marketsByCategory[market.category].push(market);
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Place Bet</h1>
        <p className="text-muted-foreground">
          Stream: {stream.name} • Day {stream.currentDay + 1}
        </p>
      </div>

      <BetForm
        stream={stream}
        leaguesByCountry={leaguesByCountry}
        marketsByCategory={marketsByCategory}
      />
    </div>
  );
}