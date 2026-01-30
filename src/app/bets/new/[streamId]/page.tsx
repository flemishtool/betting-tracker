'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';

interface Stream {
  id: string;
  name: string;
  currentBalance: number;
  currentDay: number;
  targetDailyOdds: number;
  currency: string;
}

interface Market {
  id: string;
  name: string;
  category: string;
  baselineProbability: number;
}

interface League {
  id: string;
  name: string;
  country: string;
}

interface Selection {
  id: string;
  leagueId: string;
  leagueName: string;
  homeTeam: string;
  awayTeam: string;
  market: string;
  marketId: string;
  selection: string;
  odds: number;
  matchDateTime: string;
}

// Get current datetime in local format for input
function getCurrentDateTime(): string {
  const now = new Date();
  // Format: YYYY-MM-DDTHH:MM
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

// Format datetime for display
function formatMatchDateTime(dateTimeStr: string): string {
  const date = new Date(dateTimeStr);
  return date.toLocaleString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function NewBetPage({ params }: { params: { streamId: string } }) {
  const router = useRouter();
  const [stream, setStream] = useState<Stream | null>(null);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [selections, setSelections] = useState<Selection[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [submitError, setSubmitError] = useState('');

  // Form state for new selection
  const [selectedLeague, setSelectedLeague] = useState('');
  const [homeTeam, setHomeTeam] = useState('');
  const [awayTeam, setAwayTeam] = useState('');
  const [selectedMarketId, setSelectedMarketId] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [odds, setOdds] = useState('');
  const [matchDateTime, setMatchDateTime] = useState(getCurrentDateTime());

  useEffect(() => {
    async function fetchData() {
      try {
        const [streamRes, marketsRes, leaguesRes] = await Promise.all([
          fetch(`/api/streams/${params.streamId}`),
          fetch('/api/markets'),
          fetch('/api/leagues'),
        ]);

        if (!streamRes.ok) throw new Error('Stream not found');

        const [streamData, marketsData, leaguesData] = await Promise.all([
          streamRes.json(),
          marketsRes.json(),
          leaguesRes.json(),
        ]);

        setStream(streamData);
        setMarkets(marketsData);
        setLeagues(leaguesData);
      } catch (err) {
        setSubmitError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [params.streamId]);

  // Group markets by category
  const marketsByCategory = useMemo(() => {
    const grouped: Record<string, Market[]> = {};
    markets.forEach(market => {
      if (!grouped[market.category]) {
        grouped[market.category] = [];
      }
      grouped[market.category].push(market);
    });
    return grouped;
  }, [markets]);

  const categories = Object.keys(marketsByCategory).sort();

  const filteredMarkets = selectedCategory
    ? marketsByCategory[selectedCategory] || []
    : markets;

  const totalOdds = selections.reduce((acc, sel) => acc * sel.odds, 1);
  const potentialReturns = stream ? stream.currentBalance * totalOdds : 0;

  const addSelection = () => {
    setFormError('');

    if (!selectedLeague) {
      setFormError('Please select a league');
      return;
    }
    if (!homeTeam.trim()) {
      setFormError('Please enter home team');
      return;
    }
    if (!awayTeam.trim()) {
      setFormError('Please enter away team');
      return;
    }
    if (!selectedMarketId) {
      setFormError('Please select a market');
      return;
    }
    if (!odds.trim()) {
      setFormError('Please enter odds');
      return;
    }
    if (!matchDateTime) {
      setFormError('Please select match date and time');
      return;
    }

    const oddsNum = parseFloat(odds);
    if (isNaN(oddsNum) || oddsNum < 1.01) {
      setFormError('Odds must be at least 1.01');
      return;
    }

    const league = leagues.find(l => l.id === selectedLeague);
    const market = markets.find(m => m.id === selectedMarketId);

    if (!league || !market) {
      setFormError('Invalid league or market selection');
      return;
    }

    const newSelection: Selection = {
      id: Date.now().toString(),
      leagueId: league.id,
      leagueName: league.name,
      homeTeam: homeTeam.trim(),
      awayTeam: awayTeam.trim(),
      market: market.name,
      marketId: market.id,
      selection: market.name,
      odds: oddsNum,
      matchDateTime: matchDateTime,
    };

    setSelections(prev => [...prev, newSelection]);

    // Reset form fields (keep league, category, and datetime for convenience)
    setHomeTeam('');
    setAwayTeam('');
    setSelectedMarketId('');
    setOdds('');
  };

  const removeSelection = (id: string) => {
    setSelections(prev => prev.filter(s => s.id !== id));
  };

  const handleSubmit = async () => {
    setSubmitError('');

    if (selections.length === 0) {
      setSubmitError('Please add at least one selection');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        streamId: params.streamId,
        stake: stream?.currentBalance,
        selections: selections.map(s => ({
          leagueId: s.leagueId,
          homeTeam: s.homeTeam,
          awayTeam: s.awayTeam,
          market: s.market,
          marketId: s.marketId,
          selection: s.selection,
          odds: Number(s.odds),
          matchDate: s.matchDateTime, // This will be parsed as full datetime
        })),
      };

      const res = await fetch('/api/bets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to place bet');
      }

      router.push(`/streams/${params.streamId}`);
      router.refresh();
    } catch (err) {
      console.error('Submit error:', err);
      setSubmitError(err instanceof Error ? err.message : 'Failed to place bet');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!stream) {
    return (
      <div className="flex h-96 flex-col items-center justify-center">
        <p className="text-red-500">{submitError || 'Stream not found'}</p>
        <Link href="/streams" className="mt-4 text-primary underline">
          Back to streams
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href={`/streams/${params.streamId}`}
          className="rounded-lg border px-3 py-1 text-sm hover:bg-accent"
        >
          ← Back
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Place Bet</h1>
          <p className="text-muted-foreground">
            {stream.name} • Day {stream.currentDay + 1}
          </p>
        </div>
      </div>

      {/* Bet Summary Card */}
      <div className="rounded-xl border-2 border-primary bg-gradient-to-r from-primary/20 to-primary/5 p-6">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Stake</p>
            <p className="text-2xl font-bold">{formatCurrency(stream.currentBalance)}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Target Odds</p>
            <p className="text-2xl font-bold">{stream.targetDailyOdds.toFixed(2)}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Current Odds</p>
            <p className={`text-2xl font-bold ${
              totalOdds >= stream.targetDailyOdds ? 'text-green-500' : 'text-yellow-500'
            }`}>
              {totalOdds.toFixed(2)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Potential Returns</p>
            <p className="text-2xl font-bold text-green-500">{formatCurrency(potentialReturns)}</p>
          </div>
        </div>

        {/* Progress bar to target odds */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Progress to target</span>
            <span>{Math.min(100, ((totalOdds - 1) / (stream.targetDailyOdds - 1) * 100)).toFixed(0)}%</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                totalOdds >= stream.targetDailyOdds ? 'bg-green-500' : 'bg-yellow-500'
              }`}
              style={{ width: `${Math.min(100, ((totalOdds - 1) / (stream.targetDailyOdds - 1) * 100))}%` }}
            />
          </div>
        </div>

        {selections.length > 0 && totalOdds >= stream.targetDailyOdds && (
          <p className="mt-3 text-center text-sm text-green-500">
            ✓ Target odds reached! Ready to place bet.
          </p>
        )}
      </div>

      {/* Current Selections / Bet Slip */}
      {selections.length > 0 && (
        <div className="rounded-xl border bg-card p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
              {selections.length}
            </span>
            Bet Slip
          </h2>
          <div className="space-y-3">
            {selections.map((sel, index) => (
              <div
                key={sel.id}
                className="rounded-lg border bg-gradient-to-r from-muted/50 to-transparent p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-primary/20 px-2 py-0.5 text-xs font-medium text-primary">
                        {index + 1}
                      </span>
                      <span className="font-semibold">{sel.homeTeam} vs {sel.awayTeam}</span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                      <span className="rounded bg-muted px-2 py-0.5">{sel.leagueName}</span>
                      <span>•</span>
                      <span>{sel.market}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      🗓️ {formatMatchDateTime(sel.matchDateTime)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-lg font-bold">@ {sel.odds.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">
                        {(100 / sel.odds).toFixed(0)}% implied
                      </p>
                    </div>
                    <button
                      onClick={() => removeSelection(sel.id)}
                      className="rounded-lg p-2 text-red-500 hover:bg-red-500/10 transition-colors"
                      title="Remove selection"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Odds breakdown */}
          <div className="mt-4 rounded-lg bg-muted/50 p-3">
            <div className="flex justify-between text-sm">
              <span>Combined odds:</span>
              <span className="font-mono">{selections.map(s => s.odds.toFixed(2)).join(' × ')} = {totalOdds.toFixed(2)}</span>
            </div>
          </div>

          {submitError && (
            <div className="mt-4 rounded-lg bg-red-500/20 p-3 text-sm text-red-500">
              {submitError}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="mt-4 w-full rounded-lg bg-green-600 py-4 text-lg font-semibold text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                Placing Bet...
              </span>
            ) : (
              `✓ Place Bet @ ${totalOdds.toFixed(2)} → ${formatCurrency(potentialReturns)}`
            )}
          </button>
        </div>
      )}

      {/* Add Selection Form */}
      <div className="rounded-xl border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold">Add Selection</h2>

        <div className="grid gap-4">
          {/* Match Date & Time */}
          <div>
            <label className="mb-1 block text-sm font-medium">
              Match Date & Time 🗓️
            </label>
            <input
              type="datetime-local"
              value={matchDateTime}
              onChange={(e) => setMatchDateTime(e.target.value)}
              className="w-full rounded-lg border bg-background px-4 py-2"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              When does this match kick off?
            </p>
          </div>

          {/* League Selection */}
          <div>
            <label className="mb-1 block text-sm font-medium">League</label>
            <select
              value={selectedLeague}
              onChange={(e) => setSelectedLeague(e.target.value)}
              className="w-full rounded-lg border bg-background px-4 py-2"
            >
              <option value="">Select a league...</option>
              {leagues.map(league => (
                <option key={league.id} value={league.id}>
                  {league.name} ({league.country})
                </option>
              ))}
            </select>
          </div>

          {/* Teams */}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Home Team</label>
              <input
                type="text"
                value={homeTeam}
                onChange={(e) => setHomeTeam(e.target.value)}
                placeholder="e.g. Arsenal"
                className="w-full rounded-lg border bg-background px-4 py-2"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Away Team</label>
              <input
                type="text"
                value={awayTeam}
                onChange={(e) => setAwayTeam(e.target.value)}
                placeholder="e.g. Chelsea"
                className="w-full rounded-lg border bg-background px-4 py-2"
              />
            </div>
          </div>

          {/* Market Category Filter */}
          <div>
            <label className="mb-1 block text-sm font-medium">Market Category</label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('');
                  setSelectedMarketId('');
                }}
                className={`rounded-lg px-3 py-1.5 text-sm transition-all ${
                  selectedCategory === ''
                    ? 'bg-primary text-primary-foreground shadow-lg'
                    : 'bg-muted hover:bg-accent'
                }`}
              >
                All
              </button>
              {categories.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(cat);
                    setSelectedMarketId('');
                  }}
                  className={`rounded-lg px-3 py-1.5 text-sm transition-all ${
                    selectedCategory === cat
                      ? 'bg-primary text-primary-foreground shadow-lg'
                      : 'bg-muted hover:bg-accent'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Market Selection */}
          <div>
            <label className="mb-1 block text-sm font-medium">
              Market {selectedCategory && `(${selectedCategory})`}
            </label>
            <select
              value={selectedMarketId}
              onChange={(e) => setSelectedMarketId(e.target.value)}
              className="w-full rounded-lg border bg-background px-4 py-2"
            >
              <option value="">Select a market...</option>
              {filteredMarkets.map(market => (
                <option key={market.id} value={market.id}>
                  {market.name} ({(market.baselineProbability * 100).toFixed(0)}% expected)
                </option>
              ))}
            </select>
          </div>

          {/* Odds Input */}
          <div>
            <label className="mb-1 block text-sm font-medium">Odds</label>
            <input
              type="text"
              inputMode="decimal"
              value={odds}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9.]/g, '');
                setOdds(value);
              }}
              placeholder="e.g. 1.25"
              className="w-full rounded-lg border bg-background px-4 py-2 text-lg font-mono"
            />
            {selectedMarketId && odds && !isNaN(parseFloat(odds)) && parseFloat(odds) >= 1.01 && (
              <div className="mt-2 flex items-center gap-4 text-sm">
                <span className="text-muted-foreground">
                  Expected: {((markets.find(m => m.id === selectedMarketId)?.baselineProbability || 0) * 100).toFixed(0)}%
                </span>
                <span className="text-muted-foreground">
                  Implied: {(100 / parseFloat(odds)).toFixed(1)}%
                </span>
                {(markets.find(m => m.id === selectedMarketId)?.baselineProbability || 0) > (1 / parseFloat(odds)) && (
                  <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-xs text-green-500">
                    ✓ Value
                  </span>
                )}
              </div>
            )}
          </div>

          {formError && (
            <div className="rounded-lg bg-red-500/20 p-3 text-sm text-red-500">
              {formError}
            </div>
          )}

          <button
            type="button"
            onClick={addSelection}
            className="rounded-lg border-2 border-dashed border-primary py-4 text-primary hover:bg-primary/10 transition-colors font-medium"
          >
            + Add Selection to Bet Slip
          </button>
        </div>
      </div>

      {/* Bottom Cancel Button */}
      <div className="flex gap-4">
        <Link
          href={`/streams/${params.streamId}`}
          className="rounded-lg border px-6 py-3 hover:bg-accent transition-colors"
        >
          Cancel
        </Link>
        {selections.length === 0 && (
          <div className="flex-1 rounded-lg bg-muted py-3 text-center text-muted-foreground">
            Add selections above to place a bet
          </div>
        )}
      </div>
    </div>
  );
}