'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  AreaChart,
} from 'recharts';

interface ChartDataPoint {
  date: string;
  balance: number;
  profit: number;
}

interface DashboardChartsProps {
  data: ChartDataPoint[];
  currency?: string;
  startingBalance?: number;
}

// Currency symbols map
const currencySymbols: Record<string, string> = {
  GBP: '£',
  USD: '$',
  EUR: '€',
  NGN: '₦',
};

export function BalanceChart({ data, currency = 'GBP', startingBalance = 0 }: DashboardChartsProps) {
  const symbol = currencySymbols[currency] || currency;
  
  // Calculate min/max for better chart scaling
  const values = data.map(d => d.balance);
  const minValue = Math.min(...values, startingBalance);
  const maxValue = Math.max(...values, startingBalance);
  const padding = (maxValue - minValue) * 0.1 || 10;

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis 
            dataKey="date" 
            stroke="#888"
            tick={{ fill: '#888', fontSize: 12 }}
          />
          <YAxis 
            stroke="#888"
            tick={{ fill: '#888', fontSize: 12 }}
            tickFormatter={(value) => `${symbol}${value.toLocaleString()}`}
            domain={[minValue - padding, maxValue + padding]}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1a1a2e',
              border: '1px solid #333',
              borderRadius: '8px',
            }}
            formatter={(value: number) => [`${symbol}${value.toFixed(2)}`, 'Balance']}
            labelStyle={{ color: '#888' }}
          />
          {/* Reference line at starting balance */}
          {startingBalance > 0 && (
            <ReferenceLine 
              y={startingBalance} 
              stroke="#888" 
              strokeDasharray="5 5"
              label={{ 
                value: `Start: ${symbol}${startingBalance}`, 
                fill: '#888', 
                fontSize: 11,
                position: 'right'
              }}
            />
          )}
          <Area
            type="monotone"
            dataKey="balance"
            stroke="#22c55e"
            strokeWidth={2}
            fill="url(#balanceGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ProfitChart({ data, currency = 'GBP' }: DashboardChartsProps) {
  const symbol = currencySymbols[currency] || currency;

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="profitGradientPos" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="profitGradientNeg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis 
            dataKey="date" 
            stroke="#888"
            tick={{ fill: '#888', fontSize: 12 }}
          />
          <YAxis 
            stroke="#888"
            tick={{ fill: '#888', fontSize: 12 }}
            tickFormatter={(value) => `${symbol}${value.toLocaleString()}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1a1a2e',
              border: '1px solid #333',
              borderRadius: '8px',
            }}
            formatter={(value: number) => [
              `${value >= 0 ? '+' : ''}${symbol}${value.toFixed(2)}`,
              'Profit/Loss'
            ]}
            labelStyle={{ color: '#888' }}
          />
          {/* Zero reference line - the break-even point */}
          <ReferenceLine 
            y={0} 
            stroke="#f59e0b" 
            strokeWidth={2}
            label={{ 
              value: 'Break Even', 
              fill: '#f59e0b', 
              fontSize: 11,
              position: 'right'
            }}
          />
          <Area
            type="monotone"
            dataKey="profit"
            stroke="#22c55e"
            strokeWidth={2}
            fill="url(#profitGradientPos)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// Combined export for backwards compatibility
export default function DashboardCharts(props: DashboardChartsProps) {
  return <BalanceChart {...props} />;
}