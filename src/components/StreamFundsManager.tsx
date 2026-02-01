'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatCurrency } from '@/lib/utils';

interface StreamFundsManagerProps {
  streamId: string;
  streamName: string;
  currentBalance: number;
  availableBankroll: number;
  currency?: string;
}

export default function StreamFundsManager({
  streamId,
  streamName,
  currentBalance,
  availableBankroll,
  currency = 'GBP',
}: StreamFundsManagerProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState<'deposit' | 'withdraw'>('deposit');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const amountNum = parseFloat(amount) || 0;
  const maxAmount = type === 'deposit' ? availableBankroll : currentBalance;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (amountNum <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (amountNum > maxAmount) {
      setError(`Maximum ${type} amount is ${formatCurrency(maxAmount, currency)}`);
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`/api/streams/${streamId}/funds`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, amount: amountNum, note }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process transaction');
      }

      setSuccess(data.message);
      setAmount('');
      setNote('');
      
      // Refresh the page data
      setTimeout(() => {
        router.refresh();
        setIsOpen(false);
        setSuccess('');
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Trigger Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => { setType('deposit'); setIsOpen(true); setError(''); setSuccess(''); }}
          className="flex-1 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
        >
          ➕ Add Funds
        </button>
        <button
          onClick={() => { setType('withdraw'); setIsOpen(true); setError(''); setSuccess(''); }}
          className="flex-1 rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700"
        >
          💸 Withdraw
        </button>
      </div>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">
                {type === 'deposit' ? '➕ Add Funds' : '💸 Withdraw Funds'}
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-2 hover:bg-accent"
              >
                ✕
              </button>
            </div>

            <p className="text-sm text-muted-foreground mb-4">
              {type === 'deposit' 
                ? `Add funds to "${streamName}" from your bankroll`
                : `Withdraw funds from "${streamName}" to your bankroll`
              }
            </p>

            {/* Balance Info */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="rounded-lg bg-muted p-3">
                <p className="text-xs text-muted-foreground">Stream Balance</p>
                <p className="text-lg font-bold">{formatCurrency(currentBalance, currency)}</p>
              </div>
              <div className="rounded-lg bg-muted p-3">
                <p className="text-xs text-muted-foreground">Available Bankroll</p>
                <p className="text-lg font-bold">{formatCurrency(availableBankroll, currency)}</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Type Toggle */}
              <div className="flex rounded-lg border p-1">
                <button
                  type="button"
                  onClick={() => setType('deposit')}
                  className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
                    type === 'deposit' 
                      ? 'bg-green-600 text-white' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Deposit
                </button>
                <button
                  type="button"
                  onClick={() => setType('withdraw')}
                  className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
                    type === 'withdraw' 
                      ? 'bg-orange-600 text-white' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Withdraw
                </button>
              </div>

              {/* Amount Input */}
              <div>
                <label className="block text-sm font-medium mb-1">Amount</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">£</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={maxAmount}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full rounded-lg border bg-background pl-8 pr-4 py-3 text-lg"
                    placeholder="0.00"
                    autoFocus
                  />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Max: {formatCurrency(maxAmount, currency)}
                </p>
              </div>

              {/* Quick Amount Buttons */}
              <div className="flex flex-wrap gap-2">
                {[0.25, 0.5, 0.75, 1].map((fraction) => (
                  <button
                    key={fraction}
                    type="button"
                    onClick={() => setAmount((maxAmount * fraction).toFixed(2))}
                    className="rounded-lg border px-3 py-1 text-sm hover:bg-accent"
                  >
                    {fraction === 1 ? 'Max' : `${fraction * 100}%`}
                  </button>
                ))}
              </div>

              {/* Note Input */}
              <div>
                <label className="block text-sm font-medium mb-1">Note (optional)</label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full rounded-lg border bg-background px-4 py-2"
                  placeholder="e.g., Adding more capital for weekend bets"
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-500">
                  {error}
                </div>
              )}

              {/* Success Message */}
              {success && (
                <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-3 text-sm text-green-500">
                  {success}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || amountNum <= 0}
                className={`w-full rounded-lg py-3 font-bold text-white disabled:opacity-50 ${
                  type === 'deposit' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-orange-600 hover:bg-orange-700'
                }`}
              >
                {isSubmitting 
                  ? 'Processing...' 
                  : `${type === 'deposit' ? 'Add' : 'Withdraw'} ${formatCurrency(amountNum, currency)}`
                }
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}