import prisma from '@/lib/prisma';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';

export default async function BankrollPage() {
  const bankroll = await prisma.bankroll.findFirst();

  if (!bankroll) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="text-6xl mb-4">💰</div>
        <h1 className="text-2xl font-bold mb-4">No Bankroll Found</h1>
        <p className="text-muted-foreground mb-6">Set up your bankroll in Settings first.</p>
        <Link 
          href="/settings" 
          className="rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground hover:bg-primary/90"
        >
          Go to Settings
        </Link>
      </div>
    );
  }

  const totalBankroll = bankroll.totalCapital;
  const availableCapital = bankroll.availableCapital;
  const deployedCapital = bankroll.deployedCapital;
  const totalProfit = totalBankroll - bankroll.totalDeposited + bankroll.totalWithdrawn;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">💰 Bankroll Management</h1>
        <p className="text-muted-foreground">Track and manage your betting capital</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-gradient-to-br from-primary/20 to-primary/5 p-6">
          <p className="text-sm text-muted-foreground">Total Bankroll</p>
          <p className="mt-1 text-3xl font-bold text-primary">
            {formatCurrency(totalBankroll, bankroll.currency)}
          </p>
        </div>

        <div className="rounded-xl border bg-gradient-to-br from-green-500/20 to-green-500/5 p-6">
          <p className="text-sm text-muted-foreground">Available Capital</p>
          <p className="mt-1 text-3xl font-bold text-green-500">
            {formatCurrency(availableCapital, bankroll.currency)}
          </p>
        </div>

        <div className="rounded-xl border bg-gradient-to-br from-blue-500/20 to-blue-500/5 p-6">
          <p className="text-sm text-muted-foreground">Deployed in Streams</p>
          <p className="mt-1 text-3xl font-bold text-blue-500">
            {formatCurrency(deployedCapital, bankroll.currency)}
          </p>
        </div>

        <div className={`rounded-xl border p-6 ${
          totalProfit >= 0 
            ? 'bg-gradient-to-br from-green-500/20 to-green-500/5' 
            : 'bg-gradient-to-br from-red-500/20 to-red-500/5'
        }`}>
          <p className="text-sm text-muted-foreground">Total Profit/Loss</p>
          <p className={`mt-1 text-3xl font-bold ${totalProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {totalProfit >= 0 ? '+' : ''}{formatCurrency(totalProfit, bankroll.currency)}
          </p>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-6">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="flex gap-4">
          <Link
            href="/settings"
            className="rounded-lg bg-green-600 px-6 py-3 font-medium text-white hover:bg-green-700"
          >
            ➕ Add Funds
          </Link>
          <Link
            href="/streams/new"
            className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700"
          >
            🌊 New Stream
          </Link>
        </div>
      </div>
    </div>
  );
}