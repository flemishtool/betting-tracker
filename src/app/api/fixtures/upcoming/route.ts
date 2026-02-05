import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const now = new Date();
    const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const fixtures = await prisma.aPIFixture.findMany({
      where: {
        kickoff: {
          gte: now,
          lte: weekFromNow,
        },
        statusShort: 'NS', // Not Started
      },
      include: {
        league: {
          select: {
            id: true,
            name: true,
            country: true,
          },
        },
        odds: {
          orderBy: { fetchedAt: 'desc' },
          take: 1, // Get most recent odds
        },
      },
      orderBy: { kickoff: 'asc' },
      take: 100,
    });

    return NextResponse.json({ 
      success: true, 
      count: fixtures.length,
      fixtures 
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
