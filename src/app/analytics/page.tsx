import prisma from '@/lib/prisma';
import { formatCurrency, formatPercentage } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function AnalyticsPage() {
  const [streams, bets, bankroll, markets] = await Promise.all([
    prisma.stream.findMany(),
    prisma.bet.findMany({ include: { selections: true } }),
    prisma.bankroll.findFirst(),
    prisma.marketType.findMany({ where: { totalSelections: { gt: 0 } } }),
  ]);

  // Calculate stats
  const totalStreams = streams.length;
  const activeStreams = streams.filter(s => s.status === 'active').length;
  const completedStreams = streams.filter(s => s.status === 'completed').length;
  const failedStreams = streams.filter(s => s.status === 'failed').length;

  const totalBets = bets.length;
  const wonBets = bets.filter(b => b.status === 'won').length;
  const lostBets = bets.filter(b => b.status === 'lost').length;
  const winRate = totalBets > 0 ? wonBets / (wonBets + lostBets) : 0;

  const totalStaked = bets.reduce((sum, b) => sum + b.stake, 0);
  const totalReturns = bets.filter(b => b.status === 'won').reduce((sum, b) => sum + (b.returns || 0), 0);
  const totalProfit = totalReturns - totalStaked;

  const totalCashedOut = streams.reduce((sum, s) => sum + s.totalCashedOut, 0);
  const totalDeployed = streams.filter(s => s.status === 'active').reduce((sum, s) => sum + s.currentBalance, 0);

  // Stream survival stats
  const avgDaysBeforeFail = failedStreams > 0
    ? streams.filter(s => s.status === 'failed').reduce((sum, s) => sum + s.currentDay, 0) / failedStreams
    : 0;

  const longestStreak = Math.max(...streams.map(s => s.wonBets), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">Performance analysis and insights</p>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border bg-card p-6">
          <p className="text-sm text-muted-foreground">Total Streams</p>
          <p className="text-3xl font-bold">{totalStreams}</p>
          <div className="mt-2 flex gap-2 text-sm">
            <span className="text-green-500">{activeStreams} active</span>
            <span className="text-blue-500">{completedStreams} completed</span>
            <span className="text-red-500">{failedStreams} failed</span>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-6">
          <p className="text-sm text-muted-foreground">Win Rate</p>
          <p className="text-3xl font-bold">{formatPercentage(winRate)}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {wonBets}W / {lostBets}L of {totalBets} bets
          </p>
        </div>

        <div className="rounded-xl border bg-card p-6">
          <p className="text-sm text-muted-foreground">Total Cashed Out</p>
          <p className="text-3xl font-bold text-green-500">{formatCurrency(totalCashedOut)}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Lifetime withdrawals from streams
          </p>
        </div>

        <div className="rounded-xl border bg-card p-6">
          <p className="text-sm text-muted-foreground">Lifetime P/L</p>
          <p className={`text-3xl font-bold ${(bankroll?.lifetimeProfitLoss || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {(bankroll?.lifetimeProfitLoss || 0) >= 0 ? '+' : ''}{formatCurrency(bankroll?.lifetimeProfitLoss || 0)}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Based on all settled bets
          </p>
        </div>
      </div>

      {/* Stream Analysis */}
      <div className="rounded-xl border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold">Stream Analysis</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg bg-muted p-4 text-center">
            <p className="text-3xl font-bold">{avgDaysBeforeFail.toFixed(1)}</p>
            <p className="text-sm text-muted-foreground">Avg days before failure</p>
          </div>
          <div className="rounded-lg bg-muted p-4 text-center">
            <p className="text-3xl font-bold">{longestStreak}</p>
            <p className="text-sm text-muted-foreground">Longest win streak</p>
          </div>
          <div className="rounded-lg bg-muted p-4 text-center">
            <p className="text-3xl font-bold">
              {totalStreams > 0 ? formatPercentage(completedStreams / totalStreams) : '0%'}
            </p>
            <p className="text-sm text-muted-foreground">Success rate (reached target)</p>
          </div>
        </div>
      </div>

      {/* Market Performance */}
      <div className="rounded-xl border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold">Market Performance</h2>
        {markets.length === 0 ? (
          <p className="text-muted-foreground">No market data yet. Place more bets to see statistics.</p>
        ) : (
          <div className="space-y-3">
            {markets
              .sort((a, b) => b.totalSelections - a.totalSelections)
              .slice(0, 10)
              .map(market => {
                const edge = market.actualHitRate - market.baselineProbability;
                return (
                  <div key={market.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="font-medium">{market.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {market.wonSelections}/{market.totalSelections} selections
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatPercentage(market.actualHitRate)}</p>
                      <p className={`text-sm ${edge >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {edge >= 0 ? '+' : ''}{formatPercentage(edge)} vs expected
                      </p>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* Probability Calculator */}
      <div className="rounded-xl border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold">Survival Probability Reference</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Based on different daily win rates, here's the probability of a stream surviving:
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-2 text-left">Win Rate</th>
                <th className="py-2 text-center">7 Days</th>
                <th className="py-2 text-center">14 Days</th>
                <th className="py-2 text-center">21 Days</th>
                <th className="py-2 text-center">30 Days</th>
              </tr>
            </thead>
            <tbody>
              {[0.95, 0.90, 0.85, 0.80, 0.75].map(rate => (
                <tr key={rate} className="border-b">
                  <td className="py-2 font-medium">{formatPercentage(rate)}</td>
                  <td className="py-2 text-center">{formatPercentage(Math.pow(rate, 7))}</td>
                  <td className="py-2 text-center">{formatPercentage(Math.pow(rate, 14))}</td>
                  <td className="py-2 text-center">{formatPercentage(Math.pow(rate, 21))}</td>
                  <td className="py-2 text-center">{formatPercentage(Math.pow(rate, 30))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}