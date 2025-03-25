import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  ScrollView,
  Pressable,
  Platform,
  ActivityIndicator,
  Dimensions,
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  Package, 
  ChevronDown, 
  ChevronUp, 
  X, 
  Plus, 
  CircleAlert as AlertCircle,
  Search,
  ArrowLeft,
  ChevronRight,
  ShoppingCart,
  IndianRupee,
  RefreshCw,
  AlertTriangle,
  Building2,
  Hash,
  FileText,
  User
} from 'lucide-react-native';
import Animated, { 
  FadeInUp, 
  FadeIn, 
  SlideInRight,
  withSpring,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolate,
  Extrapolate
} from 'react-native-reanimated';
import { useAuth } from '@/providers/AuthProvider';
import { fetchDealerDetails, createOrder } from '@/lib/api/orders';
import { fetchPriceChartByCode } from '@/lib/api/price-charts';
import { fetchPriceChartProducts, type Product } from '@/lib/api/products';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Cache keys
const CACHE_KEYS = {
  DEALER_DETAILS: 'dealer_details_cache',
  PRODUCTS: 'products_cache',
  LAST_FETCH: 'last_fetch_timestamp',
};

// Cache duration (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

interface DealerDetails {
  id: string;
  name: string;
  dealer_code: string;
  salesman_id: string | null;
  price_chart: {
    id: string;
    name: string;
    price_chart_code: string;
  } | null;
}

