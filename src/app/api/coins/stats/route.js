/**
 * @fileoverview API Route for Platform Coin Statistics
 * @module api/coins/stats
 */

import { NextResponse } from 'next/server';
import { CoinService } from '../../../services/coinService';

/**
 * GET - Platform coin istatistiklerini getir
 */
export async function GET() {
  try {
    console.log('📊 API: Fetching platform coin statistics');

    const stats = await CoinService.getPlatformStats();

    return NextResponse.json({
      success: true,
      data: stats,
      message: 'Platform statistics retrieved successfully'
    });
  } catch (error) {
    console.error('❌ API Error - GET stats:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch platform statistics',
        details: error.message 
      },
      { status: 500 }
    );
  }
} 