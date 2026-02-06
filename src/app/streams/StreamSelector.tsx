'use client';

import { useRouter } from 'next/navigation';
import { formatCurrency } from '@/lib/utils';

interface Stream {
  id: string;
  name: string;
  currentBalance: number;
  currentDay: number;
}

interface StreamSelectorProps {
  streams: Stream[];
  betSlip: string;
}

export default function StreamSelector({ streams, betSlip }: StreamSelectorProps) {
  const router = useRouter();

  const handleSelectStream = (streamId: string) => {
    // Navigate to the bet form with the betSlip data
    router.push(`/bets/new/${streamId}?betSlip=${encodeURIComponent(betSlip)}`);
  };

  if (streams.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-12 text-center">
        <p className="text-muted-foreground">No active streams available</p>
        <button
          onClick={() => router.push('/streams/new')}
          className="mt-4 text-primary underline"
        >
          Create a new stream
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Choose a Stream</h2>
      {streams.map((stream) => (
        <button
          key={stream.id}
          onClick={() => handleSelectStream(stream.id)}
          className="w-full rounded-xl border bg-card p-6 text-left hover:border-primary transition-colors"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">{stream.name}</h3>
              <p className="text-sm text-muted-foreground">
                Day {stream.currentDay}
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold">{formatCurrency(stream.currentBalance)}</p>
              <p className="text-sm text-muted-foreground">Available</p>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
