'use client';

import { useState, useEffect } from 'react';

interface Opportunity {
  fixtureId: string;
  apiFixtureId: number;
  homeTeam: string;
  awayTeam: string;
  kickoff: string;
  league: string;
  country: string;
  market: string;
  selection: string;
  odds: number;
  probability: number;
  leagueRate: number | null;
}

export default function OpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [minOdds, setMinOdds] = useState(1.01);
  const [maxOdds, setMaxOdds] = useState(1.50);
  const [days, setDays] = useState(7);
  const [syncing, setSyncing] = useState(false);

  const fetchOpportunities = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/markets/opportunities?minOdds=${minOdds}&maxOdds=${maxOdds}&days=${days}`
      );
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setOpportunities(data.opportunities || []);
      }
    } catch (err) {
      setError('Failed to fetch opportunities');
    } finally {
      setLoading(false);
    }
  };

  const syncFixtures = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/fixtures/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days: 14, fetchOdds: true, maxFixtures: 100 }),
      });
      const data = await res.json();
      alert(`Synced ${data.stats?.fixturesCreated || 0} new fixtures, ${data.stats?.oddsCreated || 0} odds`);
      fetchOpportunities();
    } catch (err) {
      alert('Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchOpportunities();
  }, []);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getValueIndicator = (odds: number, leagueRate: number | null) => {
    if (!leagueRate) return null;
    const impliedProb = 1 / odds;
    const edge = leagueRate - impliedProb;
    if (edge > 0.1) return { text: 'Great Value', color: 'text-green-400', bg: 'bg-green-900/30' };
    if (edge > 0.05) return { text: 'Good Value', color: 'text-blue-400', bg: 'bg-blue-900/30' };
    if (edge > 0) return { text: 'Fair', color: 'text-yellow-400', bg: 'bg-yellow-900/30' };
    return { text: 'Low Value', color: 'text-red-400', bg: 'bg-red-900/30' };
  };

  // Group by fixture
  const groupedByFixture = opportunities.reduce((acc, opp) => {
    const key = opp.fixtureId;
    if (!acc[key]) {
      acc[key] = {
        fixtureId: opp.fixtureId,
        homeTeam: opp.homeTeam,
        awayTeam: opp.awayTeam,
        kickoff: opp.kickoff,
        league: opp.league,
        country: opp.country,
        markets: [],
      };
    }
    acc[key].markets.push({
      market: opp.market,
      selection: opp.selection,
      odds: opp.odds,
      probability: opp.probability,
      leagueRate: opp.leagueRate,
    });
    return acc;
  }, {} as Record<string, any>);

  const fixtureGroups = Object.values(groupedByFixture).sort(
    (a: any, b: any) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime()
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">🎯 Betting Opportunities</h1>
            <p className="text-gray-400 mt-1">
              Low-odds selections backed by league statistics
            </p>
          </div>
          <button
            onClick={syncFixtures}
            disabled={syncing}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium disabled:opacity-50 flex items-center gap-2"
          >
            {syncing ? (
              <>
                <span className="animate-spin">⟳</span> Syncing...
              </>
            ) : (
              <>🔄 Sync Fixtures</>
            )}
          </button>
        </div>

        {/* Filters */}
        <div className="bg-gray-900 rounded-xl p-4 mb-6 flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Min Odds</label>
            <input
              type="number"
              step="0.01"
              value={minOdds}
              onChange={(e) => setMinOdds(parseFloat(e.target.value))}
              className="w-24 bg-gray-800 border border-gray-700 rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Max Odds</label>
            <input
              type="number"
              step="0.01"
              value={maxOdds}
              onChange={(e) => setMaxOdds(parseFloat(e.target.value))}
              className="w-24 bg-gray-800 border border-gray-700 rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Days Ahead</label>
            <input
              type="number"
              value={days}
              onChange={(e) => setDays(parseInt(e.target.value))}
              className="w-20 bg-gray-800 border border-gray-700 rounded px-3 py-2"
            />
          </div>
          <button
            onClick={fetchOpportunities}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-medium"
          >
            🔍 Search
          </button>
          <div className="ml-auto text-gray-400">
            Found <span className="text-white font-bold">{opportunities.length}</span> opportunities
          </div>
        </div>

        {/* Loading/Error States */}
        {loading && (
          <div className="text-center py-12 text-gray-400">
            <div className="animate-spin text-4xl mb-4">⟳</div>
            Loading opportunities...
          </div>
        )}

        {error && (
          <div className="bg-red-900/30 border border-red-700 rounded-xl p-4 text-red-300">
            {error}
          </div>
        )}

        {/* Results */}
        {!loading && !error && (
          <div className="space-y-4">
            {fixtureGroups.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <div className="text-4xl mb-4">📭</div>
                <p>No opportunities found with current filters.</p>
                <p className="text-sm mt-2">Try increasing max odds or syncing more fixtures.</p>
              </div>
            ) : (
              fixtureGroups.map((fixture: any) => (
                <div
                  key={fixture.fixtureId}
                  className="bg-gray-900 rounded-xl p-4 border border-gray-800 hover:border-gray-700 transition"
                >
                  {/* Match Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="text-lg font-semibold">
                        {fixture.homeTeam} vs {fixture.awayTeam}
                      </div>
                      <div className="text-sm text-gray-400">
                        {fixture.league} • {fixture.country}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-400">
                        {formatDate(fixture.kickoff)}
                      </div>
                    </div>
                  </div>

                  {/* Markets */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {fixture.markets
                      .sort((a: any, b: any) => a.odds - b.odds)
                      .map((market: any, idx: number) => {
                        const value = getValueIndicator(market.odds, market.leagueRate);
                        return (
                          <div
                            key={idx}
                            className={`bg-gray-800 rounded-lg p-3 ${value?.bg || ''}`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm text-gray-300">{market.market}</span>
                              <span className="text-lg font-bold text-green-400">
                                {market.odds.toFixed(2)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-500">
                                Implied: {market.probability}%
                              </span>
                              {market.leagueRate && (
                                <span className={value?.color || 'text-gray-400'}>
                                  League: {(market.leagueRate * 100).toFixed(0)}%
                                  {value && ` • ${value.text}`}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Legend */}
        <div className="mt-8 bg-gray-900 rounded-xl p-4">
          <h3 className="font-semibold mb-2">📊 How to Read This</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-green-400">●</span> Great Value: League rate {'>'}10% above implied
            </div>
            <div>
              <span className="text-blue-400">●</span> Good Value: League rate 5-10% above implied
            </div>
            <div>
              <span className="text-yellow-400">●</span> Fair: League rate matches odds
            </div>
            <div>
              <span className="text-red-400">●</span> Low Value: Odds overpriced vs stats
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
