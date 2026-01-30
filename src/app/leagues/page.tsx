import Link from 'next/link';
import prisma from '@/lib/prisma';
import { formatPercentage, formatDate } from '@/lib/utils';
import SyncLeaguesButton from './SyncLeaguesButton';

export const dynamic = 'force-dynamic';

export default async function LeaguesPage() {
  const [leagues, config] = await Promise.all([
    prisma.league.findMany({
      orderBy: [{ country: 'asc' }, { name: 'asc' }],
    }),
    prisma.aPIConfig.findFirst(),
  ]);

  // Group leagues by country
  const leaguesByCountry: Record<string, typeof leagues> = {};
  const internationalLeagues: typeof leagues = [];

  leagues.forEach(league => {
    if (league.country === 'Europe' || league.country === 'International') {
      internationalLeagues.push(league);
    } else {
      if (!leaguesByCountry[league.country]) {
        leaguesByCountry[league.country] = [];
      }
      leaguesByCountry[league.country].push(league);
    }
  });

  const sortedCountries = Object.keys(leaguesByCountry).sort();
  const hasApiKey = !!config?.apiKey;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Leagues</h1>
          <p className="text-muted-foreground">
            {leagues.length} leagues with historical statistics
          </p>
        </div>
        <SyncLeaguesButton hasApiKey={hasApiKey} />
      </div>

      {!hasApiKey && (
        <div className="rounded-xl border-2 border-yellow-500/50 bg-yellow-500/10 p-4">
          <p className="font-medium text-yellow-500">⚠️ API Key Not Configured</p>
          <p className="text-sm text-muted-foreground">
            Add your API-Football key in{' '}
            <Link href="/settings" className="text-primary underline">Settings</Link>
            {' '}to sync real statistics.
          </p>
        </div>
      )}

      {/* Countries */}
      {sortedCountries.map(country => (
        <div key={country} className="space-y-4">
          <h2 className="flex items-center gap-2 text-xl font-semibold">
            <span className="text-2xl">🏴</span> {country}
            <span className="text-sm font-normal text-muted-foreground">
              ({leaguesByCountry[country].length})
            </span>
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {leaguesByCountry[country].map(league => (
              <LeagueCard key={league.id} league={league} />
            ))}
          </div>
        </div>
      ))}

      {/* International */}
      {internationalLeagues.length > 0 && (
        <div className="space-y-4">
          <h2 className="flex items-center gap-2 text-xl font-semibold">
            <span className="text-2xl">🌍</span> International Competitions
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {internationalLeagues.map(league => (
              <LeagueCard key={league.id} league={league} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function LeagueCard({ league }: { league: any }) {
  return (
    <div className="rounded-xl border bg-card p-4 transition-colors hover:bg-accent/50">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold">{league.name}</h3>
          <p className="text-sm text-muted-foreground">{league.country}</p>
        </div>
      </div>
      
      <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-lg bg-muted p-2 text-center">
          <p className="text-xs text-muted-foreground">Avg Goals</p>
          <p className="text-lg font-bold">{league.avgGoalsPerMatch?.toFixed(2) || '-'}</p>
        </div>
        <div className="rounded-lg bg-muted p-2 text-center">
          <p className="text-xs text-muted-foreground">BTTS</p>
          <p className="text-lg font-bold">
            {league.bttsYesRate ? formatPercentage(league.bttsYesRate) : '-'}
          </p>
        </div>
        <div className="rounded-lg bg-muted p-2 text-center">
          <p className="text-xs text-muted-foreground">Over 1.5</p>
          <p className="text-lg font-bold">
            {league.over15GoalsRate ? formatPercentage(league.over15GoalsRate) : '-'}
          </p>
        </div>
        <div className="rounded-lg bg-muted p-2 text-center">
          <p className="text-xs text-muted-foreground">Over 2.5</p>
          <p className="text-lg font-bold">
            {league.over25GoalsRate ? formatPercentage(league.over25GoalsRate) : '-'}
          </p>
        </div>
        <div className="rounded-lg bg-muted p-2 text-center">
          <p className="text-xs text-muted-foreground">Over 3.5</p>
          <p className="text-lg font-bold">
            {league.over35GoalsRate ? formatPercentage(league.over35GoalsRate) : '-'}
          </p>
        </div>
        <div className="rounded-lg bg-muted p-2 text-center">
          <p className="text-xs text-muted-foreground">Over 0.5</p>
          <p className="text-lg font-bold">
            {league.over05GoalsRate ? formatPercentage(league.over05GoalsRate) : '-'}
          </p>
        </div>
      </div>

      <p className="mt-3 text-xs text-muted-foreground text-center">
        Updated: {formatDate(league.updatedAt)}
      </p>
    </div>
  );
}