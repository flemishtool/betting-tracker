import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { fixtureId, leagueId } = await request.json();
    
    const updated = await prisma.aPIFixture.update({
      where: { id: fixtureId },
      data: { leagueId },
      include: { league: true }
    });
    
    return NextResponse.json({
      success: true,
      fixture: {
        id: updated.id,
        match: `${updated.homeTeam} vs ${updated.awayTeam}`,
        league: updated.league?.name
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
