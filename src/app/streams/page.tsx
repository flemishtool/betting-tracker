import Link from 'next/link';
import prisma from '@/lib/prisma';
import { formatCurrency, formatDate, getStatusBgColor } from '@/lib/utils';
import StreamSelector from './StreamSelector';

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: Promise<{ betSlip?: string }>;
}

export default async function StreamsPage({ searchParams }: Props) {
  const params = await searchParams;
  const betSlipParam = params.betSlip;
  
  const streams = await prisma.stream.findMany({
    where: { status: 'active' },
    orderBy: { createdAt: 'desc' },
  });

  // If we have a betSlip, show the stream selector
  if (betSlipParam) {
    let betSlip: Array<{
      fixtureId: string;
      fixture: string;
      market: string;
      odds: number;
      league: string;
    }> = [];
    
    try {
      betSlip = JSON.parse(betSlipParam);
    } catch (e) {
      // Invalid JSON, ignore
    }

    if (betSlip.length > 0) {
      return (
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">Select Stream for Bet</h1>
          
          <div className="bg-card border rounded-xl p-6 mb-6">
            <h2 className="font-semibold mb-3">Your Selections ({betSlip.length})</h2>
            <div className="space-y-2">
              {betSlip.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-sm bg-muted/50 rounded p-2">
                  <div>
                    <div className="text-muted-foreground">{item.league}</div>
                    <div>{item.fixture}</div>
                    <div className="text-primary">{item.market}</div>
                  </div>
                  <div className="font-bold">{item.odds.toFixed(2)}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t flex justify-between items-center">
              <span>Total Odds:</span>
              <span className="text-xl font-bold text-primary">
                {betSlip.reduce((acc, item) => acc * item.odds, 1).toFixed(2)}
              </span>
            </div>
          </div>

          <StreamSelector streams={streams} betSlip={betSlipParam} />
        </div>
      );
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Streams</h1>
        <Link
          href="/streams/new"
          className="rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
        >
          + New Stream
        </Link>
      </div>

      {streams.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center">
          <p className="text-muted-foreground">No streams yet</p>
          <Link href="/streams/new" className="mt-4 inline-block text-primary underline">
            Create your first stream
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {streams.map((stream) => (
            <div key={stream.id} className="rounded-xl border bg-card p-6">
              <p className="mb-2 text-xs text-muted-foreground font-mono">
                ID: {stream.id}
              </p>

              <Link
                href={`/streams/${stream.id}`}
                className="block hover:opacity-80"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold">{stream.name}</h3>
                      <span className={`rounded-full px-2 py-0.5 text-xs ${getStatusBgColor(stream.status)}`}>
                        {stream.status}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Day {stream.currentDay} • Started {formatDate(stream.startedAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold">{formatCurrency(stream.currentBalance)}</p>
                    <p className="text-sm text-green-500">+{formatCurrency(stream.totalCashedOut)} cashed</p>
                  </div>
                </div>
              </Link>

              <div className="mt-4 flex gap-2">
                <Link
                  href={`/streams/${stream.id}`}
                  className="rounded-lg border bg-background px-3 py-1.5 text-sm hover:bg-muted"
                >
                  View Details
                </Link>
                <Link
                  href={`/bets/new/${stream.id}`}
                  className="rounded-lg border bg-background px-3 py-1.5 text-sm hover:bg-muted"
                >
                  + Add Bet
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
