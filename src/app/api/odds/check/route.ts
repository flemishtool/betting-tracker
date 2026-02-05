export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const count = await prisma.aPIOdds.count();
    
    if (count === 0) {
      return NextResponse.json({ message: 'No odds in database', count: 0 });
    }

    const sample = await prisma.aPIOdds.findMany({
      take: 5,
    });

    return NextResponse.json({ count, sample });
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
}
