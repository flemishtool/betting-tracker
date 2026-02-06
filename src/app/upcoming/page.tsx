'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Fixture {
  id: string;
  homeTeamName: string;
  awayTeamName: string;
  kickoff: string;
  league: {
    id: string;
    name: string;
    country: string;
  } | null;
  odds: Array<{
    over25Goals: number | null;
    under25Goals: number | null;
    bttsYes: number | null;
    bttsNo: number | null;
    homeWin: number | null;
    draw: number | null;
    awayWin: number | null;
    bookmakerName: string;
  }>;
}

export default function UpcomingFixturesPage() {
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'withOdds'>('all');
  const [leagueFilter, setLeagueFilter] = useState<string>('all');

  useEffect(() => {
    fetch('/api/fixtures/upcoming')
      .then(res => res.json())
      .then(data => {
        setFixtures(data.fixtures || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
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

  const filteredFixtures = fixtures.filter(f => {
    if (filter === 'withOdds' && (!f.odds || f.odds.length === 0)) return false;
    if (leagueFilter !== 'all' && f.league?.name !== leagueFilter) return false;
    return true;
  });

  const uniqueLeagues = Array.from(new Set(fixtures.map(f => f.league?.name).filter((n): n is string => Boolean(n)))).sort();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">Loading fixtures...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Upcoming Fixtures</h1>
          <Link href="/" className="text-blue-400 hover:text-blue-300">
            Back to Dashboard
          </Link>
        </div>

        <div className="bg-gray-800 rounded-lg p-4 mb-6 flex flex-wrap gap-4">
          <div>
            <label className="text-sm text-gray-400 block mb-1">Show</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as 'all' | 'withOdds')}
              className="bg-gray-700 rounded px-3 py-2 text-white"
            >
              <option value="all">All Fixtures</option>
              <option value="withOdds">With Odds Only</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-400 block mb-1">League</label>
            <select
              value={leagueFilter}
              onChange={(e) => setLeagueFilter(e.target.value)}
              className="bg-gray-700 rounded px-3 py-2 text-white"
            >
              <option value="all">All Leagues</option>
              {uniqueLeagues.map(league => (
                <option key={league} value={league}>{league}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <span className="text-gray-400">
              Showing {filteredFixtures.length} of {fixtures.length} fixtures
            </span>
          </div>
        </div>

        <div className="grid gap-4">
          {filteredFixtures.map((fixture) => {
            const odds = fixture.odds[0];
            return (
              <div
                key={fixture.id}
                className="bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="text-lg font-semibold">
                      {fixture.homeTeamName} vs {fixture.awayTeamName}
                    </div>
                    <div className="text-sm text-gray-400">
                      {fixture.league?.name || 'Unknown League'} - {formatDate(fixture.kickoff)}
                    </div>
                  </div>
                </div>

                {odds ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                    <div className="bg-gray-700 rounded p-2 text-center">
                      <div className="text-xs text-gray-400">Over 2.5</div>
                      <div className="text-lg font-bold text-green-400">
                        {odds.over25Goals?.toFixed(2) || '-'}
                      </div>
                    </div>
                    <div className="bg-gray-700 rounded p-2 text-center">
                      <div className="text-xs text-gray-400">Under 2.5</div>
                      <div className="text-lg font-bold text-blue-400">
                        {odds.under25Goals?.toFixed(2) || '-'}
                      </div>
                    </div>
                    <div className="bg-gray-700 rounded p-2 text-center">
                      <div className="text-xs text-gray-400">BTTS Yes</div>
                      <div className="text-lg font-bold text-green-400">
                        {odds.bttsYes?.toFixed(2) || '-'}
                      </div>
                    </div>
                    <div className="bg-gray-700 rounded p-2 text-center">
                      <div className="text-xs text-gray-400">BTTS No</div>
                      <div className="text-lg font-bold text-blue-400">
                        {odds.bttsNo?.toFixed(2) || '-'}
                      </div>
                    </div>
                    {odds.homeWin && (
                      <>
                        <div className="bg-gray-700 rounded p-2 text-center">
                          <div className="text-xs text-gray-400">Home</div>
                          <div className="text-lg font-bold">{odds.homeWin.toFixed(2)}</div>
                        </div>
                        <div className="bg-gray-700 rounded p-2 text-center">
                          <div className="text-xs text-gray-400">Draw</div>
                          <div className="text-lg font-bold">{odds.draw?.toFixed(2) || '-'}</div>
                        </div>
                        <div className="bg-gray-700 rounded p-2 text-center">
                          <div className="text-xs text-gray-400">Away</div>
                          <div className="text-lg font-bold">{odds.awayWin?.toFixed(2) || '-'}</div>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="text-gray-500 text-sm mt-2">No odds available</div>
                )}
              </div>
            );
          })}
        </div>

        {filteredFixtures.length === 0 && (
          <div className="text-center text-gray-500 py-12">
            No fixtures found matching your criteria
          </div>
        )}
      </div>
    </div>
  );
}

