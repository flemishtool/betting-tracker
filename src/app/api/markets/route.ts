export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // Get all market types
    const marketTypes = await prisma.marketType.findMany({
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });

    // Get selection stats grouped by market
    const selectionStats = await prisma.selection.groupBy({
      by: ['market'],
      _count: { id: true },
      _avg: { odds: true },
      where: {
        status: { in: ['won', 'lost'] },
      },
    });

    // Get won selections by market
    const wonStats = await prisma.selection.groupBy({
      by: ['market'],
      _count: { id: true },
      where: { status: 'won' },
    });

    // Combine stats
    const marketStats = selectionStats.map(stat => {
      const won = wonStats.find(w => w.market === stat.market)?._count.id || 0;
      const total = stat._count.id;
      const winRate = total > 0 ? (won / total) * 100 : 0;
      
      return {
        market: stat.market,
        totalBets: total,
        wonBets: won,
        lostBets: total - won,
        winRate: Math.round(winRate * 10) / 10,
        avgOdds: stat._avg.odds ? Math.round(stat._avg.odds * 100) / 100 : 0,
      };
    });

    return NextResponse.json({
      marketTypes,
      marketStats,
    });
  } catch (error) {
    console.error('Failed to fetch markets:', error);
    return NextResponse.json({ error: 'Failed to fetch markets' }, { status: 500 });
  }
}
