import Link from 'next/link';
import prisma from '@/lib/prisma';
import { formatCurrency, formatDate, getStatusBgColor } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function BetsPage() {
  let bets: any[] = [];
  let error = '';

  try {
    bets = await prisma.bet.findMany({
      include: {
        stream: true,
        selections: true,
      },
      orderBy: { placedAt: 'desc' },
      take: 100,
    });
  } catch (e) {
    console.error('Error loading bets:', e);
    error = 'Failed to load bets';
  }

  const pendingBets = bets.filter(b => b.status === 'pending');
  const wonBets = bets.filter(b => b.status === 'won');
  const lostBets = bets.filter(b => b.status === 'lost');

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Bets</h1>
        <div className="rounded-xl border border-red-500 bg-red-500/10 p-6 text-center">
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Bets</h1>
        <p className="text-muted-foreground">
          {bets.length} total • {pendingBets.length} pending • {wonBets.length} won • {lostBets.length} lost
        </p>
      </div>

      {pendingBets.length > 0 && (
        <div className="rounded-xl border-2 border-yellow-500/50 bg-yellow-500/10 p-4">
          <h2 className="font-semibold text-yellow-500">
            ⏳ {pendingBets.length} Pending Bet{pendingBets.length !== 1 ? 's' : ''} to Settle
          </h2>
          <p className="text-sm text-muted-foreground">
            Click &quot;Settle&quot; after matches finish to record results
          </p>
        </div>
      )}

      {bets.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center">
          <p className="text-xl text-muted-foreground">No bets placed yet</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Create a stream and place your first bet to get started
          </p>
          <Link 
            href="/streams" 
            className="mt-4 inline-block rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
          >
            Go to Streams
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {pendingBets.length > 0 && (
            <section>
              <h2 className="mb-4 text-xl font-semibold text-yellow-500">📋 Pending ({pendingBets.length})</h2>
              <div className="space-y-4">
                {pendingBets.map((bet) => (
                  <BetCard key={bet.id} bet={bet} />
                ))}
              </div>
            </section>
          )}

          {wonBets.length > 0 && (
            <section>
              <h2 className="mb-4 text-xl font-semibold text-green-500">✅ Won ({wonBets.length})</h2>
              <div className="space-y-4">
                {wonBets.map((bet) => (
                  <BetCard key={bet.id} bet={bet} />
                ))}
              </div>
            </section>
          )}

          {lostBets.length > 0 && (
            <section>
              <h2 className="mb-4 text-xl font-semibold text-red-500">❌ Lost ({lostBets.length})</h2>
              <div className="space-y-4">
                {lostBets.map((bet) => (
                  <BetCard key={bet.id} bet={bet} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function BetCard({ bet }: { bet: any }) {
  const potentialReturns = bet.stake * bet.totalOdds;
  
  return (
    <div className="rounded-xl border bg-card p-5">
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
                <p className="text-muted-foreground">{sel.market}</p>
              </div>
              <div className="text-right">
                <p className="font-medium">@ {sel.odds.toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

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
            <span>Cashed: <strong className="text-green-500">{formatCurrency(bet.amountCashedOut || 0)}</strong></span>
            <span>Reinvested: <strong>{formatCurrency(bet.amountReinvested || 0)}</strong></span>
          </div>
        ) : (
          <p className="text-sm text-red-500">
            Lost: <strong>{formatCurrency(bet.stake)}</strong>
          </p>
        )}
      </div>
    </div>
  );
}