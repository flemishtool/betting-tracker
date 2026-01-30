'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  hasApiKey: boolean;
}

export default function SyncLeaguesButton({ hasApiKey }: Props) {
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState('');

  async function handleSync() {
    if (!hasApiKey) {
      setMessage('⚠️ Please add your API key in Settings first');
      return;
    }

    setSyncing(true);
    setMessage('Syncing leagues... This may take 2-3 minutes.');

    try {
      const res = await fetch('/api/leagues/sync', { method: 'POST' });
      const data = await res.json();

      if (res.ok) {
        setMessage(`✅ Synced ${data.success} leagues successfully!`);
        // Refresh the page to show updated data
        router.refresh();
      } else {
        setMessage(`❌ ${data.error || 'Sync failed'}`);
      }
    } catch (error) {
      setMessage('❌ Sync failed. Please check your API key.');
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="text-right">
      <button
        onClick={handleSync}
        disabled={syncing || !hasApiKey}
        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {syncing ? '⏳ Syncing...' : '🔄 Sync from API'}
      </button>
      {message && (
        <p className={`mt-2 text-sm ${
          message.startsWith('✅') ? 'text-green-500' : 
          message.startsWith('❌') ? 'text-red-500' : 
          'text-yellow-500'
        }`}>
          {message}
        </p>
      )}
      {!hasApiKey && (
        <p className="mt-1 text-xs text-muted-foreground">
          Configure API key in Settings
        </p>
      )}
    </div>
  );
}