interface NewOrderModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function NewOrderModal({ visible, onClose, onSuccess }: NewOrderModalProps) {
  const { profile } = useAuth();
  const [dealerDetails, setDealerDetails] = useState<DealerDetails | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [notesExpanded, setNotesExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;
  const [showAllProducts, setShowAllProducts] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  // Animation values
  const dropdownHeight = useSharedValue(0);
  const dropdownOpacity = useSharedValue(0);
  const notesHeight = useSharedValue(0);

  // Animated styles
  const dropdownAnimatedStyle = useAnimatedStyle(() => ({
    height: dropdownHeight.value,
    opacity: dropdownOpacity.value,
  }));

  const notesAnimatedStyle = useAnimatedStyle(() => ({
    height: notesHeight.value,
    opacity: dropdownOpacity.value,
  }));

  // Load cached data
  const loadCachedData = useCallback(async () => {
    try {
      const lastFetch = await AsyncStorage.getItem(CACHE_KEYS.LAST_FETCH);
      const now = Date.now();
      
      if (lastFetch && now - parseInt(lastFetch) < CACHE_DURATION) {
        const [cachedDealer, cachedProducts] = await Promise.all([
          AsyncStorage.getItem(CACHE_KEYS.DEALER_DETAILS),
          AsyncStorage.getItem(CACHE_KEYS.PRODUCTS)
        ]);

        if (cachedDealer && cachedProducts) {
          setDealerDetails(JSON.parse(cachedDealer));
          setProducts(JSON.parse(cachedProducts));
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
  const saveToCache = useCallback(async (dealer: DealerDetails, products: Product[]) => {
    try {
      await Promise.all([
        AsyncStorage.setItem(CACHE_KEYS.DEALER_DETAILS, JSON.stringify(dealer)),
        AsyncStorage.setItem(CACHE_KEYS.PRODUCTS, JSON.stringify(products)),
        AsyncStorage.setItem(CACHE_KEYS.LAST_FETCH, Date.now().toString())
      ]);
    } catch (error) {
      console.error('Error saving to cache:', error);
    }
  }, []);

  // Fetch fresh data
  const fetchFreshData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!profile?.user_id) {
        throw new Error('User not authenticated');
      }

      const dealerData = await fetchDealerDetails(profile.user_id);
      setDealerDetails(dealerData);

      if (!dealerData.price_chart?.id) {
        throw new Error('No price chart assigned to dealer');
      }

      const products = await fetchPriceChartProducts(dealerData.price_chart.id);
      setProducts(products);

      // Save to cache
      await saveToCache(dealerData, products);
      setRetryCount(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
      if (retryCount < MAX_RETRIES) {
        setRetryCount(prev => prev + 1);
      }
    } finally {
      setLoading(false);
    }
  }, [profile?.user_id, retryCount, saveToCache]);

  // Initial load
  useEffect(() => {
    if (visible && profile?.user_id) {
      loadCachedData().then(hasCachedData => {
        if (!hasCachedData) {
          fetchFreshData();
        }
      });
    } else {
      resetForm();
    }
  }, [visible, profile?.user_id, loadCachedData, fetchFreshData]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchFreshData();
    setRefreshing(false);
  }, [fetchFreshData]);

  // Animate dropdown
  useEffect(() => {
    if (showProductDropdown) {
      dropdownHeight.value = withSpring(SCREEN_WIDTH * 0.8);
      dropdownOpacity.value = withTiming(1);
    } else {
      dropdownHeight.value = withSpring(0);
      dropdownOpacity.value = withTiming(0);
    }
  }, [showProductDropdown]);

  // Animate notes
  useEffect(() => {
    if (notesExpanded) {
      notesHeight.value = withSpring(120);
      dropdownOpacity.value = withTiming(1);
    } else {
      notesHeight.value = withSpring(0);
      dropdownOpacity.value = withTiming(0);
    }
  }, [notesExpanded]);

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setShowProductDropdown(false);
  };

  const calculateTotal = () => {
    if (selectedProduct && quantity) {
      const qty = Number(quantity);
      if (isNaN(qty) || qty <= 0) return 0;
      return qty * selectedProduct.price_per_unit;
    }
    return 0;
  };

  const validateOrder = () => {
    if (!dealerDetails) {
      throw new Error('Dealer details not found');
    }
    if (!selectedProduct) {
      throw new Error('Please select a product');
    }
    if (!quantity || isNaN(Number(quantity)) || Number(quantity) <= 0) {
      throw new Error('Please enter a valid quantity');
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      validateOrder();

      const orderData = {
        dealer_id: dealerDetails!.id,
        product_id: selectedProduct!.id,
        product_name: selectedProduct!.name,
        unit: selectedProduct!.unit,
        quantity: Number(quantity),
        price_chart_id: dealerDetails!.price_chart?.id || null,
        price_per_unit: selectedProduct!.price_per_unit,
        total_price: calculateTotal(),
        status: 'processing' as const,
        notes: notes.trim() || null
      };

      await createOrder(orderData);
      onSuccess();
      resetForm();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedProduct(null);
    setQuantity('');
    setNotes('');
    setNotesExpanded(false);
    setError(null);
    setProductSearchQuery('');
    setShowProductDropdown(false);
    setShowAllProducts(false);
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(productSearchQuery.toLowerCase())
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}>
      <View style={styles.container}>
        <Animated.View 
          entering={FadeIn.duration(300)}
          style={styles.header}>
          <Pressable style={styles.backButton} onPress={onClose}>
            <ArrowLeft size={24} color="#ffffff" strokeWidth={2.5} />
          </Pressable>
          <Text style={styles.headerTitle}>New Order</Text>
          <Pressable 
            style={styles.headerIcon}
            onPress={() => setShowProfileDropdown(!showProfileDropdown)}>
            <User size={24} color="#ffffff" strokeWidth={2.5} />
          </Pressable>
        </Animated.View>

        {showProfileDropdown && dealerDetails && (
          <Animated.View 
            entering={FadeIn.duration(200)}
            style={styles.profileDropdown}>
            <View style={styles.profileHeader}>
              <Building2 size={24} color="#6366f1" strokeWidth={2.5} />
              <Text style={styles.profileName}>{dealerDetails.name}</Text>
            </View>
            <View style={styles.profileInfo}>
              <View style={styles.profileInfoItem}>
                <View style={styles.profileInfoLabelContainer}>
                  <Hash size={16} color="#64748b" strokeWidth={2.5} />
                  <Text style={styles.profileInfoLabel}>Dealer Code</Text>
                </View>
                <Text style={styles.profileInfoValue}>{dealerDetails.dealer_code}</Text>
              </View>
              <View style={styles.profileInfoItem}>
                <View style={styles.profileInfoLabelContainer}>
                  <FileText size={16} color="#64748b" strokeWidth={2.5} />
                  <Text style={styles.profileInfoLabel}>Price Chart</Text>
                </View>
                <Text style={styles.profileInfoValue}>
                  {dealerDetails.price_chart?.name || 'Not assigned'}
                </Text>
              </View>
            </View>
          </Animated.View>
        )}

        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#6366f1"
              colors={['#6366f1']}
              progressBackgroundColor="#ffffff"
            />
          }>
          {error && (
            <Animated.View 
              entering={FadeIn.duration(300)}
              style={styles.errorContainer}>
              <AlertTriangle size={20} color="#ef4444" strokeWidth={2.5} />
              <Text style={styles.errorText}>{error}</Text>
              {retryCount < MAX_RETRIES && (
                <Pressable 
                  style={styles.retryButton}
                  onPress={fetchFreshData}>
                  <RefreshCw size={16} color="#ef4444" strokeWidth={2.5} />
                  <Text style={styles.retryText}>Retry</Text>
                </Pressable>
              )}
            </Animated.View>
          )}

          {loading && !dealerDetails ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#6366f1" />
              <Text style={styles.loadingText}>Loading dealer details...</Text>
            </View>
          ) : (
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Product Details</Text>
              
              <View style={styles.productGrid}>
                {filteredProducts.slice(0, showAllProducts ? undefined : 4).map((product) => (
                  <AnimatedPressable
                    key={product.id}
                    entering={FadeIn.duration(200)}
                    style={[
                      styles.productCard,
                      selectedProduct?.id === product.id && styles.selectedProductCard
                    ]}
                    onPress={() => handleProductSelect(product)}>
                    <Package size={20} color="#6366f1" strokeWidth={2.5} />
                    <Text style={styles.productCardName} numberOfLines={2}>
                      {product.name}
                    </Text>
                    <View style={styles.productCardPrice}>
                      <IndianRupee size={14} color="#6366f1" strokeWidth={2.5} />
                      <Text style={styles.productCardPriceText}>
                        {product.price_per_unit.toFixed(2)}
                      </Text>
                    </View>
                    <Text style={styles.productCardUnit}>{product.unit}</Text>
                  </AnimatedPressable>
                ))}
              </View>

              {filteredProducts.length > 4 && (
                <Pressable
                  style={styles.showMoreButton}
                  onPress={() => setShowAllProducts(!showAllProducts)}>
                  <Text style={styles.showMoreText}>
                    {showAllProducts ? 'Show Less' : `Show ${filteredProducts.length - 4} More`}
                  </Text>
                  {showAllProducts ? (
                    <ChevronUp size={16} color="#6366f1" strokeWidth={2.5} />
                  ) : (
                    <ChevronDown size={16} color="#6366f1" strokeWidth={2.5} />
                  )}
                </Pressable>
              )}

              {selectedProduct && (
                <View style={styles.selectedProductInfo}>
                  <View style={styles.selectedProductHeader}>
                    <Package size={20} color="#6366f1" strokeWidth={2.5} />
                    <Text style={styles.selectedProductName}>{selectedProduct.name}</Text>
                  </View>
                  <View style={styles.selectedProductMeta}>
                    <Text style={styles.selectedProductUnit}>{selectedProduct.unit}</Text>
                    <View style={styles.selectedProductPrice}>
                      <IndianRupee size={16} color="#6366f1" strokeWidth={2.5} />
                      <Text style={styles.selectedProductPriceText}>
                        {selectedProduct.price_per_unit.toFixed(2)}
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              <View style={styles.quantityContainer}>
                <Text style={styles.inputLabel}>Quantity</Text>
                <TextInput
                  style={styles.quantityInput}
                  keyboardType="numeric"
                  placeholder="Enter quantity"
                  value={quantity}
                  onChangeText={setQuantity}
                />
              </View>

              {selectedProduct && quantity && (
                <Animated.View 
                  entering={FadeInUp.duration(300)}
                  style={styles.totalContainer}>
                  <Text style={styles.totalLabel}>Total Amount</Text>
                  <View style={styles.totalValue}>
                    <IndianRupee size={20} color="#10b981" strokeWidth={2.5} />
                    <Text style={styles.totalText}>{calculateTotal().toFixed(2)}</Text>
                  </View>
                </Animated.View>
              )}

              <Pressable
                style={styles.notesToggle}
                onPress={() => setNotesExpanded(!notesExpanded)}>
                <View style={styles.notesToggleContent}>
                  <Plus size={20} color="#6366f1" strokeWidth={2.5} />
                  <Text style={styles.notesToggleText}>Additional Notes</Text>
                </View>
                {notesExpanded ? (
                  <ChevronUp size={20} color="#6366f1" strokeWidth={2.5} />
                ) : (
                  <ChevronDown size={20} color="#6366f1" strokeWidth={2.5} />
                )}
              </Pressable>

              <Animated.View 
                style={[styles.notesContainer, notesAnimatedStyle]}>
                <TextInput
                  style={styles.notesInput}
                  placeholder="Add any special instructions or notes"
                  multiline
                  numberOfLines={4}
                  value={notes}
                  onChangeText={setNotes}
                  textAlignVertical="top"
                />
              </Animated.View>
            </View>
          )}
        </ScrollView>

        <Animated.View 
          entering={FadeInUp.duration(300)}
          style={styles.footer}>
          <Pressable
            style={[styles.button, styles.cancelButton]}
            onPress={onClose}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </Pressable>
          <Pressable
            style={[styles.button, styles.submitButton]}
            onPress={handleSubmit}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <View style={styles.submitButtonContent}>
                <ShoppingCart size={20} color="#ffffff" strokeWidth={2.5} />
                <Text style={styles.submitButtonText}>Place Order</Text>
              </View>
            )}
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: 16,
    backgroundColor: '#6366f1',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#fee2e2',
  },
  errorText: {
    marginLeft: 12,
    color: '#ef4444',
    flex: 1,
    fontSize: 14,
    letterSpacing: 0.3,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginLeft: 12,
  },
  retryText: {
    marginLeft: 4,
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '500',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#64748b',
    fontSize: 14,
    letterSpacing: 0.3,
  },
  dealerCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#e0e7ff',
  },
  dealerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  dealerName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
    letterSpacing: 0.5,
  },
  dealerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 24,
  },
  dealerInfoItem: {
    flex: 1,
  },
  dealerInfoLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  dealerInfoLabel: {
    fontSize: 12,
    color: '#64748b',
    letterSpacing: 0.2,
  },
  dealerInfoValue: {
    fontSize: 16,
    color: '#0f172a',
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  formSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  productCard: {
    width: (SCREEN_WIDTH - 56) / 2,
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e0e7ff',
    alignItems: 'center',
    gap: 8,
  },
  selectedProductCard: {
    borderColor: '#6366f1',
    backgroundColor: '#f8fafc',
  },
  productCardName: {
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '500',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  productCardPrice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 2,
  },
  productCardPriceText: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  productCardUnit: {
    fontSize: 12,
    color: '#64748b',
    letterSpacing: 0.2,
  },
  showMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    marginBottom: 16,
  },
  showMoreText: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  selectedProductInfo: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: '#e0e7ff',
    marginBottom: 16,
  },
  selectedProductHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  selectedProductName: {
    fontSize: 16,
    color: '#0f172a',
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  selectedProductMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectedProductUnit: {
    fontSize: 14,
    color: '#64748b',
    letterSpacing: 0.2,
  },
  selectedProductPrice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  selectedProductPriceText: {
    fontSize: 16,
    color: '#6366f1',
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  quantityContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  quantityInput: {
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    color: '#0f172a',
    borderWidth: 2,
    borderColor: '#e0e7ff',
    backgroundColor: '#f8fafc',
  },
  totalContainer: {
    backgroundColor: '#f0fdf4',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#dcfce7',
  },
  totalLabel: {
    fontSize: 14,
    color: '#064e3b',
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  totalValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  totalText: {
    fontSize: 24,
    color: '#10b981',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  notesToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: '#e0e7ff',
    backgroundColor: '#f8fafc',
  },
  notesToggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notesToggleText: {
    fontSize: 16,
    color: '#6366f1',
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  notesContainer: {
    marginTop: 16,
    overflow: 'hidden',
  },
  notesInput: {
    borderRadius: 16,
    padding: 16,
    height: 120,
    fontSize: 16,
    color: '#0f172a',
    borderWidth: 2,
    borderColor: '#e0e7ff',
    backgroundColor: '#f8fafc',
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e0e7ff',
    gap: 12,
  },
  button: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  cancelButton: {
    backgroundColor: '#f1f5f9',
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  submitButton: {
    backgroundColor: '#6366f1',
  },
  submitButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  submitButtonText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  profileDropdown: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 100 : 60,
    right: 16,
    width: SCREEN_WIDTH - 32,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: '#e0e7ff',
    zIndex: 1000,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e7ff',
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    letterSpacing: 0.5,
  },
  profileInfo: {
    gap: 16,
  },
  profileInfoItem: {
    gap: 4,
  },
  profileInfoLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  profileInfoLabel: {
    fontSize: 12,
    color: '#64748b',
    letterSpacing: 0.2,
  },
  profileInfoValue: {
    fontSize: 16,
    color: '#0f172a',
    fontWeight: '500',
    letterSpacing: 0.3,
  },
});