'use client';

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface Props {
  cumulativeProfitData: any[];
  marketData: any[];
  streamData: any[];
  dayOfWeekData: any[];
  leagueData: any[];
}

const COLORS = ['#22c55e', '#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899'];

export default function AnalyticsCharts({
  cumulativeProfitData,
  marketData,
  streamData,
  dayOfWeekData,
  leagueData,
}: Props) {
  return (
    <div className="space-y-6">
      {/* Cumulative Profit Chart */}
      <div className="rounded-xl border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold">📈 Cumulative Profit Over Time</h2>
        {cumulativeProfitData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={cumulativeProfitData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="day" stroke="#888" />
              <YAxis stroke="#888" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                labelStyle={{ color: '#fff' }}
              />
              <Line 
                type="monotone" 
                dataKey="profit" 
                stroke="#22c55e" 
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-center text-muted-foreground py-12">No data yet. Place and settle some bets first.</p>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Win/Loss by Day of Week */}
        <div className="rounded-xl border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold">📅 Performance by Day</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={dayOfWeekData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="day" stroke="#888" />
              <YAxis stroke="#888" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
              />
              <Legend />
              <Bar dataKey="wins" fill="#22c55e" name="Wins" />
              <Bar dataKey="losses" fill="#ef4444" name="Losses" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Stream Performance */}
        <div className="rounded-xl border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold">🌊 Stream Cashouts</h2>
          {streamData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={streamData.slice(0, 8)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis type="number" stroke="#888" />
                <YAxis dataKey="name" type="category" stroke="#888" width={100} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                />
                <Bar dataKey="cashed" fill="#3b82f6" name="Cashed Out (£)" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-muted-foreground py-12">Create some streams first.</p>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Market Performance */}
        <div className="rounded-xl border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold">🎯 Market Win Rates</h2>
          {marketData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={marketData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis type="number" domain={[0, 100]} stroke="#888" />
                <YAxis dataKey="name" type="category" stroke="#888" width={120} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                  formatter={(value: number) => `${value}%`}
                />
                <Legend />
                <Bar dataKey="winRate" fill="#22c55e" name="Your Win %" />
                <Bar dataKey="expected" fill="#666" name="Expected %" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-muted-foreground py-12">No market data yet.</p>
          )}
        </div>

        {/* League Performance */}
        <div className="rounded-xl border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold">🏆 League Performance</h2>
          {leagueData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={leagueData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis type="number" domain={[0, 100]} stroke="#888" />
                <YAxis dataKey="name" type="category" stroke="#888" width={100} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                  formatter={(value: number, name: string) => 
                    name === 'winRate' ? `${value}%` : value
                  }
                />
                <Bar dataKey="winRate" fill="#8b5cf6" name="Win Rate %" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-muted-foreground py-12">No league data yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}