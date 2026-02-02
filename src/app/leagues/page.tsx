import prisma from '@/lib/prisma';

export default async function LeaguesPage() {
  const leagues = await prisma.league.findMany({
    orderBy: [{ country: 'asc' }, { name: 'asc' }],
    include: {
      _count: { select: { selections: true } },
    },
  });

  const leaguesByCountry = leagues.reduce((acc, league) => {
    const country = league.country || 'Other';
    if (!acc[country]) acc[country] = [];
    acc[country].push(league);
    return acc;
  }, {} as Record<string, typeof leagues>);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">🏆 Leagues</h1>
        <p className="text-muted-foreground">Manage your tracked leagues ({leagues.length} total)</p>
      </div>

      <div className="space-y-6">
        {Object.entries(leaguesByCountry).map(([country, countryLeagues]) => (
          <div key={country} className="rounded-xl border bg-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{country}</h2>
              <span className="text-sm text-muted-foreground">{countryLeagues.length} leagues</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {countryLeagues.map((league) => (
                <div
                  key={league.id}
                  className="flex items-center justify-between rounded-lg border bg-muted/50 p-4"
                >
                  <div>
                    <p className="font-medium">{league.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {league._count.selections} selections
                    </p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    league.isActive 
                      ? 'bg-green-500/20 text-green-500' 
                      : 'bg-gray-500/20 text-gray-400'
                  }`}>
                    {league.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}

        {leagues.length === 0 && (
          <div className="rounded-xl border bg-card p-12 text-center text-muted-foreground">
            <div className="text-6xl mb-4">🏆</div>
            <p className="text-lg">No leagues yet</p>
            <p className="text-sm mt-1">Leagues will be created automatically when you add selections</p>
          </div>
        )}
      </div>
    </div>
  );
}