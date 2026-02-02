'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatCurrency } from '@/lib/utils';

interface BankrollManagerProps {
  bankrollId: string;
  currentBalance: number;
  availableCapital: number;
  currency: string;
}

export default function BankrollManager({
  bankrollId,
  currentBalance,
  availableCapital,
  currency,
}: BankrollManagerProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState<'deposit' | 'withdraw'>('deposit');
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const amountNum = parseFloat(amount) || 0;
  const maxWithdraw = availableCapital;
  const currencySymbol = currency === 'GBP' ? '£' : currency === 'EUR' ? '€' : '$';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (amountNum <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (type === 'withdraw' && amountNum > maxWithdraw) {
      setError(`Maximum withdrawal is ${formatCurrency(maxWithdraw, currency)}`);
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch(`/api/bankroll/${bankrollId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, amount: amountNum }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process');
      }

      setSuccess(data.message || 'Success!');
      setAmount('');
      
      setTimeout(() => {
        router.refresh();
        setIsOpen(false);
        setSuccess('');
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-xl border bg-card p-6">
      <h2 className="text-lg font-semibold mb-4">💳 Manage Bankroll</h2>
      
      <div className="space-y-3 mb-6">
        <div className="flex justify-between items-center rounded-lg bg-muted p-3">
          <span className="text-sm text-muted-foreground">Total Bankroll</span>
          <span className="font-bold text-lg">{formatCurrency(currentBalance, currency)}</span>
        </div>
        <div className="flex justify-between items-center rounded-lg bg-muted p-3">
          <span className="text-sm text-muted-foreground">Available to Withdraw</span>
          <span className="font-bold text-green-500">{formatCurrency(availableCapital, currency)}</span>
        </div>
      </div>

      {!isOpen ? (
        <div className="flex gap-2">
          <button
            onClick={() => { setType('deposit'); setIsOpen(true); setError(''); setSuccess(''); }}
            className="flex-1 rounded-lg bg-green-600 px-4 py-3 font-medium text-white hover:bg-green-700"
          >
            ➕ Add Funds
          </button>
          <button
            onClick={() => { setType('withdraw'); setIsOpen(true); setError(''); setSuccess(''); }}
            className="flex-1 rounded-lg bg-orange-600 px-4 py-3 font-medium text-white hover:bg-orange-700 disabled:opacity-50"
            disabled={availableCapital <= 0}
          >
            💸 Withdraw
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex rounded-lg border p-1">
            <button
              type="button"
              onClick={() => setType('deposit')}
              className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
                type === 'deposit' ? 'bg-green-600 text-white' : 'text-muted-foreground'
              }`}
            >
              ➕ Deposit
            </button>
            <button
              type="button"
              onClick={() => setType('withdraw')}
              className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
                type === 'withdraw' ? 'bg-orange-600 text-white' : 'text-muted-foreground'
              }`}
            >
              💸 Withdraw
            </button>
          </div>

          <p className="text-sm text-muted-foreground">
            {type === 'deposit' 
              ? 'Add funds to your betting bankroll'
              : 'Withdraw from available capital'
            }
          </p>

          <div>
            <label className="block text-sm font-medium mb-1">Amount</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {currencySymbol}
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={type === 'withdraw' ? maxWithdraw : undefined}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-lg border bg-background pl-8 pr-4 py-3 text-lg"
                placeholder="0.00"
                autoFocus
              />
            </div>
            {type === 'withdraw' && (
              <p className="mt-1 text-xs text-muted-foreground">
                Max: {formatCurrency(maxWithdraw, currency)}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {type === 'deposit' ? (
              [50, 100, 200, 500].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setAmount(preset.toString())}
                  className="rounded-lg border px-3 py-1 text-sm hover:bg-accent"
                >
                  {formatCurrency(preset, currency)}
                </button>
              ))
            ) : (
              [0.25, 0.5, 0.75, 1].map((fraction) => (
                <button
                  key={fraction}
                  type="button"
                  onClick={() => setAmount((maxWithdraw * fraction).toFixed(2))}
                  className="rounded-lg border px-3 py-1 text-sm hover:bg-accent"
                  disabled={maxWithdraw <= 0}
                >
                  {fraction === 1 ? 'Max' : `${fraction * 100}%`}
                </button>
              ))
            )}
          </div>

          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-500">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-3 text-sm text-green-500">
              {success}
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setIsOpen(false); setAmount(''); setError(''); setSuccess(''); }}
              className="flex-1 rounded-lg border py-3 font-medium hover:bg-accent"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || amountNum <= 0}
              className={`flex-1 rounded-lg py-3 font-bold text-white disabled:opacity-50 ${
                type === 'deposit' ? 'bg-green-600 hover:bg-green-700' : 'bg-orange-600 hover:bg-orange-700'
              }`}
            >
              {isSubmitting ? 'Processing...' : `${type === 'deposit' ? 'Add' : 'Withdraw'} ${formatCurrency(amountNum, currency)}`}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}