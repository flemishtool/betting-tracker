import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // Get all selections
    const selections = await prisma.selection.findMany({
      select: {
        id: true,
        leagueId: true,
        homeTeam: true,
        awayTeam: true,
      },
      take: 20,
    });

    // Get selections with non-null leagueId
    const withLeague = selections.filter(s => s.leagueId !== null);

    // Try to find the leagues for those IDs
    const leagueIds = withLeague.map(s => s.leagueId).filter(Boolean) as string[];
    
    let matchedLeagues: any[] = [];
    if (leagueIds.length > 0) {
      matchedLeagues = await prisma.league.findMany({
        where: {
          id: { in: leagueIds },
        },
        select: {
          id: true,
          name: true,
          country: true,
        },
      });
    }

    return NextResponse.json({
      totalSelections: selections.length,
      selectionsWithLeagueId: withLeague.length,
      leagueIds: leagueIds,
      matchedLeagues: matchedLeagues,
      sampleSelections: selections.slice(0, 5),
    });
  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
