'use client';

import { useState, useEffect, useMemo } from 'react';
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

interface BetSlipItem {
  fixtureId: string;
  fixture: string;
  market: string;
  odds: number;
  league: string;
  matchTime: string;
}

const STORAGE_KEY = 'betting-tracker-favorites';

export default function UpcomingFixturesPage() {
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'withOdds'>('all');
  const [countryFilter, setCountryFilter] = useState<string>('all');
  const [leagueFilter, setLeagueFilter] = useState<string>('all');
  const [favoriteCountries, setFavoriteCountries] = useState<string[]>([]);
  const [favoriteLeagues, setFavoriteLeagues] = useState<string[]>([]);
  const [collapsedCountries, setCollapsedCountries] = useState<Set<string>>(new Set());
  const [betSlip, setBetSlip] = useState<BetSlipItem[]>([]);
  const [groupByCountry, setGroupByCountry] = useState(true);

  // Load favorites from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const { countries, leagues } = JSON.parse(saved);
      setFavoriteCountries(countries || []);
      setFavoriteLeagues(leagues || []);
    }
  }, []);

  // Save favorites to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      countries: favoriteCountries,
      leagues: favoriteLeagues
    }));
  }, [favoriteCountries, favoriteLeagues]);

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

  const formatShortDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredFixtures = useMemo(() => {
    return fixtures.filter(f => {
      if (filter === 'withOdds' && (!f.odds || f.odds.length === 0)) return false;
      if (countryFilter !== 'all' && f.league?.country !== countryFilter) return false;
      if (leagueFilter !== 'all' && f.league?.name !== leagueFilter) return false;
      return true;
    });
  }, [fixtures, filter, countryFilter, leagueFilter]);

  const uniqueCountries = useMemo(() => {
    const countries = Array.from(new Set(fixtures.map(f => f.league?.country).filter((c): c is string => Boolean(c))));
    // Sort with favorites first
    return countries.sort((a, b) => {
      const aFav = favoriteCountries.includes(a);
      const bFav = favoriteCountries.includes(b);
      if (aFav && !bFav) return -1;
      if (!aFav && bFav) return 1;
      return a.localeCompare(b);
    });
  }, [fixtures, favoriteCountries]);

  const uniqueLeagues = useMemo(() => {
    const leagues = Array.from(new Set(fixtures.map(f => f.league?.name).filter((n): n is string => Boolean(n))));
    return leagues.sort((a, b) => {
      const aFav = favoriteLeagues.includes(a);
      const bFav = favoriteLeagues.includes(b);
      if (aFav && !bFav) return -1;
      if (!aFav && bFav) return 1;
      return a.localeCompare(b);
    });
  }, [fixtures, favoriteLeagues]);

  const fixturesByCountry = useMemo(() => {
    const grouped = new Map<string, Fixture[]>();
    filteredFixtures.forEach(f => {
      const country = f.league?.country || 'Unknown';
      if (!grouped.has(country)) grouped.set(country, []);
      grouped.get(country)!.push(f);
    });
    
    // Sort countries with favorites first
    const sortedEntries = Array.from(grouped.entries()).sort(([a], [b]) => {
      const aFav = favoriteCountries.includes(a);
      const bFav = favoriteCountries.includes(b);
      if (aFav && !bFav) return -1;
      if (!aFav && bFav) return 1;
      return a.localeCompare(b);
    });
    
    return new Map(sortedEntries);
  }, [filteredFixtures, favoriteCountries]);

  const toggleCountryCollapse = (country: string) => {
    setCollapsedCountries(prev => {
      const next = new Set(prev);
      if (next.has(country)) next.delete(country);
      else next.add(country);
      return next;
    });
  };

  const toggleFavoriteCountry = (country: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavoriteCountries(prev => 
      prev.includes(country) 
        ? prev.filter(c => c !== country)
        : [...prev, country]
    );
  };

  const toggleFavoriteLeague = (league: string) => {
    setFavoriteLeagues(prev => 
      prev.includes(league) 
        ? prev.filter(l => l !== league)
        : [...prev, league]
    );
  };

  const addToBetSlip = (fixture: Fixture, market: string, odds: number) => {
    const fixtureStr = `${fixture.homeTeamName} vs ${fixture.awayTeamName}`;
    
    // Check if already in slip
    const exists = betSlip.find(
      item => item.fixtureId === fixture.id && item.market === market
    );
    
    if (exists) {
      // Remove if clicking same selection
      setBetSlip(prev => prev.filter(
        item => !(item.fixtureId === fixture.id && item.market === market)
      ));
    } else {
      setBetSlip(prev => [...prev, {
        fixtureId: fixture.id,
        fixture: fixtureStr,
        market,
        odds,
        league: fixture.league?.name || 'Unknown',
        matchTime: fixture.kickoff
      }]);
    }
  };

  const isInBetSlip = (fixtureId: string, market: string) => {
    return betSlip.some(item => item.fixtureId === fixtureId && item.market === market);
  };

  const clearBetSlip = () => setBetSlip([]);

  const totalOdds = betSlip.reduce((acc, item) => acc * item.odds, 1);

  const countryFlags: Record<string, string> = {
    'England': '??????????????', 'Scotland': '??????????????', 'Wales': '??????????????',
    'Spain': '????', 'Germany': '????', 'Italy': '????', 'France': '????',
    'Netherlands': '????', 'Portugal': '????', 'Belgium': '????',
    'Turkey': '????', 'Greece': '????', 'Austria': '????', 'Switzerland': '????',
    'Poland': '????', 'Czech Republic': '????', 'Denmark': '????', 'Sweden': '????',
    'Norway': '????', 'Finland': '????', 'Russia': '????', 'Ukraine': '????',
    'Croatia': '????', 'Serbia': '????', 'Romania': '????', 'Ireland': '????',
    'USA': '????', 'Mexico': '????', 'Brazil': '????', 'Argentina': '????',
    'Australia': '????', 'Japan': '????', 'South Korea': '????', 'China': '????',
    'Saudi Arabia': '????', 'International': '??', 'Europe': '????',
  };

  const getFlag = (country: string) => countryFlags[country] || '???';

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">Loading fixtures...</div>
        </div>
      </div>
    );
  }

  const OddsButton = ({ fixture, market, odds, label }: { 
    fixture: Fixture; market: string; odds: number | null | undefined; label: string 
  }) => {
    if (!odds) return (
      <div className="bg-gray-700 rounded p-2 text-center opacity-50">
        <div className="text-xs text-gray-400">{label}</div>
        <div className="text-sm text-gray-500">-</div>
      </div>
    );
    
    const selected = isInBetSlip(fixture.id, market);
    
    return (
      <button
        onClick={() => addToBetSlip(fixture, market, odds)}
        className={`rounded p-2 text-center transition-all cursor-pointer hover:scale-105 ${
          selected 
            ? 'bg-green-600 ring-2 ring-green-400' 
            : 'bg-gray-700 hover:bg-gray-600'
        }`}
      >
        <div className="text-xs text-gray-300">{label}</div>
        <div className={`text-lg font-bold ${
          market.includes('Over') || market === 'BTTS Yes' ? 'text-green-400' : 
          market.includes('Under') || market === 'BTTS No' ? 'text-blue-400' : 
          'text-white'
        }`}>
          {odds.toFixed(2)}
        </div>
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Upcoming Fixtures</h1>
          <Link href="/" className="text-blue-400 hover:text-blue-300">
            Back to Dashboard
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-end">
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
              <label className="text-sm text-gray-400 block mb-1">Country</label>
              <select
                value={countryFilter}
                onChange={(e) => { setCountryFilter(e.target.value); setLeagueFilter('all'); }}
                className="bg-gray-700 rounded px-3 py-2 text-white min-w-[150px]"
              >
                <option value="all">All Countries</option>
                {uniqueCountries.map(country => (
                  <option key={country} value={country}>
                    {favoriteCountries.includes(country) ? '? ' : ''}{getFlag(country)} {country}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-400 block mb-1">League</label>
              <select
                value={leagueFilter}
                onChange={(e) => setLeagueFilter(e.target.value)}
                className="bg-gray-700 rounded px-3 py-2 text-white min-w-[180px]"
              >
                <option value="all">All Leagues</option>
                {uniqueLeagues.map(league => (
                  <option key={league} value={league}>
                    {favoriteLeagues.includes(league) ? '? ' : ''}{league}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={groupByCountry}
                  onChange={(e) => setGroupByCountry(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm text-gray-300">Group by country</span>
              </label>
            </div>
            <div className="ml-auto text-gray-400">
              {filteredFixtures.length} fixtures
            </div>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Main Content */}
          <div className="flex-1">
            {groupByCountry ? (
              // Grouped by country view
              <div className="space-y-4">
                {Array.from(fixturesByCountry.entries()).map(([country, countryFixtures]) => (
                  <div key={country} className="bg-gray-800 rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleCountryCollapse(country)}
                      className="w-full flex items-center justify-between p-4 hover:bg-gray-750 transition"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getFlag(country)}</span>
                        <span className="font-semibold text-lg">{country}</span>
                        <span className="text-gray-400 text-sm">({countryFixtures.length} fixtures)</span>
                        <button
                          onClick={(e) => toggleFavoriteCountry(country, e)}
                          className="text-xl hover:scale-110 transition"
                          title={favoriteCountries.includes(country) ? 'Remove from favorites' : 'Add to favorites'}
                        >
                          {favoriteCountries.includes(country) ? '?' : '?'}
                        </button>
                      </div>
                      <span className="text-gray-400 text-xl">
                        {collapsedCountries.has(country) ? '?' : '?'}
                      </span>
                    </button>
                    
                    {!collapsedCountries.has(country) && (
                      <div className="border-t border-gray-700">
                        {countryFixtures.map((fixture) => (
                          <FixtureCard 
                            key={fixture.id} 
                            fixture={fixture} 
                            formatDate={formatDate}
                            OddsButton={OddsButton}
                            favoriteLeagues={favoriteLeagues}
                            toggleFavoriteLeague={toggleFavoriteLeague}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              // Flat list view
              <div className="space-y-3">
                {filteredFixtures.map((fixture) => (
                  <div key={fixture.id} className="bg-gray-800 rounded-lg">
                    <FixtureCard 
                      fixture={fixture} 
                      formatDate={formatDate}
                      OddsButton={OddsButton}
                      favoriteLeagues={favoriteLeagues}
                      toggleFavoriteLeague={toggleFavoriteLeague}
                      showCountry
                    />
                  </div>
                ))}
              </div>
            )}

            {filteredFixtures.length === 0 && (
              <div className="text-center text-gray-500 py-12 bg-gray-800 rounded-lg">
                No fixtures found matching your criteria
              </div>
            )}
          </div>

          {/* Bet Slip Sidebar */}
          {betSlip.length > 0 && (
            <div className="w-80 flex-shrink-0">
              <div className="bg-gray-800 rounded-lg p-4 sticky top-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-lg">Bet Slip ({betSlip.length})</h3>
                  <button 
                    onClick={clearBetSlip}
                    className="text-sm text-red-400 hover:text-red-300"
                  >
                    Clear all
                  </button>
                </div>
                
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {betSlip.map((item, idx) => (
                    <div key={idx} className="bg-gray-700 rounded p-3">
                      <div className="text-sm text-gray-400">{item.league}</div>
                      <div className="font-medium text-sm">{item.fixture}</div>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-green-400">{item.market}</span>
                        <span className="font-bold">{item.odds.toFixed(2)}</span>
                      </div>
                      <button
                        onClick={() => setBetSlip(prev => prev.filter((_, i) => i !== idx))}
                        className="text-xs text-red-400 hover:text-red-300 mt-1"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-700">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-400">Total Odds:</span>
                    <span className="text-xl font-bold text-green-400">{totalOdds.toFixed(2)}</span>
                  </div>
                  <Link
                    href={`/streams?betSlip=${encodeURIComponent(JSON.stringify(betSlip))}`}
                    className="block w-full bg-green-600 hover:bg-green-500 text-center py-3 rounded font-semibold transition"
                  >
                    Add to Stream ?
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FixtureCard({ 
  fixture, 
  formatDate, 
  OddsButton,
  favoriteLeagues,
  toggleFavoriteLeague,
  showCountry = false
}: { 
  fixture: Fixture;
  formatDate: (d: string) => string;
  OddsButton: React.ComponentType<{ fixture: Fixture; market: string; odds: number | null | undefined; label: string }>;
  favoriteLeagues: string[];
  toggleFavoriteLeague: (league: string) => void;
  showCountry?: boolean;
}) {
  const odds = fixture.odds[0];
  
  return (
    <div className="p-4 border-b border-gray-700 last:border-b-0 hover:bg-gray-750 transition">
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="text-lg font-semibold">
            {fixture.homeTeamName} vs {fixture.awayTeamName}
          </div>
          <div className="text-sm text-gray-400 flex items-center gap-2">
            {showCountry && fixture.league?.country && (
              <span>{fixture.league.country} �</span>
            )}
            <span>{fixture.league?.name || 'Unknown League'}</span>
            {fixture.league?.name && (
              <button
                onClick={() => toggleFavoriteLeague(fixture.league!.name)}
                className="hover:scale-110 transition"
                title={favoriteLeagues.includes(fixture.league.name) ? 'Remove from favorites' : 'Add to favorites'}
              >
                {favoriteLeagues.includes(fixture.league.name) ? '?' : '?'}
              </button>
            )}
            <span>� {formatDate(fixture.kickoff)}</span>
          </div>
        </div>
      </div>

      {odds ? (
        <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
          <OddsButton fixture={fixture} market="Over 2.5" odds={odds.over25Goals} label="O2.5" />
          <OddsButton fixture={fixture} market="Under 2.5" odds={odds.under25Goals} label="U2.5" />
          <OddsButton fixture={fixture} market="BTTS Yes" odds={odds.bttsYes} label="BTTS Y" />
          <OddsButton fixture={fixture} market="BTTS No" odds={odds.bttsNo} label="BTTS N" />
          <OddsButton fixture={fixture} market="Home" odds={odds.homeWin} label="1" />
          <OddsButton fixture={fixture} market="Draw" odds={odds.draw} label="X" />
          <OddsButton fixture={fixture} market="Away" odds={odds.awayWin} label="2" />
        </div>
      ) : (
        <div className="text-gray-500 text-sm">No odds available</div>
      )}
    </div>
  );
}
