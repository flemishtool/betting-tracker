import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET single stream by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Fetching stream with ID:', params.id); // Debug log
    
    const stream = await prisma.stream.findUnique({
      where: { id: params.id },
      include: {
        bets: {
          include: {
            selections: true,
          },
          orderBy: { dayNumber: 'desc' },
        },
      },
    });

    if (!stream) {
      console.log('Stream not found for ID:', params.id); // Debug log
      return NextResponse.json({ error: 'Stream not found' }, { status: 404 });
    }

    return NextResponse.json(stream);
  } catch (error) {
    console.error('Failed to fetch stream:', error);
    return NextResponse.json({ error: 'Failed to fetch stream' }, { status: 500 });
  }
}

// PUT update stream
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    
    const stream = await prisma.stream.update({
      where: { id: params.id },
      data: body,
    });
    
    return NextResponse.json(stream);
  } catch (error) {
    console.error('Failed to update stream:', error);
    return NextResponse.json({ error: 'Failed to update stream' }, { status: 500 });
  }
}

// DELETE stream
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.stream.delete({
      where: { id: params.id },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete stream:', error);
    return NextResponse.json({ error: 'Failed to delete stream' }, { status: 500 });
  }
}