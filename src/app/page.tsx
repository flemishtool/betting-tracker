import prisma from '@/lib/prisma';
import { formatCurrency } from '@/lib/utils';
import { calculateStreak } from '@/lib/analytics';
import Link from 'next/link';
import { BalanceChart, ProfitChart } from '@/components/DashboardCharts';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  // Use Prisma aggregations for performance
  const [
    betStats,
    wonStats,
    lostStats,
    pendingCount,
    bankroll,
    activeStreams,
    recentBets,
  ] = await Promise.all([
    // Total bet count and sums
    prisma.bet.aggregate({
      _count: { id: true },
      _sum: { stake: true, returns: true },
    }),
    // Won bets stats
    prisma.bet.aggregate({
      _count: { id: true },
      _sum: { stake: true, returns: true },
      where: { status: 'won' },
    }),
    // Lost bets stats
    prisma.bet.aggregate({
      _count: { id: true },
      _sum: { stake: true },
      where: { status: 'lost' },
    }),
    // Pending bets count
    prisma.bet.count({
      where: { status: 'pending' },
    }),
    // Bankroll
    prisma.bankroll.findFirst(),
    // Active streams
    prisma.stream.findMany({
      where: { status: 'active' },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    // Recent bets for streak calculation
    prisma.bet.findMany({
      where: { status: { in: ['won', 'lost'] } },
      orderBy: { settledAt: 'desc' },
      take: 50,
      select: {
        id: true,
        status: true,
        settledAt: true,
        placedAt: true,
        stake: true,
        returns: true,
        totalOdds: true,
      },
    }),
  ]);

  // Calculate derived stats
  const totalBets = betStats._count.id;
  const settledBets = (wonStats._count.id || 0) + (lostStats._count.id || 0);
  const totalStaked = betStats._sum.stake || 0;
  const totalReturns = betStats._sum.returns || 0;
  const netProfit = (wonStats._sum.returns || 0) - (wonStats._sum.stake || 0) - (lostStats._sum.stake || 0);
  const winRate = settledBets > 0 ? ((wonStats._count.id || 0) / settledBets) * 100 : 0;
  const roi = totalStaked > 0 ? (netProfit / totalStaked) * 100 : 0;

  // Calculate streak using utility
  const streak = calculateStreak(recentBets);

  // Prepare chart data (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const dailyData = await prisma.bet.groupBy({
    by: ['placedAt'],
    where: {
      status: { in: ['won', 'lost'] },
      settledAt: { gte: thirtyDaysAgo },
    },
    _sum: { stake: true, returns: true },
  });

  // Build chart data
  const chartData: { date: string; balance: number; profit: number }[] = [];
  let runningBalance = bankroll?.currentBalance || 0;
  let runningProfit = 0;

  // Get bets grouped by day for chart
  const betsForChart = await prisma.bet.findMany({
    where: {
      status: { in: ['won', 'lost'] },
      settledAt: { gte: thirtyDaysAgo },
    },
    orderBy: { settledAt: 'asc' },
    select: {
      settledAt: true,
      stake: true,
      returns: true,
      status: true,
    },
  });

  // Group by date
  const byDate = new Map<string, { profit: number }>();
  betsForChart.forEach(bet => {
    const dateKey = bet.settledAt?.toISOString().split('T')[0] || '';
    if (!byDate.has(dateKey)) {
      byDate.set(dateKey, { profit: 0 });
    }
    const entry = byDate.get(dateKey)!;
    if (bet.status === 'won') {
      entry.profit += (bet.returns || 0) - bet.stake;
    } else {
      entry.profit -= bet.stake;
    }
  });

  // Convert to chart array
  let cumulativeProfit = 0;
  const startBalance = bankroll?.startingBalance || 0;
  
  Array.from(byDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([date, data]) => {
      cumulativeProfit += data.profit;
      chartData.push({
        date: new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
        balance: startBalance + cumulativeProfit,
        profit: cumulativeProfit,
      });
    });

  const currency = bankroll?.currency || 'GBP';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Your betting performance at a glance</p>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Bankroll Card */}
        <div className="rounded-xl border bg-gradient-to-br from-green-500/20 to-green-500/5 p-6">
          <p className="text-sm text-muted-foreground">Current Bankroll</p>
          <p className="mt-1 text-3xl font-bold text-green-500">
            {formatCurrency(bankroll?.currentBalance || 0, currency)}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Started: {formatCurrency(bankroll?.startingBalance || 0, currency)}
          </p>
        </div>

        {/* Net Profit Card */}
        <div className={`rounded-xl border p-6 ${
          netProfit >= 0 
            ? 'bg-gradient-to-br from-green-500/20 to-green-500/5' 
            : 'bg-gradient-to-br from-red-500/20 to-red-500/5'
        }`}>
          <p className="text-sm text-muted-foreground">Net Profit/Loss</p>
          <p className={`mt-1 text-3xl font-bold ${netProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {netProfit >= 0 ? '+' : ''}{formatCurrency(netProfit, currency)}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            ROI: {roi >= 0 ? '+' : ''}{roi.toFixed(1)}%
          </p>
        </div>

        {/* Win Rate Card */}
        <div className="rounded-xl border bg-card p-6">
          <p className="text-sm text-muted-foreground">Win Rate</p>
          <p className="mt-1 text-3xl font-bold">
            {winRate.toFixed(1)}%
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            {wonStats._count.id || 0}W / {lostStats._count.id || 0}L of {settledBets} settled
          </p>
        </div>

        {/* Streak Card */}
        <div className={`rounded-xl border p-6 ${
          streak.type === 'win' 
            ? 'bg-gradient-to-br from-green-500/20 to-green-500/5' 
            : streak.type === 'loss'
            ? 'bg-gradient-to-br from-red-500/20 to-red-500/5'
            : 'bg-card'
        }`}>
          <p className="text-sm text-muted-foreground">Current Streak</p>
          <p className={`mt-1 text-3xl font-bold ${
            streak.type === 'win' ? 'text-green-500' : streak.type === 'loss' ? 'text-red-500' : ''
          }`}>
            {streak.count > 0 ? `${streak.count} ${streak.type === 'win' ? '🔥' : '❄️'}` : '-'}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            {streak.type === 'win' ? 'Winning streak!' : streak.type === 'loss' ? 'Losing streak' : 'No streak'}
          </p>
        </div>
      </div>

      {/* Charts */}
      {chartData.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold">Balance Over Time</h2>
            <BalanceChart 
              data={chartData} 
              currency={currency}
              startingBalance={bankroll?.startingBalance || 0}
            />
          </div>
          <div className="rounded-xl border bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold">Cumulative Profit/Loss</h2>
            <ProfitChart 
              data={chartData} 
              currency={currency}
            />
          </div>
        </div>
      )}

      {/* Active Streams */}
      <div className="rounded-xl border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Active Streams</h2>
          <Link 
            href="/streams" 
            className="text-sm text-primary hover:underline"
          >
            View all →
          </Link>
        </div>
        {activeStreams.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {activeStreams.map(stream => (
              <Link
                key={stream.id}
                href={`/streams/${stream.id}`}
                className="rounded-lg border bg-muted/50 p-4 hover:border-primary transition-colors"
              >
                <h3 className="font-semibold">{stream.name}</h3>
                <p className="text-2xl font-bold mt-2">
                  {formatCurrency(stream.currentBalance, currency)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Day {stream.currentDay + 1} • Target: {stream.targetDailyOdds}x
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>No active streams</p>
            <Link 
              href="/streams/new" 
              className="mt-2 inline-block text-primary hover:underline"
            >
              Create your first stream →
            </Link>
          </div>
        )}
      </div>

      {/* Quick Stats Row */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-4 text-center">
          <p className="text-3xl font-bold">{totalBets}</p>
          <p className="text-sm text-muted-foreground">Total Bets</p>
        </div>
        <div className="rounded-xl border bg-card p-4 text-center">
          <p className="text-3xl font-bold">{pendingCount}</p>
          <p className="text-sm text-muted-foreground">Pending</p>
        </div>
        <div className="rounded-xl border bg-card p-4 text-center">
          <p className="text-3xl font-bold">{formatCurrency(totalStaked, currency)}</p>
          <p className="text-sm text-muted-foreground">Total Staked</p>
        </div>
      </div>
    </div>
  );
}