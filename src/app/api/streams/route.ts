export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET all streams
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    
    const where = status ? { status } : {};
    
    const streams = await prisma.stream.findMany({
      where,
      include: {
        bets: {
          orderBy: { dayNumber: 'desc' },
          take: 5,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    
    return NextResponse.json(streams);
  } catch (error) {
    console.error('Failed to fetch streams:', error);
    return NextResponse.json({ error: 'Failed to fetch streams' }, { status: 500 });
  }
}

// POST create new stream
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      initialStake,
      targetDailyOdds = 1.10,
      reinvestmentPercentage = 0.80,
      cashoutPercentage = 0.20,
      targetBalance,
      targetDays,
    } = body;

    if (!name || !initialStake) {
      return NextResponse.json(
        { error: 'Name and initial stake are required' },
        { status: 400 }
      );
    }

    // Check bankroll
    const bankroll = await prisma.bankroll.findFirst();
    if (!bankroll) {
      return NextResponse.json({ error: 'Bankroll not set up' }, { status: 400 });
    }

    if (initialStake > bankroll.availableCapital) {
      return NextResponse.json(
        { error: `Insufficient funds. Available: ${bankroll.availableCapital}` },
        { status: 400 }
      );
    }

    // Create stream
    const stream = await prisma.stream.create({
      data: {
        name,
        initialStake,
        currentBalance: initialStake,
        targetDailyOdds,
        reinvestmentPercentage,
        cashoutPercentage,
        targetBalance,
        targetDays,
        status: 'active',
      },
    });

    // Update bankroll
    await prisma.bankroll.update({
      where: { id: bankroll.id },
      data: {
        availableCapital: bankroll.availableCapital - initialStake,
        deployedCapital: bankroll.deployedCapital + initialStake,
      },
    });

    return NextResponse.json(stream, { status: 201 });
  } catch (error) {
    console.error('Failed to create stream:', error);
    return NextResponse.json({ error: 'Failed to create stream' }, { status: 500 });
  }
}
