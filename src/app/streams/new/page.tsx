'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface StreamTemplate {
  name: string;
  description: string;
  initialStake: number;
  targetDailyOdds: number;
  reinvestmentPercentage: number;
  targetBalance: number | null;
}

const templates: StreamTemplate[] = [
  {
    name: 'Conservative',
    description: 'Lower risk with 1.05 daily odds, 90% reinvestment. Slower but safer growth.',
    initialStake: 50,
    targetDailyOdds: 1.05,
    reinvestmentPercentage: 0.90,
    targetBalance: 500,
  },
  {
    name: 'Balanced',
    description: 'Moderate risk with 1.10 daily odds, 80% reinvestment. Good balance of risk/reward.',
    initialStake: 50,
    targetDailyOdds: 1.10,
    reinvestmentPercentage: 0.80,
    targetBalance: 1000,
  },
  {
    name: 'Aggressive',
    description: 'Higher risk with 1.20 daily odds, 70% reinvestment. Faster potential growth.',
    initialStake: 50,
    targetDailyOdds: 1.20,
    reinvestmentPercentage: 0.70,
    targetBalance: 2000,
  },
  {
    name: 'Ultra Conservative',
    description: 'Very low risk with 1.03 daily odds, 95% reinvestment. Maximum safety.',
    initialStake: 100,
    targetDailyOdds: 1.03,
    reinvestmentPercentage: 0.95,
    targetBalance: 300,
  },
  {
    name: 'High Roller',
    description: 'High stakes with 1.15 daily odds, 75% reinvestment. For larger bankrolls.',
    initialStake: 200,
    targetDailyOdds: 1.15,
    reinvestmentPercentage: 0.75,
    targetBalance: 5000,
  },
];

export default function NewStreamPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [initialStake, setInitialStake] = useState(50);
  const [targetDailyOdds, setTargetDailyOdds] = useState(1.10);
  const [reinvestmentPercentage, setReinvestmentPercentage] = useState(80);
  const [targetBalance, setTargetBalance] = useState<number | ''>('');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const applyTemplate = (template: StreamTemplate) => {
    setSelectedTemplate(template.name);
    setInitialStake(template.initialStake);
    setTargetDailyOdds(template.targetDailyOdds);
    setReinvestmentPercentage(template.reinvestmentPercentage * 100);
    setTargetBalance(template.targetBalance || '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/streams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name || `Stream ${new Date().toLocaleDateString()}`,
          initialStake,
          targetDailyOdds,
          reinvestmentPercentage: reinvestmentPercentage / 100,
          cashoutPercentage: (100 - reinvestmentPercentage) / 100,
          targetBalance: targetBalance || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create stream');
      }

      const stream = await res.json();
      router.push(`/streams/${stream.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create stream');
    } finally {
      setSubmitting(false);
    }
  };

  const cashoutPercentage = 100 - reinvestmentPercentage;
  const daysToTarget = targetBalance
    ? Math.ceil(Math.log(targetBalance / initialStake) / Math.log(targetDailyOdds * (reinvestmentPercentage / 100)))
    : null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/streams" className="rounded-lg border px-3 py-1 text-sm hover:bg-accent">
          ← Back
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Create New Stream</h1>
          <p className="text-muted-foreground">Start a new betting stream</p>
        </div>
      </div>

      {/* Templates */}
      <div className="rounded-xl border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold">Quick Start Templates</h2>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {templates.map(template => (
            <button
              key={template.name}
              type="button"
              onClick={() => applyTemplate(template)}
              className={`rounded-lg border p-4 text-left transition-colors hover:bg-accent ${
                selectedTemplate === template.name ? 'border-primary bg-primary/10' : ''
              }`}
            >
              <h3 className="font-semibold">{template.name}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{template.description}</p>
              <div className="mt-2 flex gap-2 text-xs">
                <span className="rounded bg-muted px-1">{template.targetDailyOdds}x</span>
                <span className="rounded bg-muted px-1">{template.reinvestmentPercentage * 100}%</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="rounded-xl border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold">Stream Configuration</h2>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Stream Name (optional)</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. January O1.5 Goals"
              className="w-full rounded-lg border bg-background px-4 py-2"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Initial Stake (£)</label>
              <input
                type="number"
                min="1"
                step="0.01"
                value={initialStake}
                onChange={(e) => setInitialStake(Number(e.target.value))}
                className="w-full rounded-lg border bg-background px-4 py-2"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Target Daily Odds</label>
              <input
                type="number"
                min="1.01"
                step="0.01"
                value={targetDailyOdds}
                onChange={(e) => setTargetDailyOdds(Number(e.target.value))}
                className="w-full rounded-lg border bg-background px-4 py-2"
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Reinvestment: {reinvestmentPercentage}% | Cashout: {cashoutPercentage}%
            </label>
            <input
              type="range"
              min="50"
              max="100"
              value={reinvestmentPercentage}
              onChange={(e) => setReinvestmentPercentage(Number(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>50% (More cashout)</span>
              <span>100% (Full reinvest)</span>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Target Balance (optional)</label>
            <input
              type="number"
              min={initialStake}
              step="0.01"
              value={targetBalance}
              onChange={(e) => setTargetBalance(e.target.value ? Number(e.target.value) : '')}
              placeholder="e.g. 1000"
              className="w-full rounded-lg border bg-background px-4 py-2"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Stream will mark as complete when this balance is reached
            </p>
          </div>
        </div>

        {/* Projection */}
        <div className="mt-6 rounded-lg bg-primary/10 p-4">
          <h3 className="font-medium">Projection</h3>
          <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Daily Return</p>
              <p className="font-semibold">
                {((targetDailyOdds - 1) * 100).toFixed(1)}% ({((targetDailyOdds * reinvestmentPercentage / 100) - 1) * 100 > 0 ? '+' : ''}{(((targetDailyOdds * reinvestmentPercentage / 100) - 1) * 100).toFixed(1)}% net)
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Daily Cashout</p>
              <p className="font-semibold">
                £{(initialStake * targetDailyOdds * cashoutPercentage / 100).toFixed(2)} (Day 1)
              </p>
            </div>
            {targetBalance && daysToTarget && daysToTarget > 0 && (
              <>
                <div>
                  <p className="text-muted-foreground">Days to Target</p>
                  <p className="font-semibold">{daysToTarget} days</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Survival Needed</p>
                  <p className="font-semibold">{(Math.pow(0.9, daysToTarget) * 100).toFixed(1)}% (at 90% win rate)</p>
                </div>
              </>
            )}
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-lg bg-red-500/20 p-3 text-sm text-red-500">
            {error}
          </div>
        )}

        <div className="mt-6 flex gap-4">
          <Link href="/streams" className="rounded-lg border px-6 py-2 hover:bg-accent">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 rounded-lg bg-primary py-2 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {submitting ? 'Creating...' : 'Create Stream'}
          </button>
        </div>
      </form>
    </div>
  );
}