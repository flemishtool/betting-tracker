'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface MarketStat {
  market: string;
  totalBets: number;
  wonBets: number;
  lostBets: number;
  winRate: number;
  avgOdds: number;
}

interface Opportunity {
  fixtureId: string;
  homeTeam: string;
  awayTeam: string;
  kickoff: string;
  league: string;
  country: string;
  market: string;
  odds: number;
  probability: number;
  leagueRate: number | null;
}

const MARKET_EMOJI: Record<string, string> = {
  'Over 0.5 Goals': '⚽',
  'Over 1.5 Goals': '⚽',
  'Over 2.5 Goals': '⚽',
  'Over 3.5 Goals': '⚽',
  'Under 2.5 Goals': '🛡️',
  'Under 3.5 Goals': '🛡️',
  'BTTS Yes': '🎯',
  'BTTS No': '🚫',
  'Home Win': '🏠',
  'Away Win': '✈️',
  'Draw': '🤝',
  'Home or Draw': '✌️',
  'Away or Draw': '✌️',
  'Match Result': '⚽',
  'Asian Handicap': '📊',
  'Correct Score': '🔢',
  'Double Chance': '✌️',
};

export default function MarketsPage() {
  const [marketStats, setMarketStats] = useState<MarketStat[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [oppLoading, setOppLoading] = useState(true);
  const [oddsRange, setOddsRange] = useState({ min: 1.05, max: 1.35 });

  useEffect(() => {
    fetchMarketData();
    fetchOpportunities();
  }, []);

  useEffect(() => {
    fetchOpportunities();
  }, [oddsRange]);

  const fetchMarketData = async () => {
    try {
      const res = await fetch('/api/markets');
      if (res.ok) {
        const data = await res.json();
        setMarketStats(data.marketStats || []);
      }
    } catch (error) {
      console.error('Failed to fetch market data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOpportunities = async () => {
    setOppLoading(true);
    try {
      const res = await fetch(
        `/api/markets/opportunities?minOdds=${oddsRange.min}&maxOdds=${oddsRange.max}&days=3`
      );
      if (res.ok) {
        const data = await res.json();
        setOpportunities(data.opportunities || []);
      }
    } catch (error) {
      console.error('Failed to fetch opportunities:', error);
    } finally {
      setOppLoading(false);
    }
  };

  const topPerformers = marketStats
    .filter(m => m.totalBets >= 3)
    .sort((a, b) => b.winRate - a.winRate)
    .slice(0, 3);

  const needsReview = marketStats
    .filter(m => m.totalBets >= 3 && m.winRate < 60)
    .sort((a, b) => a.winRate - b.winRate)
    .slice(0, 3);

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
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">📊 Markets</h1>
        <p className="text-muted-foreground">
          Track performance and find betting opportunities
        </p>
      </div>

      {/* Performance Summary */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Top Performers */}
        <Card className="border-green-500/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              🔥 Top Performers
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-muted-foreground text-sm">Loading...</div>
            ) : topPerformers.length === 0 ? (
              <div className="text-muted-foreground text-sm">
                Need at least 3 settled bets per market to show stats
              </div>
            ) : (
              <div className="space-y-3">
                {topPerformers.map(market => (
                  <div
                    key={market.market}
                    className="flex items-center justify-between p-3 rounded-lg bg-green-500/10"
                  >
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        <span>{MARKET_EMOJI[market.market] || '📈'}</span>
                        {market.market}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {market.wonBets}/{market.totalBets} wins
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-green-500">
                        {market.winRate}%
                      </div>
                      <div className="text-xs text-muted-foreground">
                        avg {market.avgOdds.toFixed(2)} odds
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Needs Review */}
        <Card className="border-yellow-500/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              ⚠️ Needs Review
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-muted-foreground text-sm">Loading...</div>
            ) : needsReview.length === 0 ? (
              <div className="text-muted-foreground text-sm">
                All markets performing well! 🎉
              </div>
            ) : (
              <div className="space-y-3">
                {needsReview.map(market => (
                  <div
                    key={market.market}
                    className="flex items-center justify-between p-3 rounded-lg bg-yellow-500/10"
                  >
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        <span>{MARKET_EMOJI[market.market] || '📉'}</span>
                        {market.market}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {market.wonBets}/{market.totalBets} wins
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-yellow-500">
                        {market.winRate}%
                      </div>
                      <div className="text-xs text-muted-foreground">
                        avg {market.avgOdds.toFixed(2)} odds
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* All Market Stats */}
      {marketStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">📈 All Market Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 font-medium">Market</th>
                    <th className="text-center py-2 font-medium">Bets</th>
                    <th className="text-center py-2 font-medium">Won</th>
                    <th className="text-center py-2 font-medium">Lost</th>
                    <th className="text-center py-2 font-medium">Win Rate</th>
                    <th className="text-center py-2 font-medium">Avg Odds</th>
                  </tr>
                </thead>
                <tbody>
                  {marketStats.map(market => (
                    <tr key={market.market} className="border-b border-border/50">
                      <td className="py-2">
                        <span className="mr-2">{MARKET_EMOJI[market.market] || '📊'}</span>
                        {market.market}
                      </td>
                      <td className="text-center py-2">{market.totalBets}</td>
                      <td className="text-center py-2 text-green-500">{market.wonBets}</td>
                      <td className="text-center py-2 text-red-500">{market.lostBets}</td>
                      <td className="text-center py-2">
                        <span
                          className={
                            market.winRate >= 70
                              ? 'text-green-500'
                              : market.winRate >= 50
                              ? 'text-yellow-500'
                              : 'text-red-500'
                          }
                        >
                          {market.winRate}%
                        </span>
                      </td>
                      <td className="text-center py-2">{market.avgOdds.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Opportunities */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-lg">🎯 Upcoming Opportunities</CardTitle>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Odds:</span>
              <select
                value={oddsRange.min}
                onChange={e => setOddsRange(prev => ({ ...prev, min: parseFloat(e.target.value) }))}
                className="bg-background border rounded px-2 py-1"
              >
                <option value="1.01">1.01</option>
                <option value="1.05">1.05</option>
                <option value="1.10">1.10</option>
                <option value="1.15">1.15</option>
              </select>
              <span className="text-muted-foreground">to</span>
              <select
                value={oddsRange.max}
                onChange={e => setOddsRange(prev => ({ ...prev, max: parseFloat(e.target.value) }))}
                className="bg-background border rounded px-2 py-1"
              >
                <option value="1.20">1.20</option>
                <option value="1.25">1.25</option>
                <option value="1.30">1.30</option>
                <option value="1.35">1.35</option>
                <option value="1.50">1.50</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {oppLoading ? (
            <div className="text-muted-foreground text-sm">Loading opportunities...</div>
          ) : opportunities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <div className="text-4xl mb-2">🔍</div>
              <p>No opportunities found in the selected odds range.</p>
              <p className="text-sm mt-1">Try widening your odds range or sync more fixtures.</p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground mb-3">
                Found {opportunities.length} opportunities in next 3 days
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 font-medium">Match</th>
                      <th className="text-left py-2 font-medium">League</th>
                      <th className="text-left py-2 font-medium">Market</th>
                      <th className="text-center py-2 font-medium">Odds</th>
                      <th className="text-center py-2 font-medium">Prob</th>
                      <th className="text-left py-2 font-medium">Kickoff</th>
                    </tr>
                  </thead>
                  <tbody>
                    {opportunities.slice(0, 25).map((opp, idx) => (
                      <tr key={`${opp.fixtureId}-${opp.market}-${idx}`} className="border-b border-border/50 hover:bg-accent/50">
                        <td className="py-2">
                          <div className="font-medium">{opp.homeTeam}</div>
                          <div className="text-muted-foreground text-xs">vs {opp.awayTeam}</div>
                        </td>
                        <td className="py-2">
                          <div className="text-sm">{opp.league}</div>
                          <div className="text-xs text-muted-foreground">{opp.country}</div>
                        </td>
                        <td className="py-2">
                          <span className="mr-1">{MARKET_EMOJI[opp.market] || '📊'}</span>
                          {opp.market}
                        </td>
                        <td className="text-center py-2">
                          <span className="px-2 py-1 rounded bg-primary/20 font-mono font-bold">
                            {opp.odds.toFixed(2)}
                          </span>
                        </td>
                        <td className="text-center py-2">
                          <span className={opp.probability >= 80 ? 'text-green-500' : 'text-yellow-500'}>
                            {opp.probability}%
                          </span>
                        </td>
                        <td className="py-2 text-muted-foreground text-xs">
                          {formatDate(opp.kickoff)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {opportunities.length > 25 && (
                <div className="text-center text-sm text-muted-foreground mt-2">
                  Showing 25 of {opportunities.length} opportunities
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Market Types Reference */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">📚 Market Types Reference</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { name: 'Over 0.5 Goals', desc: 'At least 1 goal scored', prob: '~92%' },
              { name: 'Over 1.5 Goals', desc: 'At least 2 goals scored', prob: '~75%' },
              { name: 'Over 2.5 Goals', desc: 'At least 3 goals scored', prob: '~55%' },
              { name: 'BTTS Yes', desc: 'Both teams score', prob: '~55%' },
              { name: 'Home or Draw', desc: 'Double chance 1X', prob: '~65-75%' },
              { name: 'Away or Draw', desc: 'Double chance X2', prob: '~55-65%' },
            ].map(market => (
              <div
                key={market.name}
                className="p-3 rounded-lg border bg-card/50 hover:border-primary/50 transition-colors"
              >
                <div className="flex items-center gap-2 font-medium">
                  <span>{MARKET_EMOJI[market.name] || '📊'}</span>
                  {market.name}
                </div>
                <div className="text-sm text-muted-foreground mt-1">{market.desc}</div>
                <div className="text-xs text-primary mt-1">Typical: {market.prob}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
