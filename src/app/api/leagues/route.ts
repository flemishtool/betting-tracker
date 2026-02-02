import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const leagues = await prisma.league.findMany({
      orderBy: [{ country: 'asc' }, { name: 'asc' }],
    });
    return NextResponse.json(leagues);
  } catch (error) {
    console.error('Error fetching leagues:', error);
    return NextResponse.json({ error: 'Failed to fetch leagues' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, country } = body;

    if (!name || !country) {
      return NextResponse.json({ error: 'Name and country are required' }, { status: 400 });
    }

    // Check if league already exists
    const existing = await prisma.league.findFirst({
      where: {
        name: { equals: name, mode: 'insensitive' },
        country: { equals: country, mode: 'insensitive' },
      },
    });

    if (existing) {
      return NextResponse.json({ error: 'League already exists' }, { status: 400 });
    }

    const league = await prisma.league.create({
      data: {
        name,
        country,
        isActive: true,
      },
    });

    return NextResponse.json(league, { status: 201 });
  } catch (error) {
    console.error('Error creating league:', error);
    return NextResponse.json({ error: 'Failed to create league' }, { status: 500 });
  }
}