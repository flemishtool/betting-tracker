import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST() {
  try {
    // Get all unique leagueIds from selections
    const selectionsWithLeagues = await prisma.selection.findMany({
      where: {
        leagueId: {
          not: null,
        },
      },
      select: {
        leagueId: true,
      },
      distinct: ['leagueId'],
    });

    const leagueIds = selectionsWithLeagues
      .map(s => s.leagueId)
      .filter(Boolean) as string[];

    console.log('Found leagueIds in selections:', leagueIds);

    if (leagueIds.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No leagues found in bets',
        updated: 0,
      });
    }

    // First, reset all to not tracked
    await prisma.league.updateMany({
      data: {
        totalSelections: 0,
      },
    });

    // Count selections per league and update
    for (const leagueId of leagueIds) {
      const count = await prisma.selection.count({
        where: { leagueId },
      });

      await prisma.league.update({
        where: { id: leagueId },
        data: {
          totalSelections: count,
        },
      });
    }

    // Get updated leagues for response
    const trackedLeagues = await prisma.league.findMany({
      where: {
        id: { in: leagueIds },
      },
      select: {
        id: true,
        name: true,
        country: true,
        totalSelections: true,
      },
    });

    return NextResponse.json({
      success: true,
      trackedCount: leagueIds.length,
      leagues: trackedLeagues,
    });
  } catch (error) {
    console.error('Sync tracked error:', error);
    return NextResponse.json(
      { error: 'Failed to sync tracked leagues', details: String(error) },
      { status: 500 }
    );
  }
}