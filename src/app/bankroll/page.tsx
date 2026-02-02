import prisma from '@/lib/prisma';
import { formatCurrency } from '@/lib/utils';
import BankrollManager from '@/components/BankrollManager';
import Link from 'next/link';

export default async function BankrollPage() {
  let bankroll = null;
  let streams: { id: string; name: string; currentBalance: number; currentDay: number }[] = [];
  let recentBets: { id: string; status: string; stake: number; returns: number | null; settledAt: Date | null; stream: { name: string } }[] = [];

  try {
    [bankroll, streams, recentBets] = await Promise.all([
      prisma.bankroll.findFirst(),
      prisma.stream.findMany({
        where: { status: 'active' },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          currentBalance: true,
          currentDay: true,
        },
      }),
      prisma.bet.findMany({
        where: { status: { in: ['won', 'lost'] } },
        include: { stream: { select: { name: true } } },
        orderBy: { settledAt: 'desc' },
        take: 10,
      }),
    ]);
  } catch (error) {
    console.error('Error fetching bankroll data:', error);
  }

  if (!bankroll) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="text-6xl mb-4">💰</div>
        <h1 className="text-2xl font-bold mb-4">No Bankroll Found</h1>
        <p className="text-muted-foreground mb-6">Set up your bankroll in Settings first.</p>
        <Link 
          href="/settings" 
          className="rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground hover:bg-primary/90"
        >
          Go to Settings
        </Link>
      </div>
    );
  }

  const totalBankroll = bankroll.totalCapital;
  const availableCapital = bankroll.availableCapital;
  const deployedCapital = bankroll.deployedCapital;
  
  // Calculate profit: current total - total deposited + total withdrawn
  const totalProfit = totalBankroll - bankroll.totalDeposited + bankroll.totalWithdrawn;

  const deploymentPercent = totalBankroll > 0 
    ? (deployedCapital / totalBankroll) * 100 
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">💰 Bankroll Management</h1>
        <p className="text-muted-foreground">Track and manage your betting capital</p>
      </div>

      {/* Main Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-gradient-to-br from-primary/20 to-primary/5 p-6">
          <p className="text-sm text-muted-foreground">Total Bankroll</p>
          <p className="mt-1 text-3xl font-bold text-primary">
            {formatCurrency(totalBankroll, bankroll.currency)}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Deposited: {formatCurrency(bankroll.totalDeposited, bankroll.currency)}
          </p>
        </div>

        <div className="rounded-xl border bg-gradient-to-br from-green-500/20 to-green-500/5 p-6">
          <p className="text-sm text-muted-foreground">Available Capital</p>
          <p className="mt-1 text-3xl font-bold text-green-500">
            {formatCurrency(availableCapital, bankroll.currency)}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Ready to deploy
          </p>
        </div>

        <div className="rounded-xl border bg-gradient-to-br from-blue-500/20 to-blue-500/5 p-6">
          <p className="text-sm text-muted-foreground">Deployed in Streams</p>
          <p className="mt-1 text-3xl font-bold text-blue-500">
            {formatCurrency(deployedCapital, bankroll.currency)}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            {deploymentPercent.toFixed(1)}% of bankroll
          </p>
        </div>

        <div className={`rounded-xl border p-6 ${
          totalProfit >= 0 
            ? 'bg-gradient-to-br from-green-500/20 to-green-500/5' 
            : 'bg-gradient-to-br from-red-500/20 to-red-500/5'
        }`}>
          <p className="text-sm text-muted-foreground">Total Profit/Loss</p>
          <p className={`mt-1 text-3xl font-bold ${totalProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {totalProfit >= 0 ? '+' : ''}{formatCurrency(totalProfit, bankroll.currency)}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Withdrawn: {formatCurrency(bankroll.totalWithdrawn, bankroll.currency)}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Bankroll Manager */}
        <BankrollManager
          bankrollId={bankroll.id}
          currentBalance={totalBankroll}
          availableCapital={availableCapital}
          currency={bankroll.currency}
        />

        {/* Active Streams */}
        <div className="rounded-xl border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">📊 Capital Deployment</h2>
          
          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Deployment Rate</span>
              <span className="font-medium">{deploymentPercent.toFixed(1)}%</span>
            </div>
            <div className="h-4 rounded-full bg-muted overflow-hidden">
              <div 
                className="h-full bg-blue-500 rounded-full transition-all"
                style={{ width: `${Math.min(deploymentPercent, 100)}%` }}
              />
            </div>
          </div>

          <h3 className="text-sm font-medium text-muted-foreground mb-3">Active Streams</h3>
          {streams.length > 0 ? (
            <div className="space-y-3">
              {streams.map((stream) => (
                <Link
                  key={stream.id}
                  href={`/streams/${stream.id}`}
                  className="flex items-center justify-between rounded-lg border bg-muted/50 p-3 hover:bg-muted transition-colors"
                >
                  <div>
                    <p className="font-medium">{stream.name}</p>
                    <p className="text-xs text-muted-foreground">Day {stream.currentDay + 1}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-500">
                      {formatCurrency(stream.currentBalance, bankroll.currency)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-sm text-muted-foreground mb-3">No active streams</p>
              <Link
                href="/streams"
                className="text-sm text-primary hover:underline"
              >
                Create a stream →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="rounded-xl border bg-card p-6">
        <h2 className="text-lg font-semibold mb-4">📜 Recent Activity</h2>
        
        {recentBets.length > 0 ? (
          <div className="space-y-3">
            {recentBets.map((bet) => (
              <div
                key={bet.id}
                className={`flex items-center justify-between rounded-lg border p-3 ${
                  bet.status === 'won'
                    ? 'border-green-500/30 bg-green-500/5'
                    : 'border-red-500/30 bg-red-500/5'
                }`}
              >
                <div>
                  <p className="font-medium">{bet.stream.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {bet.settledAt && new Date(bet.settledAt).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <div className="text-right">
                  {bet.status === 'won' ? (
                    <p className="font-bold text-green-500">
                      +{formatCurrency((bet.returns || 0) - bet.stake, bankroll.currency)}
                    </p>
                  ) : (
                    <p className="font-bold text-red-500">
                      -{formatCurrency(bet.stake, bankroll.currency)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-8 text-center">No recent activity</p>
        )}
      </div>
    </div>
  );
}