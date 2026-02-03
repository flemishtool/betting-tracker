'use client';

import { useState, useEffect } from 'react';

interface League {
  id: string;
  name: string;
  country: string;
  totalSelections: number;
  isActive: boolean;
  avgGoalsPerMatch: number | null;
}

interface GroupedLeagues {
  [country: string]: League[];
}

export default function LeaguesPage() {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'tracked'>('all');

  useEffect(() => {
    fetchLeagues();
  }, []);

  async function fetchLeagues() {
    try {
      const res = await fetch('/api/leagues');
      if (res.ok) {
        const data = await res.json();
        setLeagues(data);
      }
    } catch (error) {
      console.error('Failed to fetch leagues:', error);
    } finally {
      setLoading(false);
    }
  }

  async function syncTracked() {
    setSyncing(true);
    try {
      const res = await fetch('/api/leagues/sync-tracked', {
        method: 'POST',
      });
      const data = await res.json();
      console.log('Sync result:', data);
      
      // Refresh leagues
      await fetchLeagues();
      
      alert(`Synced! Found ${data.trackedCount || 0} leagues with bets.`);
    } catch (error) {
      console.error('Sync failed:', error);
      alert('Failed to sync leagues');
    } finally {
      setSyncing(false);
    }
  }

  // Filter leagues
  const filteredLeagues = filter === 'tracked'
    ? leagues.filter(l => (l.totalSelections || 0) > 0)
    : leagues;

  // Group by country
  const grouped: GroupedLeagues = filteredLeagues.reduce((acc, league) => {
    const country = league.country || 'Other';
    if (!acc[country]) acc[country] = [];
    acc[country].push(league);
    return acc;
  }, {} as GroupedLeagues);

  // Sort countries alphabetically
  const sortedCountries = Object.keys(grouped).sort();

  const trackedCount = leagues.filter(l => (l.totalSelections || 0) > 0).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-muted-foreground">Loading leagues...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <span>🏆</span> Leagues
          </h1>
          <p className="text-muted-foreground">
            {filteredLeagues.length} leagues ({trackedCount} with bets)
          </p>
        </div>
        <div className="flex gap-3">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'all' | 'tracked')}
            className="px-3 py-2 bg-card border border-border rounded-lg"
          >
            <option value="all">All Leagues</option>
            <option value="tracked">With Bets Only</option>
          </select>
          <button
            onClick={syncTracked}
            disabled={syncing}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50"
          >
            {syncing ? 'Syncing...' : 'Sync from Bets'}
          </button>
        </div>
      </div>

      {/* Leagues by Country */}
      <div className="space-y-6">
        {sortedCountries.map((country) => (
          <div key={country} className="bg-card border border-border rounded-lg p-4">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-semibold">{country}</h2>
              <span className="text-sm text-muted-foreground">
                {grouped[country].length} leagues
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {grouped[country].map((league) => (
                <div
                  key={league.id}
                  className={`p-3 rounded-lg border ${
                    (league.totalSelections || 0) > 0
                      ? 'border-green-500/50 bg-green-500/10'
                      : 'border-border bg-muted/30'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{league.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {league.totalSelections || 0} selections
                      </p>
                    </div>
                    {(league.totalSelections || 0) > 0 && (
                      <span className="px-2 py-0.5 bg-green-600 text-white text-xs rounded">
                        Active
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}