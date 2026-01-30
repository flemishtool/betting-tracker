import Link from 'next/link';
import prisma from '@/lib/prisma';
import { formatCurrency, formatPercentage } from '@/lib/utils';

export const dynamic = 'force-dynamic';

async function getDashboardData() {
  const [bankroll, activeStreams, allStreams] = await Promise.all([
    prisma.bankroll.findFirst(),
    prisma.stream.findMany({ where: { status: 'active' } }),
    prisma.stream.findMany(),
  ]);

  const totalBalance = activeStreams.reduce((sum, s) => sum + s.currentBalance, 0);
  const totalCashedOut = allStreams.reduce((sum, s) => sum + s.totalCashedOut, 0);
  const totalBets = allStreams.reduce((sum, s) => sum + s.totalBets, 0);
  const wonBets = allStreams.reduce((sum, s) => sum + s.wonBets, 0);

  return {
    bankroll,
    activeStreams,
    totalBalance,
    totalCashedOut,
    winRate: totalBets > 0 ? wonBets / totalBets : 0,
  };
}

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your betting streams</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border bg-card p-6">
          <p className="text-sm text-muted-foreground">Total Bankroll</p>
          <p className="text-2xl font-bold">
            {formatCurrency(data.bankroll?.totalCapital || 0)}
          </p>
        </div>
        <div className="rounded-xl border bg-card p-6">
          <p className="text-sm text-muted-foreground">Active Streams</p>
          <p className="text-2xl font-bold">{data.activeStreams.length}</p>
          <p className="text-sm text-muted-foreground">
            Balance: {formatCurrency(data.totalBalance)}
          </p>
        </div>
        <div className="rounded-xl border bg-card p-6">
          <p className="text-sm text-muted-foreground">Total Cashed Out</p>
          <p className="text-2xl font-bold text-green-500">
            {formatCurrency(data.totalCashedOut)}
          </p>
        </div>
        <div className="rounded-xl border bg-card p-6">
          <p className="text-sm text-muted-foreground">Win Rate</p>
          <p className="text-2xl font-bold">{formatPercentage(data.winRate)}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-xl border bg-card p-6">
        <h2 className="mb-4 text-xl font-semibold">Quick Actions</h2>
        <div className="flex gap-4">
          <Link
            href="/streams/new"
            className="rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
          >
            + New Stream
          </Link>
          <Link
            href="/bankroll"
            className="rounded-lg border px-4 py-2 hover:bg-accent"
          >
            Manage Bankroll
          </Link>
        </div>
      </div>

      {/* Active Streams */}
      <div className="rounded-xl border bg-card p-6">
        <h2 className="mb-4 text-xl font-semibold">Active Streams</h2>
        {data.activeStreams.length === 0 ? (
          <p className="text-muted-foreground">
            No active streams.{' '}
            <Link href="/streams/new" className="text-primary underline">
              Create your first stream
            </Link>
          </p>
        ) : (
          <div className="space-y-4">
            {data.activeStreams.map((stream) => (
              <Link
                key={stream.id}
                href={`/streams/${stream.id}`}
                className="block rounded-lg border p-4 hover:bg-accent"
              >
                <div className="flex justify-between">
                  <div>
                    <p className="font-semibold">{stream.name}</p>
                    <p className="text-sm text-muted-foreground">Day {stream.currentDay}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(stream.currentBalance)}</p>
                    <p className="text-sm text-green-500">
                      +{formatCurrency(stream.totalCashedOut)} cashed
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}