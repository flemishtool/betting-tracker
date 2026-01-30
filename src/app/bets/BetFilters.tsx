'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useTransition } from 'react';

interface Stream {
  id: string;
  name: string;
}

interface Props {
  streams: Stream[];
  currentStatus: string;
  currentStream: string;
  currentSearch: string;
}

export default function BetFilters({ streams, currentStatus, currentStream, currentSearch }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(currentSearch);

  const updateFilters = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (value && value !== 'all') {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    startTransition(() => {
      router.push(`/bets?${params.toString()}`);
    });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters('search', search);
  };

  const clearFilters = () => {
    setSearch('');
    startTransition(() => {
      router.push('/bets');
    });
  };

  const hasFilters = currentStatus !== 'all' || currentStream !== 'all' || currentSearch;

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-end">
        {/* Search */}
        <div className="flex-1">
          <label className="mb-1 block text-sm font-medium">Search</label>
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search teams, leagues, markets..."
              className="flex-1 rounded-lg border bg-background px-4 py-2"
            />
            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {isPending ? '...' : 'Search'}
            </button>
          </form>
        </div>

        {/* Status Filter */}
        <div>
          <label className="mb-1 block text-sm font-medium">Status</label>
          <select
            value={currentStatus}
            onChange={(e) => updateFilters('status', e.target.value)}
            className="rounded-lg border bg-background px-4 py-2"
            disabled={isPending}
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="won">Won</option>
            <option value="lost">Lost</option>
          </select>
        </div>

        {/* Stream Filter */}
        <div>
          <label className="mb-1 block text-sm font-medium">Stream</label>
          <select
            value={currentStream}
            onChange={(e) => updateFilters('stream', e.target.value)}
            className="rounded-lg border bg-background px-4 py-2"
            disabled={isPending}
          >
            <option value="all">All Streams</option>
            {streams.map(stream => (
              <option key={stream.id} value={stream.id}>
                {stream.name}
              </option>
            ))}
          </select>
        </div>

        {/* Clear Filters */}
        {hasFilters && (
          <button
            onClick={clearFilters}
            disabled={isPending}
            className="rounded-lg border px-4 py-2 text-sm hover:bg-accent disabled:opacity-50"
          >
            Clear
          </button>
        )}
      </div>

      {isPending && (
        <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
      )}
    </div>
  );
}