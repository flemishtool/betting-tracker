import Link from 'next/link';
import prisma from '@/lib/prisma';
import { formatCurrency, formatPercentage, formatDate, getStatusBgColor } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function StreamsPage() {
  const streams = await prisma.stream.findMany({
    orderBy: { createdAt: 'desc' },
  });

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
              {/* Debug: Show Stream ID */}
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
              
              {/* Quick Actions */}
              <div className="mt-4 flex gap-2">
                <Link
                  href={`/streams/${stream.id}`}
                  className="rounded border px-3 py-1 text-sm hover:bg-accent"
                >
                  View Details
                </Link>
                {stream.status === 'active' && (
                  <Link
                    href={`/bets/new/${stream.id}`}
                    className="rounded bg-primary px-3 py-1 text-sm text-primary-foreground hover:bg-primary/90"
                  >
                    + Add Bet
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}