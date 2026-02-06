'use client';

import { useState, useEffect } from 'react';

interface MarketOpportunity {
  market: string;
  odds: number;
  impliedProbability: number;
  leagueRate: number | null;
  edge: number | null;
  rating: string;
}

interface FixtureOpportunity {
  fixtureId: string;
  apiFixtureId: number;
  homeTeam: string;
  awayTeam: string;
  league: string;
  country: string;
  kickoff: string;
  opportunities: MarketOpportunity[];
}

export default function OpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<FixtureOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    minOdds: 1.01,
    maxOdds: 1.50,
    days: 7,
  });
  const [stats, setStats] = useState({ count: 0, totalMarkets: 0 });

  const fetchOpportunities = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        minOdds: filters.minOdds.toString(),
        maxOdds: filters.maxOdds.toString(),
        days: filters.days.toString(),
      });
      const res = await fetch(`/api/opportunities?${params}`);
      const data = await res.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch opportunities');
      }
      
      setOpportunities(data.opportunities || []);
      setStats({ count: data.count, totalMarkets: data.totalMarkets });
    } catch (err: any) {
      setError(err.message);
      setOpportunities([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOpportunities();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOpportunities();
  };

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'Excellent Value': return 'text-green-400 bg-green-400/10 border-green-400/30';
      case 'Good Value': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30';
      case 'Fair Value': return 'text-blue-400 bg-blue-400/10 border-blue-400/30';
      case 'Low Odds': return 'text-gray-400 bg-gray-400/10 border-gray-400/30';
      case 'No Data': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30';
      default: return 'text-red-400 bg-red-400/10 border-red-400/30';
    }
  };

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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-white">Betting Opportunities</h1>
          <p className="text-gray-400">Find low-odds selections backed by league statistics</p>
        </div>
      </div>

      {/* Filters */}
      <form onSubmit={handleSearch} className="bg-[#1a1f2b] rounded-xl p-4 border border-gray-800">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-gray-400 text-sm mb-1">Min Odds</label>
            <input
              type="number"
              step="0.01"
              min="1.01"
              value={filters.minOdds}
              onChange={(e) => setFilters({ ...filters, minOdds: parseFloat(e.target.value) || 1.01 })}
              className="w-24 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-1">Max Odds</label>
            <input
              type="number"
              step="0.01"
              min="1.01"
              value={filters.maxOdds}
              onChange={(e) => setFilters({ ...filters, maxOdds: parseFloat(e.target.value) || 1.50 })}
              className="w-24 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-1">Days Ahead</label>
            <input
              type="number"
              min="1"
              max="14"
              value={filters.days}
              onChange={(e) => setFilters({ ...filters, days: parseInt(e.target.value) || 7 })}
              className="w-20 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-2 rounded-lg"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
          <div className="ml-auto text-gray-400 text-sm">
            Found <span className="text-white font-semibold">{stats.count}</span> fixtures with{' '}
            <span className="text-white font-semibold">{stats.totalMarkets}</span> opportunities
          </div>
        </div>
      </form>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400">
          {error}
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-400">Loading opportunities...</p>
        </div>
      ) : opportunities.length === 0 ? (
        <div className="bg-[#1a1f2b] rounded-xl p-12 border border-gray-800 text-center">
          <div className="text-5xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-white mb-2">No Opportunities Found</h3>
          <p className="text-gray-400 mb-4">
            No fixtures with odds between {filters.minOdds.toFixed(2)} and {filters.maxOdds.toFixed(2)} in the next {filters.days} days.
          </p>
          <p className="text-gray-500 text-sm">
            Try adjusting your filters or syncing fixtures from Settings.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {opportunities.map((fixture) => (
            <div key={fixture.fixtureId} className="bg-[#1a1f2b] rounded-xl border border-gray-800 overflow-hidden">
              {/* Fixture Header */}
              <div className="p-4 border-b border-gray-800">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {fixture.homeTeam} vs {fixture.awayTeam}
                    </h3>
                    <p className="text-gray-400 text-sm">
                      {fixture.league} • {fixture.country}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-medium">{formatDate(fixture.kickoff)}</div>
                  </div>
                </div>
              </div>

              {/* Markets */}
              <div className="p-4">
                <div className="flex flex-wrap gap-3">
                  {fixture.opportunities.map((opp, idx) => (
                    <div
                      key={idx}
                      className={`rounded-lg p-3 border ${getRatingColor(opp.rating)}`}
                    >
                      <div className="text-sm opacity-80">{opp.market}</div>
                      <div className="text-2xl font-bold">{opp.odds.toFixed(2)}</div>
                      <div className="text-xs mt-1 space-y-0.5">
                        <div>Implied: {(opp.impliedProbability * 100).toFixed(0)}%</div>
                        {opp.leagueRate !== null && (
                          <div>League: {(opp.leagueRate * 100).toFixed(0)}%</div>
                        )}
                        {opp.edge !== null && (
                          <div className={opp.edge > 0 ? 'text-green-400' : 'text-red-400'}>
                            Edge: {opp.edge > 0 ? '+' : ''}{(opp.edge * 100).toFixed(1)}%
                          </div>
                        )}
                      </div>
                      <div className="text-xs mt-2 font-medium">{opp.rating}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

