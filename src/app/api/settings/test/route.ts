import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const API_BASE_URL = 'https://v3.football.api-sports.io';

export async function POST() {
  try {
    const config = await prisma.aPIConfig.findFirst();
    
    if (!config?.apiKey) {
      return NextResponse.json({ 
        success: false, 
        error: 'No API key configured' 
      });
    }
    
    // Test with status endpoint
    const statusResponse = await fetch(`${API_BASE_URL}/status`, {
      headers: {
        'x-apisports-key': config.apiKey,
      },
    });
    
    const statusData = await statusResponse.json();
    
    if (statusData.errors && Object.keys(statusData.errors).length > 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'API Key rejected',
        details: statusData.errors 
      });
    }
    
    // Test with a simple fixtures request (Premier League)
    const fixturesResponse = await fetch(
      `${API_BASE_URL}/fixtures?league=39&season=2024&last=5`,
      {
        headers: {
          'x-apisports-key': config.apiKey,
        },
      }
    );
    
    const fixturesData = await fixturesResponse.json();
    
    // Update request count
    await prisma.aPIConfig.update({
      where: { id: config.id },
      data: {
        requestsToday: config.requestsToday + 2,
        lastRequestAt: new Date(),
      },
    });
    
    return NextResponse.json({
      success: true,
      message: 'API connection successful!',
      account: statusData.response?.account || {},
      subscription: statusData.response?.subscription || {},
      requests: statusData.response?.requests || {},
      sampleFixtures: fixturesData.results || 0,
    });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}