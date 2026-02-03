'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface BankrollData {
  total: number;
  available: number;
  deployed: number;
  profit: number;
}

export default function BankrollPage() {
  const [bankroll, setBankroll] = useState<BankrollData>({
    total: 0,
    available: 0,
    deployed: 0,
    profit: 0,
  });
  const [showModal, setShowModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBankroll();
  }, []);

  async function fetchBankroll() {
    try {
      const res = await fetch('/api/bankroll');
      if (res.ok) {
        const data = await res.json();
        // Handle different response structures
        setBankroll({
          total: data.total ?? data.totalBankroll ?? 0,
          available: data.available ?? data.availableCapital ?? 0,
          deployed: data.deployed ?? data.deployedInStreams ?? 0,
          profit: data.profit ?? data.totalProfit ?? 0,
        });
      }
    } catch (error) {
      console.error('Failed to fetch bankroll:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeposit() {
    const depositAmount = parseFloat(amount);
    if (isNaN(depositAmount) || depositAmount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/bankroll/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: depositAmount }),
      });

      if (res.ok) {
        await fetchBankroll();
        setShowModal(false);
        setAmount('');
      } else {
        alert('Failed to add funds');
      }
    } catch (error) {
      console.error('Deposit error:', error);
      alert('Failed to add funds');
    } finally {
      setLoading(false);
    }
  }

  // Safe number formatting
  const formatMoney = (value: number | undefined | null) => {
    const num = value ?? 0;
    return num.toFixed(2);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-muted-foreground">Loading bankroll data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <span>💰</span> Bankroll Management
        </h1>
        <p className="text-muted-foreground">Track and manage your betting capital</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Total Bankroll</p>
          <p className="text-2xl font-bold">£{formatMoney(bankroll.total)}</p>
        </div>
        <div className="bg-card border border-green-500/50 rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Available Capital</p>
          <p className="text-2xl font-bold text-green-500">£{formatMoney(bankroll.available)}</p>
        </div>
        <div className="bg-card border border-yellow-500/50 rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Deployed in Streams</p>
          <p className="text-2xl font-bold text-yellow-500">£{formatMoney(bankroll.deployed)}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Total Profit/Loss</p>
          <p className={`text-2xl font-bold ${(bankroll.profit ?? 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {(bankroll.profit ?? 0) >= 0 ? '+' : ''}£{formatMoney(bankroll.profit)}
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-card border border-border rounded-lg p-4">
        <h2 className="font-semibold mb-4">Quick Actions</h2>
        <div className="flex gap-3">
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium flex items-center gap-2"
          >
            <span>+</span> Add Funds
          </button>
          <Link
            href="/streams/new"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center gap-2"
          >
            <span>🌊</span> New Stream
          </Link>
        </div>
      </div>

      {/* Add Funds Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add Funds</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Amount (£)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                  placeholder="Enter amount"
                  autoFocus
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-border rounded-lg hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeposit}
                  disabled={loading}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium disabled:opacity-50"
                >
                  {loading ? 'Adding...' : 'Add Funds'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}