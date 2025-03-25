import { View, Text, StyleSheet, ScrollView, Pressable, Platform, RefreshControl } from 'react-native';
import { useAuth } from '@/providers/AuthProvider';
import { Package, Plus, Search, ChevronDown, Calendar, ShoppingBag, IndianRupee, RefreshCw } from 'lucide-react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useState, useEffect, useCallback } from 'react';
import { TextInput } from 'react-native';
import NewOrderModal from '@/components/NewOrderModal';
import { fetchDealerOrders } from '@/lib/api/orders';
import { fetchDealerByUserId } from '@/lib/api/dealers';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Cache keys
const CACHE_KEYS = {
  ORDERS: 'orders_cache',
  LAST_FETCH: 'orders_last_fetch',
};

// Cache duration (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

interface Order {
  id: string;
  product_name: string;
  quantity: number;
  total_price: number;
  status: string;
  created_at: string;
}

export default function Orders() {
  const { profile } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Load cached data
  const loadCachedData = useCallback(async () => {
    try {
      const lastFetch = await AsyncStorage.getItem(CACHE_KEYS.LAST_FETCH);
      const now = Date.now();
      
      if (lastFetch && now - parseInt(lastFetch) < CACHE_DURATION) {
        const cachedOrders = await AsyncStorage.getItem(CACHE_KEYS.ORDERS);
        if (cachedOrders) {
          setOrders(JSON.parse(cachedOrders));
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
  const saveToCache = useCallback(async (orders: Order[]) => {
    try {
      await Promise.all([
        AsyncStorage.setItem(CACHE_KEYS.ORDERS, JSON.stringify(orders)),
        AsyncStorage.setItem(CACHE_KEYS.LAST_FETCH, Date.now().toString())
      ]);
    } catch (error) {
      console.error('Error saving to cache:', error);
    }
  }, []);

  // Fetch fresh data
  const fetchOrders = useCallback(async () => {
    try {
      if (!profile?.user_id) {
        throw new Error('User ID not found');
      }

      const dealerData = await fetchDealerByUserId(profile.user_id);
      if (!dealerData) {
        throw new Error('Dealer not found');
      }

      const ordersData = await fetchDealerOrders(dealerData.id);
      setOrders(ordersData);
      await saveToCache(ordersData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  }, [profile?.user_id, saveToCache]);

  // Initial load
  useEffect(() => {
    if (profile?.user_id) {
      loadCachedData().then(hasCachedData => {
        if (!hasCachedData) {
          fetchOrders();
        }
      });
    }
  }, [profile?.user_id, loadCachedData, fetchOrders]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  }, [fetchOrders]);

  const handleOrderSuccess = () => {
    fetchOrders();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'processing':
        return '#f59e0b';
      case 'completed':
        return '#10b981';
      case 'canceled':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const filteredOrders = orders.filter(order =>
    order.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.titleContainer}>
            <View style={styles.titleIcon}>
              <Package size={24} color="#ffffff" strokeWidth={2.5} />
            </View>
            <View style={styles.titleWrapper}>
              <Text style={styles.headerTitle}>Orders</Text>
              <Text style={styles.headerSubtitle}>Manage your orders</Text>
            </View>
          </View>
          <Pressable
            style={styles.newOrderButton}
            onPress={() => setShowNewOrderModal(true)}>
            <Plus color="#ffffff" size={20} strokeWidth={2.5} />
            <Text style={styles.newOrderButtonText}>New Order</Text>
          </Pressable>
        </View>

        <View style={styles.searchContainer}>
          <Search size={20} color="#94a3b8" strokeWidth={2.5} />
          <TextInput
            placeholder="Search orders..."
            placeholderTextColor="#94a3b8"
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <Pressable style={styles.filterButton}>
            <Text style={styles.filterButtonText}>Filter</Text>
            <ChevronDown size={16} color="#4f46e5" strokeWidth={2.5} />
          </Pressable>
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
        {filteredOrders.map((order, index) => (
          <AnimatedPressable
            key={order.id}
            entering={FadeInUp.duration(300).delay(index * 100)}
            style={styles.orderCard}>
            <View style={styles.orderHeader}>
              <View style={styles.orderIcon}>
                <ShoppingBag size={20} color="#4f46e5" strokeWidth={2.5} />
              </View>
              <View style={styles.orderInfo}>
                <Text style={styles.orderId}>Order #{order.id}</Text>
                <View style={styles.dateContainer}>
                  <Calendar size={12} color="#64748b" strokeWidth={2.5} />
                  <Text style={styles.orderDate}>{formatDate(order.created_at)}</Text>
                </View>
              </View>
              <View style={[
                styles.statusBadge,
                { backgroundColor: `${getStatusColor(order.status)}15` }
              ]}>
                <Text style={[
                  styles.statusText,
                  { color: getStatusColor(order.status) }
                ]}>
                  {order.status.toUpperCase()}
                </Text>
              </View>
            </View>

            <View style={styles.orderDetails}>
              <Text style={styles.productName}>{order.product_name}</Text>
              <View style={styles.orderMetrics}>
                <View style={styles.metricItem}>
                  <ShoppingBag size={14} color="#64748b" strokeWidth={2.5} />
                  <Text style={styles.quantity}>Qty: {order.quantity}</Text>
                </View>
                <View style={styles.metricItem}>
                  <IndianRupee size={14} color="#4f46e5" strokeWidth={2.5} />
                  <Text style={styles.totalPrice}>{order.total_price.toFixed(2)}</Text>
                </View>
              </View>
            </View>
          </AnimatedPressable>
        ))}
      </ScrollView>

      <NewOrderModal
        visible={showNewOrderModal}
        onClose={() => setShowNewOrderModal(false)}
        onSuccess={handleOrderSuccess}
      />
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
  newOrderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  newOrderButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
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
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingLeft: 12,
    borderLeftWidth: 1,
    borderLeftColor: '#e2e8f0',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#4f46e5',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  orderCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  orderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  orderIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#e0e7ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderInfo: {
    flex: 1,
    marginLeft: 12,
  },
  orderId: {
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
  orderDate: {
    fontSize: 12,
    color: '#64748b',
    letterSpacing: 0.2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  orderDetails: {
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 16,
  },
  productName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#0f172a',
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  orderMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  quantity: {
    fontSize: 14,
    color: '#64748b',
    letterSpacing: 0.2,
  },
  totalPrice: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4f46e5',
    letterSpacing: 0.3,
  },
});