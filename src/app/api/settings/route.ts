export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    let config = await prisma.aPIConfig.findFirst();
    
    if (!config) {
      config = await prisma.aPIConfig.create({
        data: {
          id: 'default-config',
          baseUrl: 'https://v3.football.api-sports.io',
        },
      });
    }
    
    return NextResponse.json(config);
  } catch (error) {
    console.error('Failed to get settings:', error);
    return NextResponse.json({ error: 'Failed to get settings' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    let config = await prisma.aPIConfig.findFirst();
    
    if (!config) {
      config = await prisma.aPIConfig.create({
        data: {
          id: 'default-config',
          ...body,
        },
      });
    } else {
      config = await prisma.aPIConfig.update({
        where: { id: config.id },
        data: body,
      });
    }
    
    return NextResponse.json(config);
  } catch (error) {
    console.error('Failed to update settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
