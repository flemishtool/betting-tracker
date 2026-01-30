'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';

interface Selection {
  id: string;
  homeTeam: string;
  awayTeam: string;
  market: string;
  selection: string;
  odds: number;
  status: string;
}

interface Bet {
  id: string;
  streamId: string;
  dayNumber: number;
  stake: number;
  totalOdds: number;
  status: string;
  stream: {
    id: string;
    name: string;
    currency: string;
    reinvestmentPercentage: number;
    cashoutPercentage: number;
  } | null;
  selections: Selection[];
}

export default function SettleBetPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [bet, setBet] = useState<Bet | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [selectionStatuses, setSelectionStatuses] = useState<Record<string, string>>({});

  useEffect(() => {
    async function fetchBet() {
      try {
        const res = await fetch(`/api/bets/${params.id}`);
        if (!res.ok) throw new Error('Bet not found');
        const data = await res.json();
        setBet(data);
        
        const initialStatuses: Record<string, string> = {};
        data.selections.forEach((sel: Selection) => {
          initialStatuses[sel.id] = sel.status === 'pending' ? 'won' : sel.status;
        });
        setSelectionStatuses(initialStatuses);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load bet');
      } finally {
        setLoading(false);
      }
    }
    fetchBet();
  }, [params.id]);

  const handleSubmit = async () => {
    if (!bet) return;
    
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch(`/api/bets/${bet.id}/settle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selections: Object.entries(selectionStatuses).map(([id, status]) => ({
            id,
            status,
          })),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to settle bet');
      }

      router.push(`/streams/${bet.streamId}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to settle bet');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-muted-foreground">Loading bet...</p>
      </div>
    );
  }

  if (!bet) {
    return (
      <div className="flex h-96 flex-col items-center justify-center">
        <p className="text-red-500">{error || 'Bet not found'}</p>
        <Link href="/bets" className="mt-4 text-primary underline">Back to bets</Link>
      </div>
    );
  }

  if (bet.status !== 'pending') {
    return (
      <div className="flex h-96 flex-col items-center justify-center">
        <p className="text-muted-foreground">This bet has already been settled</p>
        <Link href={`/streams/${bet.streamId}`} className="mt-4 text-primary underline">
          Back to stream
        </Link>
      </div>
    );
  }

  const anyLost = Object.values(selectionStatuses).some(s => s === 'lost');
  const potentialReturns = bet.stake * bet.totalOdds;
  const cashoutAmount = potentialReturns * (bet.stream?.cashoutPercentage || 0.2);
  const reinvestAmount = potentialReturns * (bet.stream?.reinvestmentPercentage || 0.8);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Link 
          href={`/streams/${bet.streamId}`}
          className="rounded-lg border px-3 py-1 text-sm hover:bg-accent"
        >
          ← Back
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Settle Bet</h1>
          <p className="text-muted-foreground">
            {bet.stream?.name} - Day {bet.dayNumber}
          </p>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-6">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-sm text-muted-foreground">Stake</p>
            <p className="text-xl font-bold">{formatCurrency(bet.stake)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Odds</p>
            <p className="text-xl font-bold">{bet.totalOdds.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Potential Returns</p>
            <p className="text-xl font-bold text-green-500">{formatCurrency(potentialReturns)}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => {
            const newStatuses: Record<string, string> = {};
            bet.selections.forEach(sel => { newStatuses[sel.id] = 'won'; });
            setSelectionStatuses(newStatuses);
          }}
          className="flex-1 rounded-lg border border-green-500 py-2 text-green-500 hover:bg-green-500/10"
        >
          Mark All Won ✓
        </button>
        <button
          onClick={() => {
            const newStatuses: Record<string, string> = {};
            bet.selections.forEach(sel => { newStatuses[sel.id] = 'lost'; });
            setSelectionStatuses(newStatuses);
          }}
          className="flex-1 rounded-lg border border-red-500 py-2 text-red-500 hover:bg-red-500/10"
        >
          Mark All Lost ✗
        </button>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Mark each selection:</h2>
        
        {bet.selections.map((sel) => (
          <div key={sel.id} className="rounded-xl border bg-card p-4">
            <div className="mb-3">
              <p className="font-medium">{sel.homeTeam} vs {sel.awayTeam}</p>
              <p className="text-sm text-muted-foreground">
                {sel.market} @ {sel.odds.toFixed(2)}
              </p>
            </div>
            
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSelectionStatuses(prev => ({ ...prev, [sel.id]: 'won' }))}
                className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
                  selectionStatuses[sel.id] === 'won'
                    ? 'bg-green-500 text-white'
                    : 'border border-green-500 text-green-500 hover:bg-green-500/10'
                }`}
              >
                ✓ Won
              </button>
              <button
                type="button"
                onClick={() => setSelectionStatuses(prev => ({ ...prev, [sel.id]: 'lost' }))}
                className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
                  selectionStatuses[sel.id] === 'lost'
                    ? 'bg-red-500 text-white'
                    : 'border border-red-500 text-red-500 hover:bg-red-500/10'
                }`}
              >
                ✗ Lost
              </button>
              <button
                type="button"
                onClick={() => setSelectionStatuses(prev => ({ ...prev, [sel.id]: 'void' }))}
                className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
                  selectionStatuses[sel.id] === 'void'
                    ? 'bg-gray-500 text-white'
                    : 'border border-gray-500 text-gray-500 hover:bg-gray-500/10'
                }`}
              >
                Void
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className={`rounded-xl border-2 p-6 ${
        anyLost ? 'border-red-500 bg-red-500/10' : 'border-green-500 bg-green-500/10'
      }`}>
        <h3 className="mb-2 text-lg font-semibold">
          {anyLost ? '❌ BET LOST' : '✅ BET WON'}
        </h3>
        {anyLost ? (
          <div className="text-red-500">
            <p>The stream will be marked as <strong>FAILED</strong></p>
            <p className="text-sm mt-1">Loss: {formatCurrency(bet.stake)}</p>
          </div>
        ) : (
          <div className="space-y-1 text-sm">
            <p>Returns: <strong>{formatCurrency(potentialReturns)}</strong></p>
            <p>Reinvest: <strong>{formatCurrency(reinvestAmount)}</strong></p>
            <p className="text-green-500">Cashout: <strong>{formatCurrency(cashoutAmount)}</strong></p>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-lg bg-red-500/20 p-4 text-red-500">{error}</div>
      )}

      <div className="flex gap-4">
        <Link
          href={`/streams/${bet.streamId}`}
          className="rounded-lg border px-6 py-3 hover:bg-accent"
        >
          Cancel
        </Link>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className={`flex-1 rounded-lg py-3 font-medium text-white ${
            anyLost 
              ? 'bg-red-500 hover:bg-red-600' 
              : 'bg-green-500 hover:bg-green-600'
          } disabled:opacity-50`}
        >
          {submitting ? 'Settling...' : anyLost ? 'Confirm Loss' : 'Confirm Win'}
        </button>
      </div>
    </div>
  );
}