import prisma from '@/lib/prisma';
import { formatCurrency, formatPercentage } from '@/lib/utils';
import AnalyticsCharts from './AnalyticsCharts';

export const dynamic = 'force-dynamic';

export default async function AnalyticsPage() {
  const [streams, bets, bankroll, markets, selections] = await Promise.all([
    prisma.stream.findMany({
      include: { bets: true },
    }),
    prisma.bet.findMany({
      include: { selections: true },
      orderBy: { placedAt: 'asc' },
    }),
    prisma.bankroll.findFirst(),
    prisma.marketType.findMany({
      where: { totalSelections: { gt: 0 } },
      orderBy: { totalSelections: 'desc' },
    }),
    prisma.selection.findMany({
      include: { league: true },
      where: { status: { not: 'pending' } },
    }),
  ]);

  // Calculate stats
  const totalStreams = streams.length;
  const activeStreams = streams.filter(s => s.status === 'active').length;
  const completedStreams = streams.filter(s => s.status === 'completed').length;
  const failedStreams = streams.filter(s => s.status === 'failed').length;

  const totalBets = bets.length;
  const wonBets = bets.filter(b => b.status === 'won').length;
  const lostBets = bets.filter(b => b.status === 'lost').length;
  const settledBets = wonBets + lostBets;
  const winRate = settledBets > 0 ? wonBets / settledBets : 0;

  const totalStaked = bets.reduce((sum, b) => sum + b.stake, 0);
  const totalReturns = bets.filter(b => b.status === 'won').reduce((sum, b) => sum + (b.returns || 0), 0);
  const totalCashedOut = streams.reduce((sum, s) => sum + s.totalCashedOut, 0);

  // Stream survival stats
  const avgDaysBeforeFail = failedStreams > 0
    ? streams.filter(s => s.status === 'failed').reduce((sum, s) => sum + s.currentDay, 0) / failedStreams
    : 0;

  const longestStreak = Math.max(...streams.map(s => s.currentDay), 0);

  // Prepare chart data
  const cumulativeProfitData = bets
    .filter(b => b.status !== 'pending')
    .reduce((acc: any[], bet, index) => {
      const prev = acc[index - 1]?.profit || 0;
      const betProfit = bet.status === 'won' ? (bet.amountCashedOut || 0) : -(bet.stake);
      return [...acc, {
        day: index + 1,
        profit: prev + betProfit,
        date: new Date(bet.placedAt).toLocaleDateString(),
      }];
    }, []);

  // Market performance data
  const marketData = markets.slice(0, 10).map(m => ({
    name: m.name.length > 15 ? m.name.substring(0, 15) + '...' : m.name,
    winRate: Math.round(m.actualHitRate * 100),
    expected: Math.round(m.baselineProbability * 100),
    count: m.totalSelections,
  }));

  // Stream performance data
  const streamData = streams.map(s => ({
    name: s.name,
    days: s.currentDay,
    cashed: s.totalCashedOut,
    status: s.status,
  }));

  // Win/Loss by day of week
  const dayOfWeekData = [
    { day: 'Mon', wins: 0, losses: 0 },
    { day: 'Tue', wins: 0, losses: 0 },
    { day: 'Wed', wins: 0, losses: 0 },
    { day: 'Thu', wins: 0, losses: 0 },
    { day: 'Fri', wins: 0, losses: 0 },
    { day: 'Sat', wins: 0, losses: 0 },
    { day: 'Sun', wins: 0, losses: 0 },
  ];

  bets.filter(b => b.status !== 'pending').forEach(bet => {
    const dayIndex = new Date(bet.placedAt).getDay();
    const adjustedIndex = dayIndex === 0 ? 6 : dayIndex - 1; // Mon = 0
    if (bet.status === 'won') {
      dayOfWeekData[adjustedIndex].wins++;
    } else {
      dayOfWeekData[adjustedIndex].losses++;
    }
  });

  // League performance
  const leagueStats: Record<string, { name: string; won: number; total: number }> = {};
  selections.forEach(sel => {
    const leagueName = sel.league?.name || 'Unknown';
    if (!leagueStats[leagueName]) {
      leagueStats[leagueName] = { name: leagueName, won: 0, total: 0 };
    }
    leagueStats[leagueName].total++;
    if (sel.status === 'won') leagueStats[leagueName].won++;
  });

  const leagueData = Object.values(leagueStats)
    .filter(l => l.total >= 3)
    .map(l => ({
      name: l.name.length > 12 ? l.name.substring(0, 12) + '...' : l.name,
      winRate: Math.round((l.won / l.total) * 100),
      count: l.total,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">Performance analysis and insights</p>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="Total Streams"
          value={totalStreams.toString()}
          subtitle={`${activeStreams} active • ${completedStreams} completed • ${failedStreams} failed`}
        />
        <StatCard
          title="Win Rate"
          value={formatPercentage(winRate)}
          subtitle={`${wonBets}W / ${lostBets}L of ${settledBets} settled`}
          valueColor={winRate >= 0.9 ? 'text-green-500' : winRate >= 0.8 ? 'text-yellow-500' : 'text-red-500'}
        />
        <StatCard
          title="Total Cashed Out"
          value={formatCurrency(totalCashedOut)}
          subtitle="Lifetime withdrawals from streams"
          valueColor="text-green-500"
        />
        <StatCard
          title="Lifetime P/L"
          value={`${(bankroll?.lifetimeProfitLoss || 0) >= 0 ? '+' : ''}${formatCurrency(bankroll?.lifetimeProfitLoss || 0)}`}
          subtitle="Based on all settled bets"
          valueColor={(bankroll?.lifetimeProfitLoss || 0) >= 0 ? 'text-green-500' : 'text-red-500'}
        />
      </div>

      {/* Charts Component (Client) */}
      <AnalyticsCharts 
        cumulativeProfitData={cumulativeProfitData}
        marketData={marketData}
        streamData={streamData}
        dayOfWeekData={dayOfWeekData}
        leagueData={leagueData}
      />

      {/* Stream Analysis */}
      <div className="rounded-xl border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold">📊 Stream Analysis</h2>
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-lg bg-muted p-4 text-center">
            <p className="text-3xl font-bold">{avgDaysBeforeFail.toFixed(1)}</p>
            <p className="text-sm text-muted-foreground">Avg days before failure</p>
          </div>
          <div className="rounded-lg bg-muted p-4 text-center">
            <p className="text-3xl font-bold">{longestStreak}</p>
            <p className="text-sm text-muted-foreground">Longest active streak</p>
          </div>
          <div className="rounded-lg bg-muted p-4 text-center">
            <p className="text-3xl font-bold">
              {totalStreams > 0 ? formatPercentage(completedStreams / totalStreams) : '0%'}
            </p>
            <p className="text-sm text-muted-foreground">Target completion rate</p>
          </div>
          <div className="rounded-lg bg-muted p-4 text-center">
            <p className="text-3xl font-bold">
              {totalStreams > 0 ? formatPercentage(activeStreams / totalStreams) : '0%'}
            </p>
            <p className="text-sm text-muted-foreground">Currently active</p>
          </div>
        </div>
      </div>

      {/* Risk Calculator */}
      <div className="rounded-xl border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold">📉 Survival Probability Calculator</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Based on your current win rate of <strong>{formatPercentage(winRate)}</strong>, 
          here are your probabilities of surviving X consecutive days:
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-2 text-left">Days</th>
                <th className="py-2 text-center">Your Rate ({formatPercentage(winRate)})</th>
                <th className="py-2 text-center">90% Rate</th>
                <th className="py-2 text-center">95% Rate</th>
              </tr>
            </thead>
            <tbody>
              {[7, 14, 21, 30, 50, 100].map(days => (
                <tr key={days} className="border-b">
                  <td className="py-2 font-medium">{days} days</td>
                  <td className="py-2 text-center">{formatPercentage(Math.pow(winRate || 0.5, days))}</td>
                  <td className="py-2 text-center">{formatPercentage(Math.pow(0.9, days))}</td>
                  <td className="py-2 text-center">{formatPercentage(Math.pow(0.95, days))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ 
  title, 
  value, 
  subtitle, 
  valueColor = 'text-foreground' 
}: { 
  title: string; 
  value: string; 
  subtitle: string; 
  valueColor?: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-6">
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className={`text-3xl font-bold ${valueColor}`}>{value}</p>
      <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
    </div>
  );
}