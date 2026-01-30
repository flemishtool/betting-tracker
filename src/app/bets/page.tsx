import Link from 'next/link';
import prisma from '@/lib/prisma';
import { formatCurrency, formatDate } from '@/lib/utils';
import BetFilters from './BetFilters';

export const dynamic = 'force-dynamic';

// Helper function to get status background color
function getStatusBgColor(status: string): string {
  switch (status) {
    case 'won':
      return 'bg-green-500/20 text-green-500';
    case 'lost':
      return 'bg-red-500/20 text-red-500';
    case 'pending':
      return 'bg-yellow-500/20 text-yellow-500';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

export default async function BetsPage({
  searchParams,
}: {
  searchParams: { status?: string; stream?: string; search?: string };
}) {
  const { status, stream, search } = searchParams;

  // First, get all bets with basic filters
  const where: any = {};
  
  if (status && status !== 'all') {
    where.status = status;
  }
  
  if (stream && stream !== 'all') {
    where.streamId = stream;
  }

  let bets = await prisma.bet.findMany({
    where,
    include: {
      stream: true,
      selections: {
        include: {
          league: true,
        },
      },
    },
    orderBy: { placedAt: 'desc' },
    take: 100,
  });

  // Filter by search term in JavaScript (SQLite doesn't support case-insensitive search)
  if (search && search.trim()) {
    const searchLower = search.toLowerCase().trim();
    bets = bets.filter(bet => 
      bet.selections?.some(sel => 
        sel.homeTeam.toLowerCase().includes(searchLower) ||
        sel.awayTeam.toLowerCase().includes(searchLower) ||
        sel.market.toLowerCase().includes(searchLower) ||
        sel.league?.name.toLowerCase().includes(searchLower)
      )
    );
  }

  const streams = await prisma.stream.findMany({
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });

  const totalBets = bets.length;
  const pendingBets = bets.filter(b => b.status === 'pending');
  const wonBets = bets.filter(b => b.status === 'won');
  const lostBets = bets.filter(b => b.status === 'lost');

  // Calculate totals
  const totalStaked = bets.reduce((sum, b) => sum + b.stake, 0);
  const totalReturns = wonBets.reduce((sum, b) => sum + (b.returns || 0), 0);
  const totalProfit = wonBets.reduce((sum, b) => sum + ((b.returns || 0) - b.stake), 0) - 
                      lostBets.reduce((sum, b) => sum + b.stake, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Bets</h1>
        <p className="text-muted-foreground">
          {totalBets} bets • {formatCurrency(totalStaked)} staked • 
          <span className={totalProfit >= 0 ? ' text-green-500' : ' text-red-500'}>
            {' '}{totalProfit >= 0 ? '+' : ''}{formatCurrency(totalProfit)} profit
          </span>
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border bg-card p-4 text-center">
          <p className="text-2xl font-bold">{totalBets}</p>
          <p className="text-sm text-muted-foreground">Total Bets</p>
        </div>
        <div className="rounded-xl border bg-yellow-500/20 p-4 text-center">
          <p className="text-2xl font-bold text-yellow-500">{pendingBets.length}</p>
          <p className="text-sm text-muted-foreground">Pending</p>
        </div>
        <div className="rounded-xl border bg-green-500/20 p-4 text-center">
          <p className="text-2xl font-bold text-green-500">{wonBets.length}</p>
          <p className="text-sm text-muted-foreground">Won</p>
        </div>
        <div className="rounded-xl border bg-red-500/20 p-4 text-center">
          <p className="text-2xl font-bold text-red-500">{lostBets.length}</p>
          <p className="text-sm text-muted-foreground">Lost</p>
        </div>
      </div>

      {/* Filters */}
      <BetFilters 
        streams={streams} 
        currentStatus={status || 'all'}
        currentStream={stream || 'all'}
        currentSearch={search || ''}
      />

      {/* Pending Alert */}
      {pendingBets.length > 0 && !status && (
        <div className="rounded-xl border-2 border-yellow-500/50 bg-yellow-500/10 p-4">
          <h2 className="font-semibold text-yellow-500">
            ⏳ {pendingBets.length} Pending Bet{pendingBets.length !== 1 ? 's' : ''} to Settle
          </h2>
          <p className="text-sm text-muted-foreground">
            Click on a bet to settle it after matches finish
          </p>
        </div>
      )}

      {/* Bets List */}
      {bets.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center">
          <p className="text-xl text-muted-foreground">
            {search || status || stream ? 'No bets match your filters' : 'No bets placed yet'}
          </p>
          {!search && !status && !stream && (
            <Link 
              href="/streams" 
              className="mt-4 inline-block rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
            >
              Go to Streams
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {bets.map(bet => (
            <BetCard key={bet.id} bet={bet} />
          ))}
        </div>
      )}
    </div>
  );
}

function BetCard({ bet }: { bet: any }) {
  const potentialReturns = bet.stake * bet.totalOdds;

  return (
    <div className="rounded-xl border bg-card p-5 transition-colors hover:bg-accent/30">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href={`/streams/${bet.streamId}`}
              className="font-semibold hover:underline"
            >
              {bet.stream?.name || 'Unknown Stream'}
            </Link>
            <span className="rounded bg-muted px-2 py-0.5 text-sm font-medium">
              Day {bet.dayNumber}
            </span>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getStatusBgColor(bet.status)}`}>
              {bet.status.toUpperCase()}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatDate(bet.placedAt)} • {bet.selections?.length || 0} selection{(bet.selections?.length || 0) !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="text-right">
          <p className="text-lg font-bold">{formatCurrency(bet.stake)}</p>
          <p className="text-sm text-muted-foreground">@ {bet.totalOdds.toFixed(2)}</p>
        </div>
      </div>

      {/* Selections */}
      {bet.selections && bet.selections.length > 0 && (
        <div className="mt-4 space-y-2">
          {bet.selections.map((sel: any) => (
            <div
              key={sel.id}
              className={`flex items-center justify-between rounded-lg p-3 text-sm ${
                sel.status === 'won'
                  ? 'bg-green-500/10 border-l-4 border-green-500'
                  : sel.status === 'lost'
                  ? 'bg-red-500/10 border-l-4 border-red-500'
                  : 'bg-muted/50 border-l-4 border-yellow-500'
              }`}
            >
              <div>
                <p className="font-medium">{sel.homeTeam} vs {sel.awayTeam}</p>
                <p className="text-muted-foreground">
                  {sel.league?.name || 'Unknown League'} • {sel.market}
                </p>
                <p className="text-xs text-muted-foreground">
                  🗓️ {new Date(sel.matchDate).toLocaleString('en-GB', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium">@ {sel.odds.toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between border-t pt-4">
        {bet.status === 'pending' ? (
          <>
            <p className="text-sm text-muted-foreground">
              Potential: <span className="font-medium text-green-500">{formatCurrency(potentialReturns)}</span>
            </p>
            <Link
              href={`/bets/${bet.id}/settle`}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Settle Bet
            </Link>
          </>
        ) : bet.status === 'won' ? (
          <div className="flex w-full justify-between text-sm">
            <span>Returns: <strong className="text-green-500">{formatCurrency(bet.returns || 0)}</strong></span>
            <span>Profit: <strong className="text-green-500">+{formatCurrency((bet.returns || 0) - bet.stake)}</strong></span>
          </div>
        ) : (
          <p className="text-sm text-red-500">
            Lost: <strong>-{formatCurrency(bet.stake)}</strong>
          </p>
        )}
      </div>
    </div>
  );
}