'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LeagueForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [country, setCountry] = useState('');
  const [tier, setTier] = useState('1');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !country.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/leagues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: name.trim(), 
          country: country.trim(),
          tier: parseInt(tier),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create league');
      }

      setName('');
      setCountry('');
      setTier('1');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create league');
    } finally {
      setIsSubmitting(false);
    }
  };

  const commonCountries = ['England', 'Spain', 'Germany', 'Italy', 'France', 'Portugal', 'Netherlands', 'Belgium', 'Scotland', 'Turkey'];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="block text-sm font-medium mb-1">League Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border bg-background px-4 py-2"
            placeholder="e.g., Premier League"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Country</label>
          <input
            type="text"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="w-full rounded-lg border bg-background px-4 py-2"
            placeholder="e.g., England"
            list="countries"
          />
          <datalist id="countries">
            {commonCountries.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Tier</label>
          <select
            value={tier}
            onChange={(e) => setTier(e.target.value)}
            className="w-full rounded-lg border bg-background px-4 py-2"
          >
            <option value="1">Tier 1 (Top League)</option>
            <option value="2">Tier 2 (Second Div)</option>
            <option value="3">Tier 3 (Lower)</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-500">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-lg bg-primary px-6 py-2 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {isSubmitting ? 'Adding...' : 'Add League'}
      </button>
    </form>
  );
}