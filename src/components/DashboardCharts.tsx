'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface ProfitData {
  name: string;
  profit: number;
  date: string;
}

interface Props {
  profitData: ProfitData[];
}

export default function DashboardCharts({ profitData }: Props) {
  if (!profitData || profitData.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        No data to display yet
      </div>
    );
  }

  const minProfit = Math.min(...profitData.map(d => d.profit));
  const maxProfit = Math.max(...profitData.map(d => d.profit));
  const padding = (maxProfit - minProfit) * 0.1 || 10;

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={profitData}>
          <defs>
            <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="lossGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="name"
            tick={{ fontSize: 12, fill: '#888' }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 12, fill: '#888' }}
            tickLine={false}
            axisLine={false}
            domain={[minProfit - padding, maxProfit + padding]}
            tickFormatter={(value) => `£${value.toFixed(0)}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(222.2 84% 4.9%)',
              border: '1px solid hsl(217.2 32.6% 17.5%)',
              borderRadius: '8px',
              color: '#fff',
            }}
            formatter={(value: number) => [`£${value.toFixed(2)}`, 'Profit']}
            labelFormatter={(label, payload) => payload[0]?.payload?.date || label}
          />
          <Area
            type="monotone"
            dataKey="profit"
            stroke={profitData[profitData.length - 1]?.profit >= 0 ? '#22c55e' : '#ef4444'}
            strokeWidth={2}
            fill={profitData[profitData.length - 1]?.profit >= 0 ? 'url(#profitGradient)' : 'url(#lossGradient)'}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}