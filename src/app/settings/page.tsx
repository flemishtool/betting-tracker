'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface APIConfig {
  id: string;
  apiKey: string | null;
  baseUrl: string;
  requestsToday: number;
  requestsPerDay: number;
}

interface SyncResult {
  name: string;
  status: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const [config, setConfig] = useState<APIConfig | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [syncResults, setSyncResults] = useState<SyncResult[]>([]);
  const [testResult, setTestResult] = useState<any>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
        setApiKey(data.apiKey || '');
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  }

  async function saveApiKey() {
    setSaving(true);
    setMessage({ type: '', text: '' });
    setTestResult(null);

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey }),
      });

      if (res.ok) {
        const updated = await res.json();
        setConfig(updated);
        setMessage({ type: 'success', text: '✅ API key saved successfully!' });
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      setMessage({ type: 'error', text: '❌ Failed to save API key' });
    } finally {
      setSaving(false);
    }
  }

  async function testApiConnection() {
    setTesting(true);
    setMessage({ type: '', text: '' });
    setTestResult(null);

    try {
      // Save first if changed
      if (apiKey !== config?.apiKey) {
        await saveApiKey();
      }

      const res = await fetch('/api/settings/test', { method: 'POST' });
      const data = await res.json();

      setTestResult(data);

      if (data.success) {
        setMessage({ type: 'success', text: '✅ API connection successful!' });
      } else {
        setMessage({ type: 'error', text: `❌ API test failed: ${data.error}` });
      }
    } catch (error) {
      setMessage({ type: 'error', text: '❌ Failed to test API connection' });
    } finally {
      setTesting(false);
    }
  }

  async function syncAllLeagues() {
    if (!config?.apiKey) {
      setMessage({ type: 'error', text: '❌ Please save your API key first' });
      return;
    }

    setSyncing(true);
    setSyncResults([]);
    setMessage({ type: 'info', text: '⏳ Syncing all leagues... This takes 2-3 minutes. Please wait.' });

    try {
      const res = await fetch('/api/leagues/sync', { method: 'POST' });
      const data = await res.json();

      if (res.ok) {
        setMessage({ 
          type: 'success', 
          text: `✅ Synced ${data.success} of ${data.total} leagues!` 
        });
        if (data.results) {
          setSyncResults(data.results);
        }
        fetchSettings(); // Refresh to update request count
      } else {
        throw new Error(data.error || 'Sync failed');
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: `❌ ${error instanceof Error ? error.message : 'Failed to sync leagues'}` 
      });
    } finally {
      setSyncing(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-muted-foreground">Loading settings...</p>
      </div>
    );
  }

  const hasApiKey = !!(config?.apiKey);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Configure your application and API connections</p>
      </div>

      {/* Message Alert */}
      {message.text && (
        <div className={`rounded-lg p-4 ${
          message.type === 'success' ? 'bg-green-500/20 text-green-500' : 
          message.type === 'error' ? 'bg-red-500/20 text-red-500' :
          'bg-blue-500/20 text-blue-500'
        }`}>
          {message.text}
        </div>
      )}

      {/* API Configuration */}
      <div className="rounded-xl border bg-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">🔑 API-Football Configuration</h2>
          {hasApiKey ? (
            <span className="flex items-center gap-2 rounded-full bg-green-500/20 px-3 py-1 text-sm text-green-500">
              <span className="h-2 w-2 animate-pulse rounded-full bg-green-500"></span>
              Connected
            </span>
          ) : (
            <span className="flex items-center gap-2 rounded-full bg-red-500/20 px-3 py-1 text-sm text-red-500">
              <span className="h-2 w-2 rounded-full bg-red-500"></span>
              Not Connected
            </span>
          )}
        </div>
        
        <p className="mb-4 text-sm text-muted-foreground">
          Connect to API-Football to fetch real statistics for leagues.
          Get your API key from{' '}
          <a 
            href="https://www.api-football.com/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary underline"
          >
            api-football.com
          </a>
        </p>
        
        <div className="space-y-4">
          {/* API Key Input */}
          <div>
            <label className="mb-1 block text-sm font-medium">API Key</label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your API-Football key"
                  className="w-full rounded-lg border bg-background px-4 py-2 pr-16 font-mono text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded bg-muted px-2 py-1 text-xs hover:bg-accent"
                >
                  {showApiKey ? 'Hide' : 'Show'}
                </button>
              </div>
              <button
                onClick={saveApiKey}
                disabled={saving || !apiKey}
                className="rounded-lg bg-primary px-6 py-2 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
            
            {/* API Key Status */}
            {hasApiKey && (
              <div className="mt-2 flex items-center gap-2 text-sm text-green-500">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                API key is saved
              </div>
            )}
          </div>

          {/* Test Connection Button */}
          <div className="flex items-center gap-4">
            <button
              onClick={testApiConnection}
              disabled={testing || !apiKey}
              className="rounded-lg border px-4 py-2 hover:bg-accent disabled:opacity-50"
            >
              {testing ? '⏳ Testing...' : '🧪 Test Connection'}
            </button>
            
            {testResult && testResult.success && (
              <div className="text-sm text-green-500">
                ✓ Account: {testResult.subscription?.plan || 'Active'} | 
                Requests today: {testResult.requests?.current || 0}/{testResult.requests?.limit_day || 7500}
              </div>
            )}
          </div>

          {/* Test Result Details */}
          {testResult && (
            <div className={`rounded-lg p-4 text-sm ${testResult.success ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
              <h4 className="font-medium mb-2">
                {testResult.success ? '✅ Connection Test Passed' : '❌ Connection Test Failed'}
              </h4>
              {testResult.success ? (
                <div className="space-y-1 text-muted-foreground">
                  <p>Plan: <span className="text-foreground">{testResult.subscription?.plan || 'Pro'}</span></p>
                  <p>Daily Limit: <span className="text-foreground">{testResult.requests?.limit_day || 7500}</span></p>
                  <p>Used Today: <span className="text-foreground">{testResult.requests?.current || 0}</span></p>
                  <p>Sample Fixtures Retrieved: <span className="text-foreground">{testResult.sampleFixtures}</span></p>
                </div>
              ) : (
                <p className="text-red-500">{testResult.error}</p>
              )}
            </div>
          )}

          {/* API Usage Stats */}
          {config && (
            <div className="rounded-lg bg-muted p-4">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="font-medium">Local Request Counter</h3>
                <span className="text-sm text-muted-foreground">
                  {config.requestsToday} / {config.requestsPerDay} requests
                </span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-background">
                <div 
                  className={`h-full transition-all ${
                    (config.requestsToday / config.requestsPerDay) > 0.8 ? 'bg-red-500' :
                    (config.requestsToday / config.requestsPerDay) > 0.5 ? 'bg-yellow-500' :
                    'bg-green-500'
                  }`}
                  style={{ width: `${Math.min((config.requestsToday / config.requestsPerDay) * 100, 100)}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Pro Plan: 7,500 requests/day • Use &quot;Test Connection&quot; to see actual API usage
              </p>
            </div>
          )}
        </div>
      </div>

      {/* League Data Sync */}
      <div className="rounded-xl border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold">📊 Sync League Statistics</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Fetch real statistics from API-Football for all configured leagues.
          This includes average goals, Over 1.5/2.5 rates, and BTTS percentages.
          Data is cached and only updates when you click sync.
        </p>
        
        <div className="space-y-4">
          <button
            onClick={syncAllLeagues}
            disabled={syncing || !hasApiKey}
            className="w-full rounded-lg bg-primary px-6 py-4 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 sm:w-auto"
          >
            {syncing ? '⏳ Syncing... Please wait (2-3 minutes)' : '🔄 Sync All League Statistics'}
          </button>
          
          {!hasApiKey && (
            <p className="text-sm text-yellow-500">
              ⚠️ Please save and test your API key above before syncing
            </p>
          )}
          
          <p className="text-xs text-muted-foreground">
            ℹ️ Syncing uses approximately 80-90 API requests (tries 2024 and 2023 seasons)
          </p>
        </div>

        {/* Sync Results */}
        {syncResults.length > 0 && (
          <div className="mt-4 rounded-lg border p-4">
            <h4 className="mb-2 font-medium">Sync Results (showing first 20)</h4>
            <div className="max-h-60 space-y-1 overflow-y-auto text-sm">
              {syncResults.map((result, index) => (
                <div key={index} className={`flex justify-between ${result.status.startsWith('✓') ? 'text-green-500' : 'text-red-500'}`}>
                  <span>{result.name}</span>
                  <span className="text-xs">{result.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Default Preferences */}
      <div className="rounded-xl border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold">⚙️ Default Preferences</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          These values will be pre-filled when creating new streams.
        </p>
        
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium">Default Currency</label>
            <select className="w-full rounded-lg border bg-background px-4 py-2">
              <option value="GBP">GBP (£)</option>
              <option value="EUR">EUR (€)</option>
              <option value="USD">USD ($)</option>
            </select>
          </div>
          
          <div>
            <label className="mb-1 block text-sm font-medium">Default Initial Stake</label>
            <input
              type="number"
              defaultValue={50}
              className="w-full rounded-lg border bg-background px-4 py-2"
            />
          </div>
          
          <div>
            <label className="mb-1 block text-sm font-medium">Default Target Odds</label>
            <input
              type="number"
              step="0.01"
              defaultValue={1.10}
              className="w-full rounded-lg border bg-background px-4 py-2"
            />
          </div>
        </div>
        
        <button className="mt-4 rounded-lg bg-muted px-4 py-2 hover:bg-accent">
          Save Preferences
        </button>
      </div>

      {/* Data Management */}
      <div className="rounded-xl border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold">💾 Data Management</h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <h3 className="font-medium">Export All Data</h3>
              <p className="text-sm text-muted-foreground">Download streams, bets, and statistics</p>
            </div>
            <button className="rounded-lg border px-4 py-2 hover:bg-accent">
              Export JSON
            </button>
          </div>
          
          <div className="flex items-center justify-between rounded-lg border border-red-500/30 p-4">
            <div>
              <h3 className="font-medium text-red-500">Reset All Data</h3>
              <p className="text-sm text-muted-foreground">Delete all streams, bets, and start fresh</p>
            </div>
            <button 
              className="rounded-lg border border-red-500 px-4 py-2 text-red-500 hover:bg-red-500/10"
              onClick={() => {
                if (confirm('Are you sure? This will delete ALL your data!')) {
                  setMessage({ type: 'info', text: 'Reset disabled for safety. Use database reset commands if needed.' });
                }
              }}
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* About */}
      <div className="rounded-xl border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold">ℹ️ About</h2>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Betting Stream Tracker v1.0.0</p>
          <p>
            Track multiple concurrent betting streams with daily compounding and automatic cashout strategies.
          </p>
          <p>
            Statistics powered by{' '}
            <a href="https://www.api-football.com/" className="text-primary underline" target="_blank" rel="noopener noreferrer">
              API-Football
            </a>
            {' '}(Pro Plan: 7,500 requests/day)
          </p>
        </div>
      </div>
    </div>
  );
}