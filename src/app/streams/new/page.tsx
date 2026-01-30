'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NewStreamPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: 'Stream Alpha',
    initialStake: 50,
    targetDailyOdds: 1.10,
    reinvestmentPercentage: 80,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/streams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          reinvestmentPercentage: form.reinvestmentPercentage / 100,
          cashoutPercentage: (100 - form.reinvestmentPercentage) / 100,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create stream');
      }

      router.push('/streams');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/streams" className="text-muted-foreground hover:text-foreground">
          ← Back
        </Link>
        <h1 className="text-3xl font-bold">New Stream</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border bg-card p-6">
        <div>
          <label className="mb-2 block text-sm font-medium">Stream Name</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full rounded-lg border bg-background px-4 py-2"
            required
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Initial Stake (£)</label>
          <input
            type="number"
            min="1"
            step="0.01"
            value={form.initialStake}
            onChange={(e) => setForm({ ...form, initialStake: parseFloat(e.target.value) || 0 })}
            className="w-full rounded-lg border bg-background px-4 py-2"
            required
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Target Daily Odds</label>
          <input
            type="number"
            min="1.01"
            step="0.01"
            value={form.targetDailyOdds}
            onChange={(e) => setForm({ ...form, targetDailyOdds: parseFloat(e.target.value) || 1.1 })}
            className="w-full rounded-lg border bg-background px-4 py-2"
            required
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            Reinvestment: {form.reinvestmentPercentage}% / Cashout: {100 - form.reinvestmentPercentage}%
          </label>
          <input
            type="range"
            min="50"
            max="100"
            step="5"
            value={form.reinvestmentPercentage}
            onChange={(e) => setForm({ ...form, reinvestmentPercentage: parseInt(e.target.value) })}
            className="w-full"
          />
        </div>

        {error && (
          <div className="rounded-lg bg-red-500/20 p-4 text-red-500">{error}</div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-primary py-3 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Stream'}
        </button>
      </form>
    </div>
  );
}