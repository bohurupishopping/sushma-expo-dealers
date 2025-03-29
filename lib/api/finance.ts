import { supabase } from '@/lib/supabase';
import { fetchDealerByUserId } from './dealers';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Cache keys
const CACHE_KEYS = {
  FINANCE: 'finance_cache',
  LAST_FETCH: 'finance_last_fetch',
};

// Cache duration (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

export interface Transaction {
  id: string;
  transaction_type: 'opening_balance' | 'payment' | 'order';
  amount: number;
  description: string;
  transaction_date: string;
  reference_id: string;
  created_at: string;
}

export interface DealerBalance {
  dealer_id: string;
  dealer_name: string;
  dealer_code: string;
  current_balance: number;
  last_transaction_date: string;
}

export interface DealerFinanceData {
  transactions: Transaction[];
  balance: DealerBalance;
}

// Helper function to check if cache is valid
async function isCacheValid(): Promise<boolean> {
  try {
    const lastFetch = await AsyncStorage.getItem(CACHE_KEYS.LAST_FETCH);
    if (!lastFetch) return false;
    
    const now = Date.now();
    return now - parseInt(lastFetch) < CACHE_DURATION;
  } catch (error) {
    console.error('Error checking cache validity:', error);
    return false;
  }
}

// Helper function to get cached data
async function getCachedData(): Promise<DealerFinanceData | null> {
  try {
    const cachedData = await AsyncStorage.getItem(CACHE_KEYS.FINANCE);
    if (cachedData) {
      return JSON.parse(cachedData);
    }
    return null;
  } catch (error) {
    console.error('Error getting cached data:', error);
    return null;
  }
}

// Helper function to save data to cache
async function saveToCache(data: DealerFinanceData): Promise<void> {
  try {
    await Promise.all([
      AsyncStorage.setItem(CACHE_KEYS.FINANCE, JSON.stringify(data)),
      AsyncStorage.setItem(CACHE_KEYS.LAST_FETCH, Date.now().toString())
    ]);
  } catch (error) {
    console.error('Error saving to cache:', error);
  }
}

export async function fetchDealerFinance(userId: string, forceRefresh = false): Promise<DealerFinanceData> {
  if (!userId) throw new Error('User ID is required');

  console.log('Fetching finance data for user:', userId);

  try {
    // Step 1: Get dealer data
    const dealerData = await fetchDealerByUserId(userId);
    console.log('Dealer data:', JSON.stringify(dealerData, null, 2));

    if (!dealerData) {
      throw new Error('Dealer not found');
    }

    // Step 2: Fetch transactions and balance in parallel
    const [transactionsResult, balanceResult] = await Promise.all([
      supabase
        .from('dealer_finance')
        .select(`
          id,
          transaction_type,
          amount,
          description,
          reference_id,
          transaction_date,
          created_at
        `)
        .eq('dealer_id', dealerData.id)
        .order('transaction_date', { ascending: false }),
      supabase
        .from('dealer_balances')
        .select('*')
        .eq('dealer_id', dealerData.id)
        .single()
    ]);

    // Check for errors
    if (transactionsResult.error) {
      console.error('Error fetching transactions:', transactionsResult.error);
      throw transactionsResult.error;
    }

    if (balanceResult.error) {
      console.error('Error fetching balance:', balanceResult.error);
      throw balanceResult.error;
    }

    // Transform the response
    const result = {
      transactions: transactionsResult.data || [],
      balance: balanceResult.data
    };

    console.log('Fetched finance data:', JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error('Error in fetchDealerFinance:', error);
    throw error;
  }
}

export async function fetchDealerTransactions(userId: string): Promise<Transaction[]> {
  if (!userId) throw new Error('User ID is required');

  console.log('Fetching transactions for user:', userId);

  try {
    // Get full finance data
    const financeData = await fetchDealerFinance(userId);
    return financeData.transactions;
  } catch (error) {
    console.error('Error in fetchDealerTransactions:', error);
    throw error;
  }
}

export async function fetchDealerBalance(userId: string): Promise<DealerBalance> {
  if (!userId) throw new Error('User ID is required');

  console.log('Fetching balance for user:', userId);

  try {
    // Get full finance data
    const financeData = await fetchDealerFinance(userId);
    return financeData.balance;
  } catch (error) {
    console.error('Error in fetchDealerBalance:', error);
    throw error;
  }
} 