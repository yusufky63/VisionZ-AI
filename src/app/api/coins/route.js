/**
 * @fileoverview API Routes for Platform Coins - CRUD operations
 * @module api/coins
 */

import { NextRequest, NextResponse } from 'next/server';
import { CoinService } from '../../services/coinService';

/**
 * GET - Platform coin'lerini getir
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    
    const creator = searchParams.get('creator');
    const search = searchParams.get('search');
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');

    const params = {
      ...(creator && { creator_address: creator }),
      ...(search && { search }),
      ...(limit && { limit: parseInt(limit) }),
      ...(offset && { offset: parseInt(offset) }),
    };

    console.log('🔍 API: Fetching platform coins with params:', params);

    const coins = await CoinService.getPlatformCoins(params);

    return NextResponse.json({
      success: true,
      data: coins,
      total: coins.length,
      message: `Found ${coins.length} platform coins`
    });
  } catch (error) {
    console.error('❌ API Error - GET coins:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch platform coins',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

/**
 * POST - Yeni coin kaydet
 */
export async function POST(request) {
  try {
    const body = await request.json();

    console.log('📝 API: Saving new coin:', body);

    // Gerekli alanları kontrol et
    const requiredFields = [
      'name', 
      'symbol', 
      'description', 
      'contract_address', 
      'creator_address', 
      'tx_hash'
    ];
    
    const missingFields = requiredFields.filter(field => !body[field]);

    if (missingFields.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields', 
          missingFields 
        },
        { status: 400 }
      );
    }

    // Coin daha önce kaydedilmiş mi kontrol et
    const existingCoin = await CoinService.coinExists(body.contract_address);
    if (existingCoin) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Coin with this contract address already exists',
          contract_address: body.contract_address
        },
        { status: 409 }
      );
    }

    const coin = await CoinService.saveCoin(body);

    return NextResponse.json({
      success: true,
      data: coin,
      message: 'Coin saved successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('❌ API Error - POST coin:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to save coin',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

/**
 * PUT - Coin bilgilerini güncelle
 */
export async function PUT(request) {
  try {
    const body = await request.json();
    const { contract_address, ...updateData } = body;

    if (!contract_address) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Contract address is required for update' 
        },
        { status: 400 }
      );
    }

    console.log('🔄 API: Updating coin:', contract_address, updateData);

    const updatedCoin = await CoinService.updateCoin(contract_address, updateData);

    if (!updatedCoin) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Coin not found or update failed' 
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedCoin,
      message: 'Coin updated successfully'
    });
  } catch (error) {
    console.error('❌ API Error - PUT coin:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update coin',
        details: error.message 
      },
      { status: 500 }
    );
  }
} 