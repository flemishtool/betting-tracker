'use client';

import { useState, useEffect } from 'react';
import { formatCurrency, formatPercentage } from '@/lib/utils';

export default function BankrollPage() {
  const [bankroll, setBankroll] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [depositAmount, setDepositAmount] = useState(100);
  const [depositing, setDepositing] = useState(false);

  useEffect(() => {
    fetchBankroll();
  }, []);

  async function fetchBankroll() {
    const res = await fetch('/api/bankroll');
    const data = await res.json();
    setBankroll(data);
    setLoading(false);
  }

  async function handleDeposit() {
    if (depositAmount <= 0) return;
    setDepositing(true);
    await fetch('/api/bankroll/deposit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: depositAmount, notes: 'Manual deposit' }),
    });
    await fetchBankroll();
    setDepositing(false);
  }

  if (loading) {
    return <div className="flex h-96 items-center justify-center">Loading...</div>;
  }

  const exposurePercent = bankroll.totalCapital > 0
    ? (bankroll.deployedCapital / bankroll.totalCapital) * 100
    : 0;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Bankroll Management</h1>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border bg-card p-6">
          <p className="text-sm text-muted-foreground">Total Bankroll</p>
          <p className="text-2xl font-bold">{formatCurrency(bankroll.totalCapital)}</p>
        </div>
        <div className="rounded-xl border bg-card p-6">
          <p className="text-sm text-muted-foreground">Available</p>
          <p className="text-2xl font-bold text-green-500">{formatCurrency(bankroll.availableCapital)}</p>
        </div>
        <div className="rounded-xl border bg-card p-6">
          <p className="text-sm text-muted-foreground">Deployed</p>
          <p className="text-2xl font-bold text-yellow-500">{formatCurrency(bankroll.deployedCapital)}</p>
        </div>
        <div className="rounded-xl border bg-card p-6">
          <p className="text-sm text-muted-foreground">Lifetime P/L</p>
          <p className={`text-2xl font-bold ${bankroll.lifetimeProfitLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {bankroll.lifetimeProfitLoss >= 0 ? '+' : ''}{formatCurrency(bankroll.lifetimeProfitLoss)}
          </p>
        </div>
      </div>

      {/* Exposure Bar */}
      <div className="rounded-xl border bg-card p-6">
        <div className="mb-2 flex justify-between text-sm">
          <span>Exposure: {exposurePercent.toFixed(1)}%</span>
          <span>Limit: {(bankroll.maxTotalExposurePercentage * 100).toFixed(0)}%</span>
        </div>
        <div className="h-4 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full ${exposurePercent > bankroll.maxTotalExposurePercentage * 100 ? 'bg-red-500' : 'bg-green-500'}`}
            style={{ width: `${Math.min(exposurePercent, 100)}%` }}
          />
        </div>
      </div>

      {/* Deposit */}
      <div className="rounded-xl border bg-card p-6">
        <h2 className="mb-4 text-xl font-semibold">Deposit Funds</h2>
        <div className="flex gap-4">
          <input
            type="number"
            min="1"
            value={depositAmount}
            onChange={(e) => setDepositAmount(parseFloat(e.target.value) || 0)}
            className="w-32 rounded-lg border bg-background px-4 py-2"
          />
          <button
            onClick={handleDeposit}
            disabled={depositing || depositAmount <= 0}
            className="rounded-lg bg-primary px-6 py-2 text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {depositing ? 'Depositing...' : 'Deposit'}
          </button>
        </div>
      </div>
    </div>
  );
}