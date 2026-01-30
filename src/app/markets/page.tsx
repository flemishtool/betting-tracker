import prisma from '@/lib/prisma';
import { formatPercentage } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function MarketsPage() {
  const markets = await prisma.marketType.findMany({
    orderBy: [{ category: 'asc' }, { name: 'asc' }],
  });

  // Group by category
  const marketsByCategory: Record<string, typeof markets> = {};
  markets.forEach(market => {
    if (!marketsByCategory[market.category]) {
      marketsByCategory[market.category] = [];
    }
    marketsByCategory[market.category].push(market);
  });

  const categories = Object.keys(marketsByCategory).sort();

  // Calculate stats
  const marketsWithData = markets.filter(m => m.totalSelections > 0);
  const avgHitRate = marketsWithData.length > 0
    ? marketsWithData.reduce((sum, m) => sum + m.actualHitRate, 0) / marketsWithData.length
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Markets</h1>
        <p className="text-muted-foreground">
          {markets.length} market types across {categories.length} categories
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border bg-card p-4 text-center">
          <p className="text-3xl font-bold">{markets.length}</p>
          <p className="text-sm text-muted-foreground">Total Markets</p>
        </div>
        <div className="rounded-xl border bg-card p-4 text-center">
          <p className="text-3xl font-bold">{categories.length}</p>
          <p className="text-sm text-muted-foreground">Categories</p>
        </div>
        <div className="rounded-xl border bg-card p-4 text-center">
          <p className="text-3xl font-bold">{marketsWithData.length}</p>
          <p className="text-sm text-muted-foreground">Markets Used</p>
        </div>
        <div className="rounded-xl border bg-card p-4 text-center">
          <p className="text-3xl font-bold">{formatPercentage(avgHitRate)}</p>
          <p className="text-sm text-muted-foreground">Your Avg Hit Rate</p>
        </div>
      </div>

      {/* Quick Jump Navigation */}
      <div className="rounded-xl border bg-card p-4">
        <h2 className="mb-3 font-semibold">Quick Jump</h2>
        <div className="flex flex-wrap gap-2">
          {categories.map(category => (
            <a
              key={category}
              href={`#${category.replace(/\s+/g, '-').toLowerCase()}`}
              className="rounded-lg bg-muted px-3 py-1 text-sm hover:bg-accent"
            >
              {category} ({marketsByCategory[category].length})
            </a>
          ))}
        </div>
      </div>

      {/* Markets by Category */}
      {categories.map(category => (
        <div 
          key={category} 
          id={category.replace(/\s+/g, '-').toLowerCase()}
          className="scroll-mt-4"
        >
          <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
            <CategoryIcon category={category} />
            {category}
            <span className="text-sm font-normal text-muted-foreground">
              ({marketsByCategory[category].length} markets)
            </span>
          </h2>
          
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {marketsByCategory[category].map(market => (
              <MarketCard key={market.id} market={market} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function CategoryIcon({ category }: { category: string }) {
  const icons: Record<string, string> = {
    'Goals': '⚽',
    'BTTS': '🎯',
    'BTTS Combo': '🎯',
    'Match Result': '🏆',
    'Double Chance': '✌️',
    'Draw No Bet': '🤝',
    'Asian Handicap': '📊',
    'Asian Total': '📈',
    'First Half': '1️⃣',
    'Second Half': '2️⃣',
    'Home Team Goals': '🏠',
    'Away Team Goals': '✈️',
    'Corners': '🚩',
    'Cards': '🟨',
    'Correct Score': '🎱',
    'Win Margin': '📏',
    'Special': '⭐',
  };
  return <span>{icons[category] || '📋'}</span>;
}

function MarketCard({ market }: { market: any }) {
  const hasData = market.totalSelections > 0;
  const isOutperforming = market.actualHitRate > market.baselineProbability;
  const isUnderperforming = hasData && market.actualHitRate < market.baselineProbability - 0.1;
  
  return (
    <div className={`rounded-xl border bg-card p-4 transition-colors hover:bg-accent/50 ${
      isOutperforming ? 'border-green-500/50' : 
      isUnderperforming ? 'border-red-500/50' : ''
    }`}>
      <h3 className="font-medium">{market.name}</h3>
      
      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <div className="rounded bg-muted p-2">
          <p className="text-xs text-muted-foreground">Expected</p>
          <p className="font-semibold">{formatPercentage(market.baselineProbability)}</p>
        </div>
        <div className={`rounded p-2 ${
          hasData 
            ? isOutperforming 
              ? 'bg-green-500/20' 
              : isUnderperforming 
              ? 'bg-red-500/20' 
              : 'bg-muted'
            : 'bg-muted'
        }`}>
          <p className="text-xs text-muted-foreground">Your Rate</p>
          <p className={`font-semibold ${
            hasData 
              ? isOutperforming 
                ? 'text-green-500' 
                : isUnderperforming 
                ? 'text-red-500' 
                : ''
              : 'text-muted-foreground'
          }`}>
            {hasData ? formatPercentage(market.actualHitRate) : '-'}
          </p>
        </div>
      </div>
      
      {hasData && (
        <div className="mt-2 text-xs text-muted-foreground">
          {market.wonSelections}/{market.totalSelections} selections
        </div>
      )}

      {/* Value indicator */}
      {hasData && (
        <div className={`mt-2 rounded-full px-2 py-0.5 text-center text-xs ${
          isOutperforming 
            ? 'bg-green-500/20 text-green-500' 
            : isUnderperforming
            ? 'bg-red-500/20 text-red-500'
            : 'bg-muted text-muted-foreground'
        }`}>
          {isOutperforming 
            ? `+${formatPercentage(market.actualHitRate - market.baselineProbability)} edge` 
            : isUnderperforming
            ? `${formatPercentage(market.actualHitRate - market.baselineProbability)} below`
            : 'On track'}
        </div>
      )}
    </div>
  );
}