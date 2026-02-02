export default function MarketsPage() {
  const marketTypes = [
    { name: 'Match Result', description: 'Home/Draw/Away', emoji: '⚽' },
    { name: 'Over/Under Goals', description: 'Total goals in match', emoji: '🥅' },
    { name: 'Both Teams to Score', description: 'BTTS Yes/No', emoji: '🎯' },
    { name: 'Asian Handicap', description: 'Handicap betting', emoji: '📊' },
    { name: 'Correct Score', description: 'Exact final score', emoji: '🔢' },
    { name: 'Double Chance', description: '1X, X2, 12', emoji: '✌️' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">📈 Markets</h1>
        <p className="text-muted-foreground">Available betting market types</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {marketTypes.map((market) => (
          <div
            key={market.name}
            className="rounded-xl border bg-card p-6 hover:border-primary/50 transition-colors"
          >
            <div className="text-4xl mb-3">{market.emoji}</div>
            <h3 className="font-semibold text-lg">{market.name}</h3>
            <p className="text-sm text-muted-foreground mt-1">{market.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}