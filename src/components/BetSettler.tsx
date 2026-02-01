'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatCurrency } from '@/lib/utils';

interface BetSettlerProps {
  betId: string;
  stake: number;
  totalOdds: number;
}

export default function BetSettler({ betId, stake, totalOdds }: BetSettlerProps) {
  const router = useRouter();
  const [isSettling, setIsSettling] = useState(false);

  const potentialReturns = stake * totalOdds;

  const handleSettle = async (result: 'won' | 'lost') => {
    setIsSettling(true);

    try {
      const response = await fetch(`/api/bets/${betId}/settle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ result }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to settle bet');
      }

      router.refresh();
    } catch (error) {
      console.error('Error settling bet:', error);
      alert('Failed to settle bet');
    } finally {
      setIsSettling(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => handleSettle('won')}
        disabled={isSettling}
        className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
      >
        ✓ Won
      </button>
      <button
        onClick={() => handleSettle('lost')}
        disabled={isSettling}
        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
      >
        ✗ Lost
      </button>
    </div>
  );
}