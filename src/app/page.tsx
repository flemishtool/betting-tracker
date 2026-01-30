import Link from 'next/link';
import prisma from '@/lib/prisma';
import { formatCurrency, formatDate, formatPercentage } from '@/lib/utils';
import DashboardCharts from '@/components/DashboardCharts';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  // Fetch all data in parallel
  const [streams, bets, bankroll, recentSelections] = await Promise.all([
    prisma.stream.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        bets: {
          orderBy: { placedAt: 'desc' },
          take: 5,
          include: { selections: true },
        },
      },
    }),
    prisma.bet.findMany({
      include: { stream: true, selections: true },
      orderBy: { placedAt: 'desc' },
    }),
    prisma.bankroll.findFirst(),
    prisma.selection.findMany({
      orderBy: { matchDate: 'desc' },
      take: 10,
      include: {
        bet: { include: { stream: true } },
        league: true,
      },
    }),
  ]);

  // Calculate statistics
  const activeStreams = streams.filter(s => s.status === 'active');
  const completedStreams = streams.filter(s => s.status === 'completed');
  const failedStreams = streams.filter(s => s.status === 'failed');

  const totalBets = bets.length;
  const pendingBets = bets.filter(b => b.status === 'pending');
  const wonBets = bets.filter(b => b.status === 'won');
  const lostBets = bets.filter(b => b.status === 'lost');

  const winRate = totalBets > 0 ? (wonBets.length / (wonBets.length + lostBets.length)) * 100 : 0;

  const totalStaked = bets.reduce((sum, b) => sum + b.stake, 0);
  const totalReturns = wonBets.reduce((sum, b) => sum + (b.returns || 0), 0);
  const totalProfit = totalReturns - totalStaked + pendingBets.reduce((sum, b) => sum + b.stake, 0);

  // Today's matches
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todaysMatches = recentSelections.filter(s => {
    const matchDate = new Date(s.matchDate);
    return matchDate >= today && matchDate < tomorrow;
  });

  // Calculate streaks
  const settledBets = bets.filter(b => b.status !== 'pending').sort((a, b) => 
    new Date(b.settledAt || b.placedAt).getTime() - new Date(a.settledAt || a.placedAt).getTime()
  );
  
  let currentStreak = 0;
  let streakType: 'win' | 'loss' | null = null;
  for (const bet of settledBets) {
    if (streakType === null) {
      streakType = bet.status === 'won' ? 'win' : 'loss';
      currentStreak = 1;
    } else if ((bet.status === 'won' && streakType === 'win') || (bet.status === 'lost' && streakType === 'loss')) {
      currentStreak++;
    } else {
      break;
    }
  }

  // Best performing stream
  const bestStream = activeStreams.reduce((best, stream) => {
    const roi = stream.initialStake > 0 
      ? ((stream.currentBalance + stream.totalCashedOut - stream.initialStake) / stream.initialStake) * 100
      : 0;
    const bestRoi = best && best.initialStake > 0
      ? ((best.currentBalance + best.totalCashedOut - best.initialStake) / best.initialStake) * 100
      : 0;
    return roi > bestRoi ? stream : best;
  }, activeStreams[0]);

  // Profit data for chart
  const profitData = bets
    .filter(b => b.status !== 'pending')
    .sort((a, b) => new Date(a.settledAt || a.placedAt).getTime() - new Date(b.settledAt || b.placedAt).getTime())
    .reduce((acc: any[], bet, index) => {
      const prevProfit = acc.length > 0 ? acc[acc.length - 1].profit : 0;
      const betProfit = bet.status === 'won' ? (bet.returns || 0) - bet.stake : -bet.stake;
      acc.push({
        name: `Bet ${index + 1}`,
        profit: prevProfit + betProfit,
        date: new Date(bet.settledAt || bet.placedAt).toLocaleDateString(),
      });
      return acc;
    }, []);

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-background border p-6 md:p-8">
        <div className="absolute right-0 top-0 -translate-y-1/4 translate-x-1/4 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute left-0 bottom-0 translate-y-1/4 -translate-x-1/4 h-48 w-48 rounded-full bg-primary/10 blur-2xl" />
        
        <div className="relative">
          <h1 className="text-3xl md:text-4xl font-bold">
            Welcome to BetTracker 🎯
          </h1>
          <p className="mt-2 text-muted-foreground max-w-xl">
            Track your betting streams, analyze performance, and grow your bankroll with compound interest.
          </p>
          
          {/* Quick Stats Row */}
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-xl bg-card/80 backdrop-blur p-4 border">
              <p className="text-sm text-muted-foreground">Total Bankroll</p>
              <p className="text-2xl md:text-3xl font-bold text-primary">
                {formatCurrency(bankroll?.totalCapital || 0)}
              </p>
            </div>
            <div className="rounded-xl bg-card/80 backdrop-blur p-4 border">
              <p className="text-sm text-muted-foreground">Available</p>
              <p className="text-2xl md:text-3xl font-bold text-green-500">
                {formatCurrency(bankroll?.availableCapital || 0)}
              </p>
            </div>
            <div className="rounded-xl bg-card/80 backdrop-blur p-4 border">
              <p className="text-sm text-muted-foreground">Deployed</p>
              <p className="text-2xl md:text-3xl font-bold text-yellow-500">
                {formatCurrency(bankroll?.deployedCapital || 0)}
              </p>
            </div>
            <div className="rounded-xl bg-card/80 backdrop-blur p-4 border">
              <p className="text-sm text-muted-foreground">Lifetime P/L</p>
              <p className={`text-2xl md:text-3xl font-bold ${
                (bankroll?.lifetimeProfitLoss || 0) >= 0 ? 'text-green-500' : 'text-red-500'
              }`}>
                {formatCurrency(bankroll?.lifetimeProfitLoss || 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-4">
        <Link
          href="/streams/new"
          className="group relative overflow-hidden rounded-xl border bg-card p-6 transition-all hover:border-primary hover:shadow-lg"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          <span className="text-3xl">🚀</span>
          <h3 className="mt-2 font-semibold">New Stream</h3>
          <p className="text-sm text-muted-foreground">Start a new betting stream</p>
        </Link>

        {activeStreams.length > 0 && (
          <Link
            href={`/bets/new/${activeStreams[0].id}`}
            className="group relative overflow-hidden rounded-xl border bg-card p-6 transition-all hover:border-primary hover:shadow-lg"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            <span className="text-3xl">🎰</span>
            <h3 className="mt-2 font-semibold">Place Bet</h3>
            <p className="text-sm text-muted-foreground">Add bet to {activeStreams[0].name}</p>
          </Link>
        )}

        <Link
          href="/analytics"
          className="group relative overflow-hidden rounded-xl border bg-card p-6 transition-all hover:border-primary hover:shadow-lg"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          <span className="text-3xl">📊</span>
          <h3 className="mt-2 font-semibold">Analytics</h3>
          <p className="text-sm text-muted-foreground">View detailed statistics</p>
        </Link>

        <Link
          href="/markets"
          className="group relative overflow-hidden rounded-xl border bg-card p-6 transition-all hover:border-primary hover:shadow-lg"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          <span className="text-3xl">📈</span>
          <h3 className="mt-2 font-semibold">Markets</h3>
          <p className="text-sm text-muted-foreground">Browse bet types</p>
        </Link>
      </div>

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - 2/3 width */}
        <div className="space-y-6 lg:col-span-2">
          {/* Performance Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border bg-card p-4">
              <div className="flex items-center justify-between">
                <span className="text-2xl">🏆</span>
                <span className={`rounded-full px-2 py-0.5 text-xs ${
                  winRate >= 70 ? 'bg-green-500/20 text-green-500' : 
                  winRate >= 50 ? 'bg-yellow-500/20 text-yellow-500' : 
                  'bg-red-500/20 text-red-500'
                }`}>
                  {winRate >= 70 ? 'Excellent' : winRate >= 50 ? 'Good' : 'Needs Work'}
                </span>
              </div>
              <p className="mt-2 text-3xl font-bold">{winRate.toFixed(1)}%</p>
              <p className="text-sm text-muted-foreground">Win Rate</p>
            </div>

            <div className="rounded-xl border bg-card p-4">
              <div className="flex items-center justify-between">
                <span className="text-2xl">📝</span>
                {pendingBets.length > 0 && (
                  <span className="rounded-full bg-yellow-500/20 px-2 py-0.5 text-xs text-yellow-500">
                    {pendingBets.length} pending
                  </span>
                )}
              </div>
              <p className="mt-2 text-3xl font-bold">{totalBets}</p>
              <p className="text-sm text-muted-foreground">Total Bets</p>
            </div>

            <div className="rounded-xl border bg-card p-4">
              <div className="flex items-center justify-between">
                <span className="text-2xl">{streakType === 'win' ? '🔥' : streakType === 'loss' ? '❄️' : '➖'}</span>
              </div>
              <p className={`mt-2 text-3xl font-bold ${
                streakType === 'win' ? 'text-green-500' : 
                streakType === 'loss' ? 'text-red-500' : ''
              }`}>
                {currentStreak > 0 ? `${currentStreak} ${streakType}s` : 'No bets'}
              </p>
              <p className="text-sm text-muted-foreground">Current Streak</p>
            </div>

            <div className="rounded-xl border bg-card p-4">
              <div className="flex items-center justify-between">
                <span className="text-2xl">🌊</span>
              </div>
              <p className="mt-2 text-3xl font-bold">{activeStreams.length}</p>
              <p className="text-sm text-muted-foreground">Active Streams</p>
            </div>
          </div>

          {/* Profit Chart */}
          {profitData.length > 0 && (
            <div className="rounded-xl border bg-card p-6">
              <h2 className="mb-4 text-lg font-semibold">Profit Timeline</h2>
              <DashboardCharts profitData={profitData} />
            </div>
          )}

          {/* Active Streams */}
          <div className="rounded-xl border bg-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Active Streams</h2>
              <Link href="/streams" className="text-sm text-primary hover:underline">
                View all →
              </Link>
            </div>

            {activeStreams.length === 0 ? (
              <div className="rounded-lg bg-muted/50 p-8 text-center">
                <span className="text-4xl">🌊</span>
                <p className="mt-2 text-muted-foreground">No active streams</p>
                <Link
                  href="/streams/new"
                  className="mt-4 inline-block rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
                >
                  Create Your First Stream
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {activeStreams.slice(0, 5).map(stream => {
                  const progress = stream.targetBalance 
                    ? (stream.currentBalance / stream.targetBalance) * 100 
                    : 0;
                  const roi = stream.initialStake > 0 
                    ? ((stream.currentBalance + stream.totalCashedOut - stream.initialStake) / stream.initialStake) * 100
                    : 0;

                  return (
                    <Link
                      key={stream.id}
                      href={`/streams/${stream.id}`}
                      className="block rounded-lg border bg-muted/30 p-4 transition-colors hover:bg-muted/50"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">{stream.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            Day {stream.currentDay} • {stream.wonBets}W/{stream.lostBets}L
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg">{formatCurrency(stream.currentBalance)}</p>
                          <p className={`text-sm ${roi >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {roi >= 0 ? '+' : ''}{roi.toFixed(1)}% ROI
                          </p>
                        </div>
                      </div>
                      
                      {stream.targetBalance && (
                        <div className="mt-3">
                          <div className="flex justify-between text-xs text-muted-foreground mb-1">
                            <span>Progress to {formatCurrency(stream.targetBalance)}</span>
                            <span>{progress.toFixed(0)}%</span>
                          </div>
                          <div className="h-2 rounded-full bg-muted overflow-hidden">
                            <div 
                              className="h-full rounded-full bg-primary transition-all"
                              style={{ width: `${Math.min(100, progress)}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - 1/3 width */}
        <div className="space-y-6">
          {/* Pending Bets Alert */}
          {pendingBets.length > 0 && (
            <div className="rounded-xl border-2 border-yellow-500/50 bg-yellow-500/10 p-6">
              <div className="flex items-center gap-2">
                <span className="text-2xl">⏳</span>
                <h2 className="text-lg font-semibold">Pending Bets</h2>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {pendingBets.length} bet{pendingBets.length !== 1 ? 's' : ''} awaiting results
              </p>
              
              <div className="mt-4 space-y-2">
                {pendingBets.slice(0, 3).map(bet => (
                  <Link
                    key={bet.id}
                    href={`/bets/${bet.id}/settle`}
                    className="block rounded-lg bg-card/80 p-3 transition-colors hover:bg-card"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{bet.stream?.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {bet.selections?.length || 0} selections
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(bet.stake)}</p>
                        <p className="text-xs text-muted-foreground">@ {bet.totalOdds.toFixed(2)}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {pendingBets.length > 3 && (
                <Link
                  href="/bets?status=pending"
                  className="mt-3 block text-center text-sm text-primary hover:underline"
                >
                  View all {pendingBets.length} pending bets →
                </Link>
              )}
            </div>
          )}

          {/* Today's Matches */}
          <div className="rounded-xl border bg-card p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <span>🗓️</span>
              Today&apos;s Matches
            </h2>
            
            {todaysMatches.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                No matches scheduled for today
              </p>
            ) : (
              <div className="space-y-3">
                {todaysMatches.slice(0, 5).map(selection => (
                  <div key={selection.id} className="rounded-lg bg-muted/50 p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">
                          {selection.homeTeam} vs {selection.awayTeam}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {selection.league?.name} • {selection.market}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {new Date(selection.matchDate).toLocaleTimeString('en-GB', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                        <span className={`text-xs rounded-full px-2 py-0.5 ${
                          selection.status === 'won' ? 'bg-green-500/20 text-green-500' :
                          selection.status === 'lost' ? 'bg-red-500/20 text-red-500' :
                          'bg-yellow-500/20 text-yellow-500'
                        }`}>
                          {selection.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Stream Success Rate */}
          <div className="rounded-xl border bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold">Stream Performance</h2>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Completed</span>
                  <span className="text-green-500 font-medium">{completedStreams.length}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-green-500"
                    style={{ width: `${streams.length > 0 ? (completedStreams.length / streams.length) * 100 : 0}%` }}
                  />
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Active</span>
                  <span className="text-yellow-500 font-medium">{activeStreams.length}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-yellow-500"
                    style={{ width: `${streams.length > 0 ? (activeStreams.length / streams.length) * 100 : 0}%` }}
                  />
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Failed</span>
                  <span className="text-red-500 font-medium">{failedStreams.length}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-red-500"
                    style={{ width: `${streams.length > 0 ? (failedStreams.length / streams.length) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>

            {streams.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold">
                  {((completedStreams.length / (completedStreams.length + failedStreams.length)) * 100 || 0).toFixed(1)}%
                </p>
              </div>
            )}
          </div>

          {/* Best Stream */}
          {bestStream && (
            <div className="rounded-xl border bg-gradient-to-br from-primary/20 to-transparent p-6">
              <h2 className="mb-2 text-sm font-medium text-muted-foreground">🏆 Best Performing</h2>
              <Link href={`/streams/${bestStream.id}`} className="hover:underline">
                <h3 className="text-lg font-bold">{bestStream.name}</h3>
              </Link>
              <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Balance</p>
                  <p className="font-semibold">{formatCurrency(bestStream.currentBalance)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Cashed Out</p>
                  <p className="font-semibold text-green-500">{formatCurrency(bestStream.totalCashedOut)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Day</p>
                  <p className="font-semibold">{bestStream.currentDay}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Win Rate</p>
                  <p className="font-semibold">{formatPercentage(bestStream.actualWinRate)}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}