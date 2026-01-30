import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const leagues = await prisma.league.findMany({ orderBy: { name: 'asc' } });
    return NextResponse.json(leagues);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch leagues' }, { status: 500 });
  }
}