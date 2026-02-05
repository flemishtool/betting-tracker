'use client';

import Link from 'next/link';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface DashboardProps {
  data: {
    bankroll: { currentCapital: number; startingCapital: number } | null;
    streams: Array<{
      id: string;
      name: string;
      currentCapital: number | null;
      startingCapital: number | null;
      currentDay: number | null;
      dailyTarget: number | null;
    }>;
    recentBets: Array<{
      id: string;
      status: string;
      stake: number;
      totalOdds: number;
      profit: number | null;
      placedAt: string;
      selections: Array<{ homeTeam: string; awayTeam: string }>;
    }>;
    chartData: Array<{ date: string; balance: number; profit: number }>;
    stats: {
      totalBets: number;
      settledBets: number;
      wonBets: number;
      lostBets: number;
      winRate: string;
      pendingCount: number;
      totalStaked: number;
      totalProfit: number;
      streak: number;
      streakType: string;
    };
  };
}

export default function DashboardClient({ data }: DashboardProps) {
  const { bankroll, streams, recentBets, chartData, stats } = data;

  const currentCapital = bankroll?.currentCapital ?? 0;
  const startingCapital = bankroll?.startingCapital ?? 0;
  const netProfit = currentCapital - startingCapital;
  const roi = startingCapital > 0 ? ((netProfit / startingCapital) * 100).toFixed(1) : '0';
  const totalWithPending = currentCapital + stats.totalStaked;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400">Your betting performance at a glance</p>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="text-gray-400 text-sm">Available Capital</div>
          <div className="text-3xl font-bold text-green-400">£{currentCapital.toFixed(2)}</div>
          <div className="text-gray-500 text-sm">Total: £{totalWithPending.toFixed(2)}</div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="text-gray-400 text-sm">Net Profit/Loss</div>
          <div className={`text-3xl font-bold ${netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {netProfit >= 0 ? '+' : ''}£{netProfit.toFixed(2)}
          </div>
          <div className="text-gray-500 text-sm">ROI: {netProfit >= 0 ? '+' : ''}{roi}%</div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="text-gray-400 text-sm">Win Rate</div>
          <div className="text-3xl font-bold text-white">{stats.winRate}%</div>
          <div className="text-gray-500 text-sm">{stats.wonBets}W / {stats.lostBets}L of {stats.settledBets} settled</div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="text-gray-400 text-sm">Current Streak</div>
          <div className={`text-3xl font-bold ${stats.streakType === 'win' ? 'text-orange-400' : stats.streakType === 'lose' ? 'text-red-400' : 'text-gray-400'}`}>
            {stats.streak > 0 ? `${stats.streak} ${stats.streakType === 'win' ? '🔥' : '❄️'}` : '0'}
          </div>
          <div className="text-gray-500 text-sm">
            {stats.streakType === 'win' ? 'Winning streak!' : stats.streakType === 'lose' ? 'Losing streak' : 'No streak'}
          </div>
        </div>
      </div>

      {/* Charts Row */}
      {chartData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h2 className="text-lg font-semibold text-white mb-4">Balance Over Time</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} />
                  <YAxis stroke="#9CA3AF" fontSize={12} tickFormatter={(v) => `£${v}`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                    labelStyle={{ color: '#9CA3AF' }}
                    formatter={(value: number) => [`£${value.toFixed(2)}`, 'Balance']}
                  />
                  <ReferenceLine y={startingCapital} stroke="#6B7280" strokeDasharray="5 5" />
                  <Line type="monotone" dataKey="balance" stroke="#10B981" strokeWidth={2} dot={{ fill: '#10B981', strokeWidth: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h2 className="text-lg font-semibold text-white mb-4">Cumulative Profit/Loss</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} />
                  <YAxis stroke="#9CA3AF" fontSize={12} tickFormatter={(v) => `£${v}`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                    labelStyle={{ color: '#9CA3AF' }}
                    formatter={(value: number) => [`£${value.toFixed(2)}`, 'Profit']}
                  />
                  <ReferenceLine y={0} stroke="#EF4444" strokeDasharray="5 5" />
                  <Line type="monotone" dataKey="profit" stroke="#10B981" strokeWidth={2} dot={{ fill: '#10B981', strokeWidth: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Performance & Bet Results Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">📊 Performance Overview</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-700">
              <span className="text-gray-400">Total Bets Placed</span>
              <span className="text-white font-semibold">{stats.totalBets}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-700">
              <span className="text-gray-400">Total Amount Staked</span>
              <span className="text-white font-semibold">£{stats.totalStaked.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-700">
              <span className="text-gray-400">Total Profit/Loss</span>
              <span className={`font-semibold ${stats.totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {stats.totalProfit >= 0 ? '+' : ''}£{stats.totalProfit.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-700">
              <span className="text-gray-400">Average Stake</span>
              <span className="text-white font-semibold">
                £{stats.totalBets > 0 ? (stats.totalStaked / stats.totalBets).toFixed(2) : '0.00'}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-400">Profit Per Bet</span>
              <span className={`font-semibold ${stats.totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {stats.settledBets > 0 ? (stats.totalProfit >= 0 ? '+' : '') + '£' + (stats.totalProfit / stats.settledBets).toFixed(2) : '£0.00'}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">🎯 Bet Results</h2>
          {stats.settledBets > 0 ? (
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-green-400">Won</span>
                  <span className="text-green-400">{stats.wonBets} ({((stats.wonBets / stats.settledBets) * 100).toFixed(0)}%)</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-3">
                  <div className="bg-green-500 h-3 rounded-full" style={{ width: `${(stats.wonBets / stats.settledBets) * 100}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-red-400">Lost</span>
                  <span className="text-red-400">{stats.lostBets} ({((stats.lostBets / stats.settledBets) * 100).toFixed(0)}%)</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-3">
                  <div className="bg-red-500 h-3 rounded-full" style={{ width: `${(stats.lostBets / stats.settledBets) * 100}%` }} />
                </div>
              </div>
              {stats.pendingCount > 0 && (
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-yellow-400">Pending</span>
                    <span className="text-yellow-400">{stats.pendingCount}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-3">
                    <div className="bg-yellow-500 h-3 rounded-full animate-pulse" style={{ width: '100%' }} />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500"><p>No settled bets yet</p></div>
          )}
        </div>
      </div>

      {/* Active Streams */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">🌊 Active Streams</h2>
          <Link href="/streams" className="text-blue-400 hover:text-blue-300 text-sm">View all →</Link>
        </div>
        {streams.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No active streams</p>
            <Link href="/streams/new" className="text-blue-400 hover:text-blue-300 mt-2 inline-block">Create your first stream →</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {streams.map((stream) => {
              const capital = stream.currentCapital ?? stream.startingCapital ?? 0;
              const profit = capital - (stream.startingCapital ?? 0);
              return (
                <Link key={stream.id} href={`/streams/${stream.id}`} className="bg-gray-900 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-colors">
                  <h3 className="font-semibold text-white">{stream.name}</h3>
                  <div className="text-2xl font-bold text-green-400">£{capital.toFixed(2)}</div>
                  <div className={`text-sm ${profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {profit >= 0 ? '+' : ''}£{profit.toFixed(2)}
                  </div>
                  <div className="text-gray-500 text-sm mt-1">Day {stream.currentDay ?? 1} • Target: {stream.dailyTarget ?? 1.1}x</div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">📜 Recent Activity</h2>
          <Link href="/bets" className="text-blue-400 hover:text-blue-300 text-sm">View all bets →</Link>
        </div>
        {recentBets.length === 0 ? (
          <div className="text-center py-8 text-gray-500"><p>No bets yet</p></div>
        ) : (
          <div className="space-y-3">
            {recentBets.map((bet) => (
              <div key={bet.id} className="flex items-center justify-between py-3 border-b border-gray-700 last:border-0">
                <div className="flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full ${bet.status === 'won' ? 'bg-green-500' : bet.status === 'lost' ? 'bg-red-500' : 'bg-yellow-500'}`} />
                  <div>
                    <div className="text-white text-sm">
                      {bet.selections.length > 0 ? `${bet.selections[0].homeTeam} vs ${bet.selections[0].awayTeam}` : 'Bet'}
                      {bet.selections.length > 1 && ` +${bet.selections.length - 1} more`}
                    </div>
                    <div className="text-gray-500 text-xs">
                      {new Date(bet.placedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} • £{bet.stake.toFixed(2)} @ {bet.totalOdds.toFixed(2)}
                    </div>
                  </div>
                </div>
                <div className={`font-semibold ${bet.status === 'won' ? 'text-green-400' : bet.status === 'lost' ? 'text-red-400' : 'text-yellow-400'}`}>
                  {bet.status === 'pending' ? 'Pending' : bet.status === 'won' ? `+£${(bet.profit || 0).toFixed(2)}` : `-£${bet.stake.toFixed(2)}`}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
