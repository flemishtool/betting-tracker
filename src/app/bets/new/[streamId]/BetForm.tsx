'use client';

import { useState, useEffect } from 'react';
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
  selection: string;
  odds: number;
  estimatedProbability: number;
  matchTime: string;
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

interface InitialBetSlipItem {
  fixtureId: string;
  fixture: string;
  market: string;
  odds: number;
  league: string;
  matchTime?: string;
}

interface BetFormProps {
  stream: Stream;
  leaguesByCountry: Record<string, League[]>;
  marketsByCategory: Record<string, MarketType[]>;
  initialBetSlip?: InitialBetSlipItem[];
}

export default function BetForm({ stream, leaguesByCountry, marketsByCategory, initialBetSlip = [] }: BetFormProps) {
  const router = useRouter();
  const [selections, setSelections] = useState<Selection[]>([]);
  const [stake, setStake] = useState(stream.currentBalance.toString());
  const [useFullBalance, setUseFullBalance] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [initialized, setInitialized] = useState(false);

  // Get all leagues and markets as flat arrays for lookup
  const allLeagues = Object.values(leaguesByCountry).flat();
  const allMarkets = Object.values(marketsByCategory).flat();

  // Get default date/time (now + 1 hour, rounded to nearest 15 min)
  const getDefaultMatchTime = () => {
    const now = new Date();
    now.setHours(now.getHours() + 1);
    now.setMinutes(Math.round(now.getMinutes() / 15) * 15);
    now.setSeconds(0);
    now.setMilliseconds(0);
    return now.toISOString().slice(0, 16);
  };

  // Initialize from initialBetSlip
  useEffect(() => {
    if (initialized || initialBetSlip.length === 0) return;
    
    const convertedSelections: Selection[] = initialBetSlip.map((item, index) => {
      // Parse fixture "Home vs Away"
      const fixtureParts = item.fixture.split(' vs ');
      const homeTeam = fixtureParts[0] || '';
      const awayTeam = fixtureParts[1] || '';
      
      // Find league by name (case-insensitive partial match)
      const league = allLeagues.find(l => 
        l.name.toLowerCase() === item.league.toLowerCase() ||
        l.name.toLowerCase().includes(item.league.toLowerCase()) ||
        item.league.toLowerCase().includes(l.name.toLowerCase())
      );
      
      // Find market by name (case-insensitive partial match)
      const market = allMarkets.find(m => 
        m.name.toLowerCase() === item.market.toLowerCase() ||
        m.name.toLowerCase().includes(item.market.toLowerCase()) ||
        item.market.toLowerCase().includes(m.name.toLowerCase())
      );
      
      // Parse match time or use default
      let matchTime = getDefaultMatchTime();
      if (item.matchTime) {
        try {
          const date = new Date(item.matchTime);
          if (!isNaN(date.getTime())) {
            matchTime = date.toISOString().slice(0, 16);
          }
        } catch {
          // Use default
        }
      }
      
      // Extract selection from market name if it contains Over/Under
      let selection = item.market;
      const overUnderMatch = item.market.match(/(over|under)\s*(\d+\.?\d*)/i);
      if (overUnderMatch) {
        const type = overUnderMatch[1].charAt(0).toUpperCase() + overUnderMatch[1].slice(1).toLowerCase();
        const line = overUnderMatch[2];
        selection = `${type} ${line}`;
      }
      
      return {
        id: `init-${index}-${Date.now()}`,
        leagueId: league?.id || '',
        leagueName: league?.name || item.league,
        marketTypeId: market?.id || '',
        marketTypeName: market?.name || item.market,
        homeTeam,
        awayTeam,
        selection,
        odds: item.odds,
        estimatedProbability: market?.baselineProbability || 0.5,
        matchTime,
      };
    });
    
    setSelections(convertedSelections);
    setInitialized(true);
  }, [initialBetSlip, initialized, allLeagues, allMarkets]);

  // Current selection being built
  const [currentSelection, setCurrentSelection] = useState({
    leagueId: '',
    marketTypeId: '',
    homeTeam: '',
    awayTeam: '',
    selection: '',
    odds: '',
    estimatedProbability: '',
    matchTime: getDefaultMatchTime(),
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

  // Find earliest match time from selections
  const earliestMatch = selections.length > 0
    ? new Date(Math.min(...selections.map(s => new Date(s.matchTime).getTime())))
    : null;

  const handleAddSelection = () => {
    if (!currentSelection.leagueId || !currentSelection.marketTypeId ||
        !currentSelection.homeTeam || !currentSelection.awayTeam ||
        !currentSelection.selection || !currentSelection.odds ||
        !currentSelection.matchTime) {
      setError('Please fill in all selection fields including your pick');
      return;
    }

    const league = allLeagues.find(l => l.id === currentSelection.leagueId);
    const market = allMarkets.find(m => m.id === currentSelection.marketTypeId);

    if (!league || !market) return;

    const newSelection: Selection = {
      id: Math.random().toString(36).substr(2, 9),
      leagueId: currentSelection.leagueId,
      leagueName: league.name,
      marketTypeId: currentSelection.marketTypeId,
      marketTypeName: market.name,
      homeTeam: currentSelection.homeTeam,
      awayTeam: currentSelection.awayTeam,
      selection: currentSelection.selection,
      odds: parseFloat(currentSelection.odds),
      estimatedProbability: parseFloat(currentSelection.estimatedProbability) / 100 || market.baselineProbability,
      matchTime: currentSelection.matchTime,
    };

    setSelections([...selections, newSelection]);
    setCurrentSelection({
      leagueId: '',
      marketTypeId: '',
      homeTeam: '',
      awayTeam: '',
      selection: '',
      odds: '',
      estimatedProbability: '',
      matchTime: getDefaultMatchTime(),
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
            market: s.marketTypeName,
            selection: s.selection,
            homeTeam: s.homeTeam,
            awayTeam: s.awayTeam,
            odds: s.odds,
            estimatedProbability: s.estimatedProbability,
            matchTime: s.matchTime,
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

  const formatMatchTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getSelectionSuggestions = (marketTypeId: string): string[] => {
    const market = allMarkets.find(m => m.id === marketTypeId);
    if (!market) return [];

    const marketName = market.name.toLowerCase();

    if (marketName.includes('match result') || marketName.includes('1x2')) {
      return ['Home Win', 'Draw', 'Away Win'];
    }

    const overUnderMatch = marketName.match(/(over|under)\s*(\d+\.?\d*)/i);
    if (overUnderMatch) {
      const type = overUnderMatch[1].charAt(0).toUpperCase() + overUnderMatch[1].slice(1).toLowerCase();
      const line = overUnderMatch[2];
      return [`${type} ${line}`];
    }

    if (marketName.includes('over') || marketName.includes('under') || marketName.includes('goals') || marketName.includes('total')) {
      return [
        'Over 0.5', 'Over 1.5', 'Over 2.5', 'Over 3.5', 'Over 4.5', 'Over 5.5', 'Over 6.5', 'Over 7.5',
        'Under 0.5', 'Under 1.5', 'Under 2.5', 'Under 3.5', 'Under 4.5', 'Under 5.5', 'Under 6.5', 'Under 7.5'
      ];
    }

    if (marketName.includes('btts') || marketName.includes('both teams to score')) {
      return ['Yes', 'No'];
    }

    if (marketName.includes('double chance')) {
      return ['Home or Draw (1X)', 'Away or Draw (X2)', 'Home or Away (12)'];
    }

    if (marketName.includes('draw no bet')) {
      return ['Home Win', 'Away Win'];
    }

    if (marketName.includes('clean sheet')) {
      return ['Home Clean Sheet - Yes', 'Home Clean Sheet - No', 'Away Clean Sheet - Yes', 'Away Clean Sheet - No'];
    }

    if (marketName.includes('handicap') || marketName.includes('spread')) {
      return [
        'Home -1', 'Home -1.5', 'Home -2', 'Home -2.5',
        'Away +1', 'Away +1.5', 'Away +2', 'Away +2.5',
        'Home +1', 'Home +1.5', 'Home +2', 'Home +2.5',
        'Away -1', 'Away -1.5', 'Away -2', 'Away -2.5'
      ];
    }

    if (marketName.includes('corner')) {
      return [
        'Over 7.5', 'Over 8.5', 'Over 9.5', 'Over 10.5', 'Over 11.5',
        'Under 7.5', 'Under 8.5', 'Under 9.5', 'Under 10.5', 'Under 11.5'
      ];
    }

    if (marketName.includes('card')) {
      return [
        'Over 2.5', 'Over 3.5', 'Over 4.5', 'Over 5.5',
        'Under 2.5', 'Under 3.5', 'Under 4.5', 'Under 5.5'
      ];
    }

    if (marketName.includes('half time') || marketName.includes('ht result')) {
      return ['Home Win', 'Draw', 'Away Win'];
    }

    if (marketName.includes('ht/ft') || marketName.includes('half time/full time')) {
      return [
        'Home/Home', 'Home/Draw', 'Home/Away',
        'Draw/Home', 'Draw/Draw', 'Draw/Away',
        'Away/Home', 'Away/Draw', 'Away/Away'
      ];
    }

    if (marketName.includes('goalscorer') || marketName.includes('to score')) {
      return ['Player Name (type below)'];
    }

    if (marketName.includes('correct score')) {
      return [
        '1-0', '2-0', '2-1', '3-0', '3-1', '3-2',
        '0-0', '1-1', '2-2', '3-3',
        '0-1', '0-2', '1-2', '0-3', '1-3', '2-3'
      ];
    }

    if (marketName.includes('win to nil')) {
      return ['Home Win to Nil', 'Away Win to Nil'];
    }

    if (marketName.includes('first half') && marketName.includes('goal')) {
      return [
        'Over 0.5 FH', 'Over 1.5 FH', 'Over 2.5 FH',
        'Under 0.5 FH', 'Under 1.5 FH', 'Under 2.5 FH'
      ];
    }

    if (marketName.includes('second half') && marketName.includes('goal')) {
      return [
        'Over 0.5 SH', 'Over 1.5 SH', 'Over 2.5 SH',
        'Under 0.5 SH', 'Under 1.5 SH', 'Under 2.5 SH'
      ];
    }

    return [];
  };

  const selectionSuggestions = getSelectionSuggestions(currentSelection.marketTypeId);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Stake Section */}
      <div className="rounded-xl border bg-card p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span>💰</span> Stake Amount
        </h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg bg-muted p-3">
            <span className="text-sm text-muted-foreground">Stream Balance:</span>
            <span className="font-bold text-green-500">
              {formatCurrency(stream.currentBalance, 'GBP')}
            </span>
          </div>

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

          <div>
            <label className="block text-sm font-medium mb-2">Stake Amount</label>
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
          </div>

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

      {/* Current Selections - Show first if we have pre-populated ones */}
      {selections.length > 0 && (
        <div className="rounded-xl border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span>📋</span> Your Selections ({selections.length})
          </h2>

          <div className="space-y-3">
            {selections.map((selection) => (
              <div
                key={selection.id}
                className="flex items-center justify-between rounded-lg border bg-muted/50 p-4"
              >
                <div className="flex-1">
                  <p className="font-medium">
                    {selection.homeTeam} vs {selection.awayTeam}
                  </p>
                  <p className="text-sm text-primary font-medium">
                    {selection.marketTypeName}: {selection.selection}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selection.leagueName}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    🕐 {formatMatchTime(selection.matchTime)}
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
            {earliestMatch && (
              <div className="flex justify-between text-sm pt-2 border-t">
                <span className="text-muted-foreground">First Match:</span>
                <span className="font-medium">{formatMatchTime(earliestMatch.toISOString())}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Selection Section */}
      <div className="rounded-xl border bg-card p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span>➕</span> Add Selection
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium mb-1">📅 Match Date & Time</label>
            <input
              type="datetime-local"
              value={currentSelection.matchTime}
              onChange={(e) => setCurrentSelection({ ...currentSelection, matchTime: e.target.value })}
              className="w-full rounded-lg border bg-background px-4 py-2"
            />
          </div>

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

          <div>
            <label className="block text-sm font-medium mb-1">Market Type</label>
            <select
              value={currentSelection.marketTypeId}
              onChange={(e) => {
                const marketId = e.target.value;
                const market = allMarkets.find(m => m.id === marketId);

                let autoSelection = '';
                if (market) {
                  const marketName = market.name.toLowerCase();
                  const overUnderMatch = marketName.match(/(over|under)\s*(\d+\.?\d*)/i);
                  if (overUnderMatch) {
                    const type = overUnderMatch[1].charAt(0).toUpperCase() + overUnderMatch[1].slice(1).toLowerCase();
                    const line = overUnderMatch[2];
                    autoSelection = `${type} ${line}`;
                  }
                }

                setCurrentSelection({
                  ...currentSelection,
                  marketTypeId: marketId,
                  selection: autoSelection
                });
              }}
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

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium mb-1">🎯 Your Pick</label>
            {selectionSuggestions.length > 0 ? (
              <div className="space-y-2">
                <select
                  value={currentSelection.selection}
                  onChange={(e) => setCurrentSelection({ ...currentSelection, selection: e.target.value })}
                  className="w-full rounded-lg border bg-background px-4 py-2"
                >
                  <option value="">Select your pick...</option>
                  {selectionSuggestions.map((suggestion) => (
                    <option key={suggestion} value={suggestion}>
                      {suggestion}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={currentSelection.selection}
                  onChange={(e) => setCurrentSelection({ ...currentSelection, selection: e.target.value })}
                  className="w-full rounded-lg border bg-background px-4 py-2"
                  placeholder="Or type custom pick..."
                />
              </div>
            ) : (
              <input
                type="text"
                value={currentSelection.selection}
                onChange={(e) => setCurrentSelection({ ...currentSelection, selection: e.target.value })}
                className="w-full rounded-lg border bg-background px-4 py-2"
                placeholder="e.g., Home Win, Over 2.5, BTTS Yes"
              />
            )}
          </div>

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

      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-red-500">
          {error}
        </div>
      )}

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