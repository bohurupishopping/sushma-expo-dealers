import { View, Text, StyleSheet, ScrollView, Platform, RefreshControl } from 'react-native';
import { useAuth } from '@/providers/AuthProvider';
import { Receipt, Wallet, ShoppingCart, Calendar, Search, ChevronDown, ChevronUp, Loader2 } from 'lucide-react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchDealerFinance, Transaction, DealerBalance } from '@/lib/api/finance';

const AnimatedView = Animated.createAnimatedComponent(View);

// Cache keys
const CACHE_KEYS = {
  FINANCE: 'finance_cache',
  LAST_FETCH: 'finance_last_fetch',
};

// Cache duration (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

export default function Finance() {
  const { profile } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<keyof Transaction>('transaction_date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [dealerBalance, setDealerBalance] = useState<DealerBalance | null>(null);

  // Load cached data
  const loadCachedData = useCallback(async () => {
    try {
      const lastFetch = await AsyncStorage.getItem(CACHE_KEYS.LAST_FETCH);
      const now = Date.now();
      
      if (lastFetch && now - parseInt(lastFetch) < CACHE_DURATION) {
        const cachedData = await AsyncStorage.getItem(CACHE_KEYS.FINANCE);
        if (cachedData) {
          const parsedData = JSON.parse(cachedData);
          setTransactions(parsedData.transactions || []);
          setDealerBalance(parsedData.balance);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Error loading cached data:', error);
      return false;
    }
  }, []);

  // Save data to cache
  const saveToCache = useCallback(async (transactions: Transaction[], balance: DealerBalance) => {
    try {
      await Promise.all([
        AsyncStorage.setItem(CACHE_KEYS.FINANCE, JSON.stringify({ transactions, balance })),
        AsyncStorage.setItem(CACHE_KEYS.LAST_FETCH, Date.now().toString())
      ]);
    } catch (error) {
      console.error('Error saving to cache:', error);
    }
  }, []);

  // Fetch transactions and balance
  const fetchData = useCallback(async (forceRefresh = false) => {
    try {
      if (!profile?.user_id) {
        throw new Error('User ID not found');
      }

      const financeData = await fetchDealerFinance(profile.user_id, forceRefresh);
      setTransactions(financeData.transactions || []);
      setDealerBalance(financeData.balance);
      await saveToCache(financeData.transactions || [], financeData.balance);
      setError(null);
    } catch (err) {
      console.error('Error fetching finance data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [profile?.user_id, saveToCache]);

  // Initial load and auto-refresh
  useEffect(() => {
    let mounted = true;
    let refreshInterval: NodeJS.Timeout;

    const initializeData = async () => {
      if (!profile?.user_id) return;

      try {
        // First try to load cached data
        const hasCachedData = await loadCachedData();
        
        // Always fetch fresh data on page load
        if (mounted) {
          await fetchData(true);
        }

        // Set up auto-refresh every 5 minutes
        refreshInterval = setInterval(() => {
          if (mounted) {
            fetchData(true);
          }
        }, CACHE_DURATION);
      } catch (error) {
        console.error('Error in initial load:', error);
        if (mounted) {
          setError('Failed to load data');
          setTransactions([]);
        }
      }
    };

    initializeData();

    // Cleanup function
    return () => {
      mounted = false;
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [profile?.user_id, loadCachedData, fetchData]);

  // Handle manual refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData(true);
    setRefreshing(false);
  }, [fetchData]);

  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  }, []);

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  const getTransactionIcon = useCallback((type: string) => {
    switch (type) {
      case 'opening_balance':
        return <Wallet size={20} color="#3b82f6" strokeWidth={2.5} />;
      case 'payment':
        return <Receipt size={20} color="#10b981" strokeWidth={2.5} />;
      case 'order':
        return <ShoppingCart size={20} color="#f59e0b" strokeWidth={2.5} />;
      default:
        return <Receipt size={20} color="#6b7280" strokeWidth={2.5} />;
    }
  }, []);

  const getTransactionColor = useCallback((type: string) => {
    switch (type) {
      case 'opening_balance':
        return '#3b82f6';
      case 'payment':
        return '#10b981';
      case 'order':
        return '#f59e0b';
      default:
        return '#6b7280';
    }
  }, []);

  const handleSort = useCallback((field: keyof Transaction) => {
    setSortField(field);
    setSortDirection(prev => 
      prev === 'asc' && field === sortField ? 'desc' : 'asc'
    );
  }, [sortField]);

  const filteredTransactions = useMemo(() => {
    return transactions
      .filter(transaction =>
        transaction.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        transaction.reference_id.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a, b) => {
        const aValue = a[sortField];
        const bValue = b[sortField];
        const direction = sortDirection === 'asc' ? 1 : -1;
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return aValue.localeCompare(bValue) * direction;
        }
        return ((aValue as number) - (bValue as number)) * direction;
      });
  }, [transactions, searchQuery, sortField, sortDirection]);

  if (!profile?.user_id) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Please log in to view your finance data</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.titleContainer}>
            <View style={styles.titleIcon}>
              <Receipt size={24} color="#ffffff" strokeWidth={2.5} />
            </View>
            <View style={styles.titleWrapper}>
              <Text style={styles.headerTitle}>Finance</Text>
              <Text style={styles.headerSubtitle}>View your transaction history</Text>
            </View>
          </View>
        </View>

        <View style={styles.searchContainer}>
          <Search size={20} color="#94a3b8" strokeWidth={2.5} />
          <TextInput
            placeholder="Search transactions..."
            placeholderTextColor="#94a3b8"
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#4f46e5"
            colors={['#4f46e5']}
            progressBackgroundColor="#ffffff"
          />
        }>
        {dealerBalance && (
          <View style={styles.balanceCard}>
            <View style={styles.balanceHeader}>
              <Text style={styles.balanceTitle}>Current Balance</Text>
              <Wallet size={20} color="#4f46e5" strokeWidth={2.5} />
            </View>
            <Text style={[
              styles.balanceAmount,
              dealerBalance.current_balance > 0 ? styles.positiveBalance : styles.negativeBalance
            ]}>
              {formatCurrency(dealerBalance.current_balance)}
            </Text>
            <View style={styles.balanceFooter}>
              <Calendar size={12} color="#64748b" strokeWidth={2.5} />
              <Text style={styles.lastTransaction}>
                Last transaction: {formatDate(dealerBalance.last_transaction_date)}
              </Text>
            </View>
          </View>
        )}

        {loading ? (
          <View style={styles.loadingContainer}>
            <Loader2 size={24} color="#4f46e5" strokeWidth={2.5} />
            <Text style={styles.loadingText}>Loading transactions...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <Text style={styles.retryText} onPress={() => fetchData(true)}>
              Tap to retry
            </Text>
          </View>
        ) : filteredTransactions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Receipt size={48} color="#94a3b8" strokeWidth={2.5} />
            <Text style={styles.emptyText}>No transactions found</Text>
          </View>
        ) : (
          filteredTransactions.map((transaction, index) => (
            <AnimatedView
              key={transaction.id}
              entering={FadeInUp.duration(300).delay(index * 100)}
              style={styles.transactionCard}>
              <View style={styles.transactionHeader}>
                <View style={[styles.transactionIcon, { backgroundColor: `${getTransactionColor(transaction.transaction_type)}15` }]}>
                  {getTransactionIcon(transaction.transaction_type)}
                </View>
                <View style={styles.transactionInfo}>
                  <Text style={styles.transactionType}>
                    {transaction.transaction_type.replace('_', ' ').toUpperCase()}
                  </Text>
                  <View style={styles.dateContainer}>
                    <Calendar size={12} color="#64748b" strokeWidth={2.5} />
                    <Text style={styles.transactionDate}>
                      {formatDate(transaction.transaction_date)}
                    </Text>
                  </View>
                </View>
                <Text style={[
                  styles.transactionAmount,
                  transaction.transaction_type === 'payment' ? styles.negativeAmount : styles.positiveAmount
                ]}>
                  {transaction.transaction_type === 'payment' ? '-' : '+'}
                  {formatCurrency(transaction.amount)}
                </Text>
              </View>
              <Text style={styles.transactionDescription}>{transaction.description}</Text>
            </AnimatedView>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#4f46e5',
    paddingTop: Platform.OS === 'ios' ? 60 : Platform.OS === 'android' ? 48 : 20,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: Platform.OS === 'android' ? 4 : 0,
  },
  titleIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleWrapper: {
    gap: 4,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#e0e7ff',
    letterSpacing: 0.3,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#0f172a',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  balanceCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  balanceTitle: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  positiveBalance: {
    color: '#10b981',
  },
  negativeBalance: {
    color: '#ef4444',
  },
  balanceFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  lastTransaction: {
    fontSize: 12,
    color: '#64748b',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#64748b',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    gap: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#ef4444',
    textAlign: 'center',
  },
  retryText: {
    fontSize: 14,
    color: '#4f46e5',
    textDecorationLine: 'underline',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    padding: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748b',
  },
  transactionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  transactionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  transactionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionInfo: {
    flex: 1,
    marginLeft: 12,
  },
  transactionType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    letterSpacing: 0.3,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  transactionDate: {
    fontSize: 12,
    color: '#64748b',
    letterSpacing: 0.2,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  positiveAmount: {
    color: '#10b981',
  },
  negativeAmount: {
    color: '#ef4444',
  },
  transactionDescription: {
    fontSize: 14,
    color: '#64748b',
    letterSpacing: 0.2,
  },
}); 