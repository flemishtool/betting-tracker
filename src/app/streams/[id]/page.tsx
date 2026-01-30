import Link from 'next/link';
import prisma from '@/lib/prisma';
import { formatCurrency, formatPercentage, formatDate, getStatusBgColor } from '@/lib/utils';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: { id: string };
}

export default async function StreamDetailPage({ params }: PageProps) {
  const stream = await prisma.stream.findUnique({
    where: { id: params.id },
    include: { 
      bets: { 
        include: { selections: true }, 
        orderBy: { dayNumber: 'desc' } 
      } 
    },
  });

  if (!stream) {
    notFound();
  }

  const totalValue = stream.currentBalance + stream.totalCashedOut;
  const profit = totalValue - stream.initialStake;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link 
            href="/streams" 
            className="rounded-lg border px-3 py-1 text-sm hover:bg-accent"
          >
            ← Back
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{stream.name}</h1>
              <span className={`rounded-full px-3 py-1 text-sm font-medium ${getStatusBgColor(stream.status)}`}>
                {stream.status}
              </span>
            </div>
            <p className="text-muted-foreground">
              Day {stream.currentDay} • Started {formatDate(stream.startedAt)}
            </p>
          </div>
        </div>
        
        {stream.status === 'active' && (
          <Link
            href={`/bets/new/${stream.id}`}
            className="rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground hover:bg-primary/90"
          >
            + Add Today's Bet
          </Link>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-card p-6">
          <p className="text-sm text-muted-foreground">Current Balance</p>
          <p className="text-2xl font-bold">{formatCurrency(stream.currentBalance)}</p>
          <p className="text-xs text-muted-foreground">
            From {formatCurrency(stream.initialStake)} initial
          </p>
        </div>
        
        <div className="rounded-xl border bg-card p-6">
          <p className="text-sm text-muted-foreground">Total Cashed Out</p>
          <p className="text-2xl font-bold text-green-500">
            {formatCurrency(stream.totalCashedOut)}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatPercentage(stream.cashoutPercentage)} per win
          </p>
        </div>
        
        <div className="rounded-xl border bg-card p-6">
          <p className="text-sm text-muted-foreground">Win Rate</p>
          <p className="text-2xl font-bold">{formatPercentage(stream.actualWinRate)}</p>
          <p className="text-xs text-muted-foreground">
            {stream.wonBets}W / {stream.lostBets}L of {stream.totalBets} bets
          </p>
        </div>
        
        <div className="rounded-xl border bg-card p-6">
          <p className="text-sm text-muted-foreground">Total Value</p>
          <p className="text-2xl font-bold">{formatCurrency(totalValue)}</p>
          <p className={`text-xs ${profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {profit >= 0 ? '+' : ''}{formatCurrency(profit)} profit
          </p>
        </div>
      </div>

      {/* Stream Configuration */}
      <div className="rounded-xl border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold">Configuration</h2>
        <div className="grid gap-4 text-sm md:grid-cols-4">
          <div>
            <p className="text-muted-foreground">Initial Stake</p>
            <p className="font-medium">{formatCurrency(stream.initialStake)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Target Daily Odds</p>
            <p className="font-medium">{stream.targetDailyOdds.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Reinvestment</p>
            <p className="font-medium">{formatPercentage(stream.reinvestmentPercentage)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Cashout</p>
            <p className="font-medium">{formatPercentage(stream.cashoutPercentage)}</p>
          </div>
        </div>
      </div>

      {/* Bet History */}
      <div className="rounded-xl border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold">Bet History</h2>
        
        {stream.bets.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-muted-foreground">No bets placed yet</p>
            {stream.status === 'active' && (
              <Link
                href={`/bets/new/${stream.id}`}
                className="mt-4 inline-block rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
              >
                Place First Bet
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {stream.bets.map((bet) => (
              <div key={bet.id} className="rounded-lg border p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-lg bg-muted px-2 py-1 text-sm font-bold">
                        Day {bet.dayNumber}
                      </span>
                      <span className={`rounded-full px-2 py-0.5 text-xs ${getStatusBgColor(bet.status)}`}>
                        {bet.status}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {bet.selections.length} selection{bet.selections.length !== 1 ? 's' : ''} @ {bet.totalOdds.toFixed(2)} odds
                    </p>
                    <p className="text-xs text-muted-foreground">{formatDate(bet.date)}</p>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-medium">Stake: {formatCurrency(bet.stake)}</p>
                    {bet.status === 'won' && bet.profit !== null && (
                      <p className="text-green-500">+{formatCurrency(bet.profit)}</p>
                    )}
                    {bet.status === 'lost' && (
                      <p className="text-red-500">-{formatCurrency(bet.stake)}</p>
                    )}
                    {bet.status === 'won' && bet.amountCashedOut !== null && (
                      <p className="text-xs text-muted-foreground">
                        Cashed: {formatCurrency(bet.amountCashedOut)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Selections */}
                {bet.selections.length > 0 && (
                  <div className="mt-4 space-y-2 border-t pt-4">
                    {bet.selections.map((sel) => (
                      <div 
                        key={sel.id} 
                        className={`flex items-center justify-between rounded-lg p-2 text-sm ${
                          sel.status === 'won' 
                            ? 'bg-green-500/10 border-l-2 border-green-500' 
                            : sel.status === 'lost'
                            ? 'bg-red-500/10 border-l-2 border-red-500'
                            : 'bg-muted/50 border-l-2 border-yellow-500'
                        }`}
                      >
                        <div>
                          <p className="font-medium">{sel.homeTeam} vs {sel.awayTeam}</p>
                          <p className="text-xs text-muted-foreground">
                            {sel.market}: {sel.selection}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">@ {sel.odds.toFixed(2)}</p>
                          <p className={`text-xs ${getStatusBgColor(sel.status)} rounded px-1`}>
                            {sel.status}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Settlement details for won bets */}
                {bet.status === 'won' && bet.returns !== null && (
                  <div className="mt-4 rounded-lg bg-muted/50 p-3 text-sm">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-muted-foreground">Returns</p>
                        <p className="font-medium">{formatCurrency(bet.returns)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Reinvested</p>
                        <p className="font-medium">{formatCurrency(bet.amountReinvested || 0)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Cashed Out</p>
                        <p className="font-medium text-green-500">{formatCurrency(bet.amountCashedOut || 0)}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}