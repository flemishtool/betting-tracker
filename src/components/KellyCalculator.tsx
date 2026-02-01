'use client';

import { useState } from 'react';
import { calculateKelly } from '@/lib/analytics';
import { formatCurrency } from '@/lib/utils';

interface KellyCalculatorProps {
  bankroll: number;
  currency?: string;
  defaultOdds?: number;
  defaultProbability?: number;
}

export default function KellyCalculator({ 
  bankroll, 
  currency = 'GBP',
  defaultOdds = 1.50,
  defaultProbability = 0.70,
}: KellyCalculatorProps) {
  const [odds, setOdds] = useState(defaultOdds.toString());
  const [probability, setProbability] = useState((defaultProbability * 100).toString());

  const oddsNum = parseFloat(odds) || 0;
  const probNum = (parseFloat(probability) || 0) / 100;

  const result = oddsNum > 1 && probNum > 0 && probNum <= 1
    ? calculateKelly(bankroll, oddsNum, probNum)
    : null;

  return (
    <div className="rounded-xl border bg-card p-6">
      <h3 className="text-lg font-semibold mb-4">🧮 Kelly Criterion Calculator</h3>
      
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium mb-1">Decimal Odds</label>
          <input
            type="number"
            step="0.01"
            min="1.01"
            value={odds}
            onChange={(e) => setOdds(e.target.value)}
            className="w-full rounded-lg border bg-background px-4 py-2"
            placeholder="e.g., 1.50"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Your Win Probability (%)</label>
          <input
            type="number"
            step="1"
            min="1"
            max="99"
            value={probability}
            onChange={(e) => setProbability(e.target.value)}
            className="w-full rounded-lg border bg-background px-4 py-2"
            placeholder="e.g., 70"
          />
        </div>
      </div>

      {result && (
        <div className="mt-4 space-y-3">
          {/* Value Indicator */}
          <div className={`rounded-lg p-3 text-center ${
            result.isValueBet 
              ? 'bg-green-500/20 text-green-500' 
              : 'bg-red-500/20 text-red-500'
          }`}>
            {result.isValueBet ? (
              <>✅ Value Bet! Edge: +{result.edge.toFixed(2)}%</>
            ) : (
              <>❌ Not a value bet. Edge: {result.edge.toFixed(2)}%</>
            )}
          </div>

          {result.isValueBet && (
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg bg-muted p-3 text-center">
                <p className="text-xs text-muted-foreground">Full Kelly</p>
                <p className="text-lg font-bold">{formatCurrency(result.recommendedStake, currency)}</p>
                <p className="text-xs text-muted-foreground">
                  ({(result.kellyFraction * 100).toFixed(1)}%)
                </p>
              </div>
              <div className="rounded-lg bg-muted p-3 text-center">
                <p className="text-xs text-muted-foreground">Half Kelly ⭐</p>
                <p className="text-lg font-bold text-green-500">
                  {formatCurrency(result.halfKellyStake, currency)}
                </p>
                <p className="text-xs text-muted-foreground">Recommended</p>
              </div>
              <div className="rounded-lg bg-muted p-3 text-center">
                <p className="text-xs text-muted-foreground">Quarter Kelly</p>
                <p className="text-lg font-bold">{formatCurrency(result.quarterKellyStake, currency)}</p>
                <p className="text-xs text-muted-foreground">Conservative</p>
              </div>
            </div>
          )}

          <p className="text-xs text-muted-foreground text-center">
            💡 Half Kelly is recommended to reduce variance while capturing most of the edge.
          </p>
        </div>
      )}

      {!result && oddsNum > 0 && (
        <p className="mt-4 text-sm text-muted-foreground text-center">
          Enter valid odds and probability to calculate.
        </p>
      )}
    </div>
  );
}