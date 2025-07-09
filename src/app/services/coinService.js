/**
 * @fileoverview Supabase Coin Service - Platform coin yönetimi
 * @module services/coinService
 */

import { supabase } from '../../lib/supabase';

/**
 * CoinService - Platform coin'leri için Supabase işlemleri
 */
export class CoinService {
  /**
   * Yeni coin'i veritabanına kaydet
   * @param {Object} coinData - Coin verisi
   * @returns {Promise<Object|null>} Kaydedilen coin verisi veya null
   */
  static async saveCoin(coinData) {
    try {
      const coinToSave = {
        name: coinData.name,
        symbol: coinData.symbol,
        description: coinData.description,
        contract_address: coinData.contract_address,
        image_url: coinData.image_url || coinData.imageUrl,
        creator_address: coinData.creator_address,
        creator_name: coinData.creator_name || coinData.creator_address,
        tx_hash: coinData.tx_hash,
        chain_id: coinData.chain_id || 8453, // Base mainnet default
        currency: coinData.currency || 'ZORA',
        payout_recipient: coinData.payout_recipient,
        initial_purchase_amount: coinData.initial_purchase_amount,
        created_on_platform: coinData.created_on_platform ?? true,
        metadata_uri: coinData.metadata_uri
      };

      console.log('💾 Saving coin to Supabase:', coinToSave);

      const { data, error } = await supabase
        .from('visionzcoins')
        .insert(coinToSave)
        .select()
        .single();

      if (error) {
        console.error('❌ Supabase save error:', error);
        throw error;
      }

      console.log('✅ Coin saved to database:', data);
      return data;
    } catch (error) {
      console.error('❌ Failed to save coin:', error);
      throw error;
    }
  }

  /**
   * Coin'in daha önce kaydedilip kaydedilmediğini kontrol et
   * @param {string} contractAddress - Contract adresi
   * @returns {Promise<boolean>} Var olup olmadığı
   */
  static async coinExists(contractAddress) {
    try {
      const { data, error } = await supabase
        .from('visionzcoins')
        .select('id')
        .eq('contract_address', contractAddress)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        throw error;
      }

      return !!data;
    } catch (error) {
      console.error('Error checking coin existence:', error);
      return false;
    }
  }

  /**
   * Platform coin'lerini getir (sayfalama ile)
   * @param {Object} params - Sorgu parametreleri
   * @returns {Promise<Array>} Coin listesi
   */
  static async getPlatformCoins(params = {}) {
    try {
          let query = supabase
      .from('visionzcoins')
      .select('*')
      .eq('created_on_platform', true)
      .order('created_at', { ascending: false });

      // Kategori filtresi (eğer gelecekte kategoriler eklenirse)
      if (params.category) {
        query = query.eq('category', params.category);
      }

      // Yaratıcı filtresi
      if (params.creator_address) {
        query = query.eq('creator_address', params.creator_address);
      }

      // Arama filtresi
      if (params.search) {
        query = query.or(`name.ilike.%${params.search}%,symbol.ilike.%${params.search}%,description.ilike.%${params.search}%`);
      }

      // Sayfalama
      if (params.limit) {
        query = query.limit(params.limit);
      }

      if (params.offset) {
        query = query.range(params.offset, (params.offset + (params.limit || 10)) - 1);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching platform coins:', error);
        throw error;
      }

      console.log(`📊 Fetched ${data?.length || 0} platform coins`);
      return data || [];
    } catch (error) {
      console.error('❌ Failed to fetch platform coins:', error);
      return [];
    }
  }

  /**
   * Son eklenen platform coin'lerini getir
   * @param {number} limit - Kaç coin getirilecek
   * @returns {Promise<Array>} Coin listesi
   */
  static async getLatestPlatformCoins(limit = 20) {
    return this.getPlatformCoins({ limit });
  }

  /**
   * Belirli bir yaratıcının coin'lerini getir
   * @param {string} creatorAddress - Yaratıcı adresi
   * @returns {Promise<Array>} Coin listesi
   */
  static async getCoinsByCreator(creatorAddress) {
    return this.getPlatformCoins({ creator_address: creatorAddress });
  }

  /**
   * Platform coin'leri için arama
   * @param {string} searchTerm - Arama terimi
   * @returns {Promise<Array>} Coin listesi
   */
  static async searchPlatformCoins(searchTerm) {
    return this.getPlatformCoins({ search: searchTerm, limit: 50 });
  }

  /**
   * Platform istatistiklerini getir
   * @returns {Promise<Object>} İstatistik verileri
   */
  static async getPlatformStats() {
    try {
          // Toplam coin sayısı
    const { count: totalCoins, error: countError } = await supabase
      .from('visionzcoins')
      .select('*', { count: 'exact', head: true })
      .eq('created_on_platform', true);

      if (countError) {
        throw countError;
      }

          // Benzersiz yaratıcı sayısı
    const { data: creatorsData, error: creatorsError } = await supabase
      .from('visionzcoins')
      .select('creator_address')
      .eq('created_on_platform', true);

      if (creatorsError) {
        throw creatorsError;
      }

      const uniqueCreators = new Set(creatorsData?.map(c => c.creator_address) || []);

      return {
        totalCoins: totalCoins || 0,
        totalCreators: uniqueCreators.size,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Failed to fetch platform stats:', error);
      return {
        totalCoins: 0,
        totalCreators: 0,
        lastUpdated: new Date().toISOString()
      };
    }
  }

  /**
   * Coin bilgilerini güncelle (örneğin price, volume vs.)
   * @param {string} contractAddress - Contract adresi
   * @param {Object} updateData - Güncellenecek veriler
   * @returns {Promise<Object|null>} Güncellenen coin verisi
   */
  static async updateCoin(contractAddress, updateData) {
    try {
          const { data, error } = await supabase
      .from('visionzcoins')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('contract_address', contractAddress)
      .select()
      .single();

      if (error) {
        console.error('Error updating coin:', error);
        throw error;
      }

      console.log('✅ Coin updated:', data);
      return data;
    } catch (error) {
      console.error('❌ Failed to update coin:', error);
      return null;
    }
  }
}

export default CoinService; 