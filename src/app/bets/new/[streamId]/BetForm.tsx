'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatCurrency } from '@/lib/utils';
import { calculateKelly } from '@/lib/analytics';

interface Selection {
  id: string;
  leagueId: string;
  leagueName: string;
  marketTypeId: string;
  marketTypeName: string;
  homeTeam: string;
  awayTeam: string;
  odds: number;
  estimatedProbability: number;
}

interface Stream {
  id: string;
  name: string;
  currentBalance: number;
  targetDailyOdds: number;
  currentDay: number;
}

interface League {
  id: string;
  name: string;
  country: string;
}

interface MarketType {
  id: string;
  name: string;
  category: string;
  baselineProbability: number;
}

interface BetFormProps {
  stream: Stream;
  leaguesByCountry: Record<string, League[]>;
  marketsByCategory: Record<string, MarketType[]>;
}

export default function BetForm({ stream, leaguesByCountry, marketsByCategory }: BetFormProps) {
  const router = useRouter();
  const [selections, setSelections] = useState<Selection[]>([]);
  const [stake, setStake] = useState(stream.currentBalance.toString());
  const [useFullBalance, setUseFullBalance] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Current selection being built
  const [currentSelection, setCurrentSelection] = useState({
    leagueId: '',
    marketTypeId: '',
    homeTeam: '',
    awayTeam: '',
    odds: '',
    estimatedProbability: '',
  });

  const stakeAmount = parseFloat(stake) || 0;
  const totalOdds = selections.reduce((acc, sel) => acc * sel.odds, 1);
  const potentialReturns = stakeAmount * totalOdds;

  // Kelly calculation for guidance
  const avgProbability = selections.length > 0
    ? selections.reduce((acc, sel) => acc * sel.estimatedProbability, 1)
    : 0;
  const kellyResult = totalOdds > 1 && avgProbability > 0
    ? calculateKelly(stream.currentBalance, totalOdds, avgProbability)
    : null;

  const handleAddSelection = () => {
    if (!currentSelection.leagueId || !currentSelection.marketTypeId || 
        !currentSelection.homeTeam || !currentSelection.awayTeam || 
        !currentSelection.odds) {
      setError('Please fill in all selection fields');
      return;
    }

    const league = Object.values(leaguesByCountry)
      .flat()
      .find(l => l.id === currentSelection.leagueId);
    
    const market = Object.values(marketsByCategory)
      .flat()
      .find(m => m.id === currentSelection.marketTypeId);

    if (!league || !market) return;

    const newSelection: Selection = {
      id: Math.random().toString(36).substr(2, 9),
      leagueId: currentSelection.leagueId,
      leagueName: league.name,
      marketTypeId: currentSelection.marketTypeId,
      marketTypeName: market.name,
      homeTeam: currentSelection.homeTeam,
      awayTeam: currentSelection.awayTeam,
      odds: parseFloat(currentSelection.odds),
      estimatedProbability: parseFloat(currentSelection.estimatedProbability) / 100 || market.baselineProbability,
    };

    setSelections([...selections, newSelection]);
    setCurrentSelection({
      leagueId: '',
      marketTypeId: '',
      homeTeam: '',
      awayTeam: '',
      odds: '',
      estimatedProbability: '',
    });
    setError('');
  };

  const handleRemoveSelection = (id: string) => {
    setSelections(selections.filter(s => s.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selections.length === 0) {
      setError('Please add at least one selection');
      return;
    }

    if (stakeAmount <= 0) {
      setError('Please enter a valid stake amount');
      return;
    }

    if (stakeAmount > stream.currentBalance) {
      setError('Stake cannot exceed stream balance');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/bets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          streamId: stream.id,
          stake: stakeAmount,
          selections: selections.map(s => ({
            leagueId: s.leagueId,
            marketTypeId: s.marketTypeId,
            homeTeam: s.homeTeam,
            awayTeam: s.awayTeam,
            odds: s.odds,
            estimatedProbability: s.estimatedProbability,
          })),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to place bet');
      }

      router.push(`/streams/${stream.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to place bet');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Stake Section */}
      <div className="rounded-xl border bg-card p-6">
        <h2 className="text-lg font-semibold mb-4">💰 Stake Amount</h2>
        
        <div className="space-y-4">
          {/* Balance Info */}
          <div className="flex items-center justify-between rounded-lg bg-muted p-3">
            <span className="text-sm text-muted-foreground">Stream Balance:</span>
            <span className="font-bold text-green-500">
              {formatCurrency(stream.currentBalance, 'GBP')}
            </span>
          </div>

          {/* Use Full Balance Toggle */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={useFullBalance}
              onChange={(e) => {
                setUseFullBalance(e.target.checked);
                if (e.target.checked) {
                  setStake(stream.currentBalance.toString());
                }
              }}
              className="h-5 w-5 rounded border-gray-300"
            />
            <span className="text-sm font-medium">Use full stream balance (compounding)</span>
          </label>

          {/* Stake Input */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Stake Amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">£</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={stream.currentBalance}
                value={stake}
                onChange={(e) => {
                  setStake(e.target.value);
                  setUseFullBalance(false);
                }}
                disabled={useFullBalance}
                className="w-full rounded-lg border bg-background pl-8 pr-4 py-3 text-lg font-semibold disabled:opacity-50"
                placeholder="0.00"
              />
            </div>
            {!useFullBalance && stakeAmount > 0 && (
              <p className="mt-2 text-xs text-muted-foreground">
                Remaining in stream after bet: {formatCurrency(stream.currentBalance - stakeAmount, 'GBP')}
              </p>
            )}
          </div>

          {/* Quick Stake Buttons */}
          {!useFullBalance && (
            <div className="flex flex-wrap gap-2">
              {[0.25, 0.5, 0.75, 1].map((fraction) => (
                <button
                  key={fraction}
                  type="button"
                  onClick={() => setStake((stream.currentBalance * fraction).toFixed(2))}
                  className="rounded-lg border px-3 py-1 text-sm hover:bg-accent"
                >
                  {fraction === 1 ? '100%' : `${fraction * 100}%`}
                </button>
              ))}
            </div>
          )}

          {/* Kelly Suggestion */}
          {kellyResult && kellyResult.isValueBet && selections.length > 0 && (
            <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-3">
              <p className="text-sm text-green-500 font-medium">
                🧮 Kelly suggests: {formatCurrency(kellyResult.halfKellyStake, 'GBP')} (Half Kelly)
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Edge: +{kellyResult.edge.toFixed(1)}%
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Add Selection Section */}
      <div className="rounded-xl border bg-card p-6">
        <h2 className="text-lg font-semibold mb-4">➕ Add Selection</h2>
        
        <div className="grid gap-4 sm:grid-cols-2">
          {/* League Select */}
          <div>
            <label className="block text-sm font-medium mb-1">League</label>
            <select
              value={currentSelection.leagueId}
              onChange={(e) => setCurrentSelection({ ...currentSelection, leagueId: e.target.value })}
              className="w-full rounded-lg border bg-background px-4 py-2"
            >
              <option value="">Select league...</option>
              {Object.entries(leaguesByCountry).map(([country, leagues]) => (
                <optgroup key={country} label={country}>
                  {leagues.map((league) => (
                    <option key={league.id} value={league.id}>
                      {league.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Market Select */}
          <div>
            <label className="block text-sm font-medium mb-1">Market</label>
            <select
              value={currentSelection.marketTypeId}
              onChange={(e) => setCurrentSelection({ ...currentSelection, marketTypeId: e.target.value })}
              className="w-full rounded-lg border bg-background px-4 py-2"
            >
              <option value="">Select market...</option>
              {Object.entries(marketsByCategory).map(([category, markets]) => (
                <optgroup key={category} label={category}>
                  {markets.map((market) => (
                    <option key={market.id} value={market.id}>
                      {market.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Home Team */}
          <div>
            <label className="block text-sm font-medium mb-1">Home Team</label>
            <input
              type="text"
              value={currentSelection.homeTeam}
              onChange={(e) => setCurrentSelection({ ...currentSelection, homeTeam: e.target.value })}
              className="w-full rounded-lg border bg-background px-4 py-2"
              placeholder="e.g., Arsenal"
            />
          </div>

          {/* Away Team */}
          <div>
            <label className="block text-sm font-medium mb-1">Away Team</label>
            <input
              type="text"
              value={currentSelection.awayTeam}
              onChange={(e) => setCurrentSelection({ ...currentSelection, awayTeam: e.target.value })}
              className="w-full rounded-lg border bg-background px-4 py-2"
              placeholder="e.g., Chelsea"
            />
          </div>

          {/* Odds */}
          <div>
            <label className="block text-sm font-medium mb-1">Odds</label>
            <input
              type="number"
              step="0.01"
              min="1.01"
              value={currentSelection.odds}
              onChange={(e) => setCurrentSelection({ ...currentSelection, odds: e.target.value })}
              className="w-full rounded-lg border bg-background px-4 py-2"
              placeholder="e.g., 1.50"
            />
          </div>

          {/* Estimated Probability */}
          <div>
            <label className="block text-sm font-medium mb-1">Your Probability % (optional)</label>
            <input
              type="number"
              step="1"
              min="1"
              max="99"
              value={currentSelection.estimatedProbability}
              onChange={(e) => setCurrentSelection({ ...currentSelection, estimatedProbability: e.target.value })}
              className="w-full rounded-lg border bg-background px-4 py-2"
              placeholder="e.g., 70"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={handleAddSelection}
          className="mt-4 w-full rounded-lg border-2 border-dashed border-primary/50 py-3 text-primary hover:bg-primary/10"
        >
          + Add Selection
        </button>
      </div>

      {/* Current Selections */}
      {selections.length > 0 && (
        <div className="rounded-xl border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">📋 Your Selections ({selections.length})</h2>
          
          <div className="space-y-3">
            {selections.map((selection, index) => (
              <div
                key={selection.id}
                className="flex items-center justify-between rounded-lg border bg-muted/50 p-4"
              >
                <div className="flex-1">
                  <p className="font-medium">
                    {selection.homeTeam} vs {selection.awayTeam}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selection.leagueName} • {selection.marketTypeName}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-lg font-bold text-green-500">
                    {selection.odds.toFixed(2)}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSelection(selection.id)}
                    className="rounded-lg p-2 text-red-500 hover:bg-red-500/10"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Bet Summary */}
          <div className="mt-4 rounded-lg bg-muted p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Odds:</span>
              <span className="font-bold">{totalOdds.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Stake:</span>
              <span className="font-bold">{formatCurrency(stakeAmount, 'GBP')}</span>
            </div>
            <div className="flex justify-between text-lg">
              <span className="text-muted-foreground">Potential Returns:</span>
              <span className="font-bold text-green-500">{formatCurrency(potentialReturns, 'GBP')}</span>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-red-500">
          {error}
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting || selections.length === 0 || stakeAmount <= 0}
        className="w-full rounded-xl bg-primary py-4 text-lg font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {isSubmitting ? 'Placing Bet...' : `Place Bet - ${formatCurrency(stakeAmount, 'GBP')}`}
      </button>
    </form>
  );
}