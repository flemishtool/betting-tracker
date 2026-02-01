import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';
import StreamFundsManager from '@/components/StreamFundsManager';
import BetSettler from '@/components/BetSettler';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function StreamDetailPage({ params }: Props) {
  const { id } = await params;

  // Fetch stream, bets, and bankroll together
  const [stream, bets, bankroll] = await Promise.all([
    prisma.stream.findUnique({
      where: { id },
    }),
    prisma.bet.findMany({
      where: { streamId: id },
      include: {
        selections: {
          include: {
            league: true,
            marketType: true,
          },
        },
      },
      orderBy: { placedAt: 'desc' },
    }),
    prisma.bankroll.findFirst(),
  ]);

  if (!stream) {
    notFound();
  }

  // Calculate stats
  const totalBets = bets.length;
  const wonBets = bets.filter((b) => b.status === 'won').length;
  const lostBets = bets.filter((b) => b.status === 'lost').length;
  const pendingBets = bets.filter((b) => b.status === 'pending').length;
  const winRate = totalBets > 0 ? (wonBets / (wonBets + lostBets)) * 100 : 0;

  // Calculate profit/loss
  const totalStaked = bets.reduce((sum, b) => sum + b.stake, 0);
  const totalReturns = bets
    .filter((b) => b.status === 'won')
    .reduce((sum, b) => sum + (b.returns || 0), 0);
  const netProfit = totalReturns - bets.filter((b) => b.status !== 'pending').reduce((sum, b) => sum + b.stake, 0);

  // Growth calculation
  const growthPercent = stream.startingBalance > 0
    ? ((stream.currentBalance - stream.startingBalance) / stream.startingBalance) * 100
    : 0;

  const currency = bankroll?.currency || 'GBP';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Link 
              href="/streams" 
              className="text-muted-foreground hover:text-foreground"
            >
              ← Streams
            </Link>
          </div>
          <h1 className="mt-2 text-3xl font-bold">{stream.name}</h1>
          <p className="text-muted-foreground">
            Day {stream.currentDay + 1} of {stream.totalDays} • Target: {stream.targetDailyOdds.toFixed(2)}x daily
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/bets/new/${stream.id}`}
            className="rounded-lg bg-primary px-6 py-2 font-semibold text-primary-foreground hover:bg-primary/90"
          >
            + Place Bet
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Current Balance */}
        <div className="rounded-xl border bg-gradient-to-br from-green-500/20 to-green-500/5 p-6">
          <p className="text-sm text-muted-foreground">Current Balance</p>
          <p className="mt-1 text-3xl font-bold text-green-500">
            {formatCurrency(stream.currentBalance, currency)}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Started: {formatCurrency(stream.startingBalance, currency)}
          </p>
        </div>

        {/* Growth */}
        <div className={`rounded-xl border p-6 ${
          growthPercent >= 0 
            ? 'bg-gradient-to-br from-green-500/20 to-green-500/5' 
            : 'bg-gradient-to-br from-red-500/20 to-red-500/5'
        }`}>
          <p className="text-sm text-muted-foreground">Growth</p>
          <p className={`mt-1 text-3xl font-bold ${growthPercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {growthPercent >= 0 ? '+' : ''}{growthPercent.toFixed(1)}%
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            {netProfit >= 0 ? '+' : ''}{formatCurrency(netProfit, currency)} net
          </p>
        </div>

        {/* Win Rate */}
        <div className="rounded-xl border bg-card p-6">
          <p className="text-sm text-muted-foreground">Win Rate</p>
          <p className="mt-1 text-3xl font-bold">
            {wonBets + lostBets > 0 ? winRate.toFixed(1) : '0'}%
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            {wonBets}W / {lostBets}L
          </p>
        </div>

        {/* Bets Count */}
        <div className="rounded-xl border bg-card p-6">
          <p className="text-sm text-muted-foreground">Total Bets</p>
          <p className="mt-1 text-3xl font-bold">{totalBets}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            {pendingBets} pending
          </p>
        </div>
      </div>

      {/* Stream Management Section */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Funds Manager */}
        <div className="rounded-xl border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">💰 Manage Funds</h2>
          <div className="space-y-4">
            <div className="rounded-lg bg-muted p-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Stream Balance</span>
                <span className="font-bold text-green-500">
                  {formatCurrency(stream.currentBalance, currency)}
                </span>
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span className="text-muted-foreground">Available in Bankroll</span>
                <span className="font-medium">
                  {formatCurrency(bankroll?.availableCapital || 0, currency)}
                </span>
              </div>
            </div>
            <StreamFundsManager
              streamId={stream.id}
              streamName={stream.name}
              currentBalance={stream.currentBalance}
              availableBankroll={bankroll?.availableCapital || 0}
              currency={currency}
            />
          </div>
        </div>

        {/* Stream Info */}
        <div className="rounded-xl border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">📊 Stream Info</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                stream.status === 'active' 
                  ? 'bg-green-500/20 text-green-500' 
                  : stream.status === 'completed'
                  ? 'bg-blue-500/20 text-blue-500'
                  : 'bg-red-500/20 text-red-500'
              }`}>
                {stream.status.charAt(0).toUpperCase() + stream.status.slice(1)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Target Daily Odds</span>
              <span className="font-medium">{stream.targetDailyOdds.toFixed(2)}x</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">Day {stream.currentDay + 1} / {stream.totalDays}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Staked</span>
              <span className="font-medium">{formatCurrency(totalStaked, currency)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Returns</span>
              <span className="font-medium">{formatCurrency(totalReturns, currency)}</span>
            </div>
          </div>
        </div>

        {/* Target Progress */}
        <div className="rounded-xl border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">🎯 Target Progress</h2>
          <div className="space-y-4">
            {/* Progress Bar */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Days Completed</span>
                <span className="font-medium">{Math.round((stream.currentDay / stream.totalDays) * 100)}%</span>
              </div>
              <div className="h-3 rounded-full bg-muted overflow-hidden">
                <div 
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${(stream.currentDay / stream.totalDays) * 100}%` }}
                />
              </div>
            </div>

            {/* Projected Final */}
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground mb-1">Projected Final (at target)</p>
              <p className="text-xl font-bold text-primary">
                {formatCurrency(
                  stream.startingBalance * Math.pow(stream.targetDailyOdds, stream.totalDays),
                  currency
                )}
              </p>
            </div>

            {/* Days Remaining */}
            <div className="text-center text-sm text-muted-foreground">
              {stream.totalDays - stream.currentDay} days remaining
            </div>
          </div>
        </div>
      </div>

      {/* Bets List */}
      <div className="rounded-xl border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">📋 Bets History</h2>
          <Link
            href={`/bets/new/${stream.id}`}
            className="text-sm text-primary hover:underline"
          >
            + New Bet
          </Link>
        </div>

        {bets.length > 0 ? (
          <div className="space-y-4">
            {bets.map((bet) => (
              <div
                key={bet.id}
                className={`rounded-lg border p-4 ${
                  bet.status === 'won'
                    ? 'border-green-500/30 bg-green-500/5'
                    : bet.status === 'lost'
                    ? 'border-red-500/30 bg-red-500/5'
                    : 'bg-muted/50'
                }`}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1">
                    {/* Selections */}
                    <div className="space-y-1">
                      {bet.selections.map((selection, index) => (
                        <div key={selection.id} className="text-sm">
                          <span className="font-medium">
                            {selection.homeTeam} vs {selection.awayTeam}
                          </span>
                          <span className="text-muted-foreground">
                            {' '}• {selection.league?.name} • {selection.marketType?.name}
                          </span>
                          <span className="text-primary font-medium">
                            {' '}@ {selection.odds.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                    
                    {/* Bet Meta */}
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span>Stake: {formatCurrency(bet.stake, currency)}</span>
                      <span>Odds: {bet.totalOdds.toFixed(2)}</span>
                      <span>
                        Potential: {formatCurrency(bet.stake * bet.totalOdds, currency)}
                      </span>
                      <span>
                        {new Date(bet.placedAt).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Status / Settler */}
                  <div className="flex items-center gap-3">
                    {bet.status === 'pending' ? (
                      <BetSettler betId={bet.id} stake={bet.stake} totalOdds={bet.totalOdds} />
                    ) : (
                      <div className="text-right">
                        <span
                          className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${
                            bet.status === 'won'
                              ? 'bg-green-500/20 text-green-500'
                              : 'bg-red-500/20 text-red-500'
                          }`}
                        >
                          {bet.status === 'won' ? '✓ Won' : '✗ Lost'}
                        </span>
                        {bet.status === 'won' && bet.returns && (
                          <p className="mt-1 text-sm font-bold text-green-500">
                            +{formatCurrency(bet.returns - bet.stake, currency)}
                          </p>
                        )}
                        {bet.status === 'lost' && (
                          <p className="mt-1 text-sm font-bold text-red-500">
                            -{formatCurrency(bet.stake, currency)}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center text-muted-foreground">
            <p className="text-lg">No bets yet</p>
            <p className="text-sm mt-1">Place your first bet to start this stream</p>
            <Link
              href={`/bets/new/${stream.id}`}
              className="mt-4 inline-block rounded-lg bg-primary px-6 py-2 font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Place First Bet
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}