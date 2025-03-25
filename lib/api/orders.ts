import { supabase } from '@/lib/supabase';
import type { CreateOrderData, Order } from '@/types/orders';
import { fetchDealerByUserId } from './dealers';
import { fetchPriceChartByCode, fetchPriceChartItems } from './price-charts';
import { createOrder as createOrderApi } from './order-create';

export interface DealerDetails {
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

export interface Product {
  id: string;
  name: string;
  category: string;
  unit: string;
  price_per_unit: number;
  currency: string;
  effective_date: string;
  expiry_date: string | null;
}

export async function fetchDealerDetails(userId: string): Promise<DealerDetails> {
  if (!userId) throw new Error('User ID is required');

  console.log('Fetching dealer details for user:', userId);

  // Step 1: Get dealer data
  const dealerData = await fetchDealerByUserId(userId);
  console.log('Dealer data:', JSON.stringify(dealerData, null, 2));

  // Step 2: Get price chart data if available
  let priceChartData = null;
  if (dealerData.price_chart_code) {
    try {
      priceChartData = await fetchPriceChartByCode(dealerData.price_chart_code);
      console.log('Price chart data:', JSON.stringify(priceChartData, null, 2));
    } catch (error) {
      console.error('Failed to fetch price chart:', error);
      // Continue without price chart data
    }
  }

  // Transform the response to match the DealerDetails interface
  const result = {
    id: dealerData.id,
    name: dealerData.name,
    dealer_code: dealerData.dealer_code,
    salesman_id: dealerData.salesman_id,
    price_chart: priceChartData ? {
      id: priceChartData.id,
      name: priceChartData.name,
      price_chart_code: priceChartData.price_chart_code
    } : null
  };

  console.log('Transformed dealer details:', JSON.stringify(result, null, 2));
  return result;
}

export async function fetchPriceChartProducts(priceChartCode: string): Promise<Product[]> {
  if (!priceChartCode) throw new Error('Price chart code is required');

  console.log('Fetching products for price chart:', priceChartCode);

  // Step 1: Get price chart data
  const priceChartData = await fetchPriceChartByCode(priceChartCode);
  console.log('Price chart data:', JSON.stringify(priceChartData, null, 2));

  // Step 2: Get price chart items
  const priceChartItems = await fetchPriceChartItems(priceChartData.id);
  console.log('Price chart items:', JSON.stringify(priceChartItems, null, 2));

  // Transform the response to match the Product interface
  const result = priceChartItems.map(item => ({
    id: item.product.id,
    name: item.product.name,
    category: item.product.category,
    unit: item.product.unit,
    price_per_unit: item.price_per_unit,
    currency: item.currency,
    effective_date: item.effective_date,
    expiry_date: item.expiry_date
  }));

  console.log('Transformed products:', JSON.stringify(result, null, 2));
  return result;
}

export async function createOrder(orderData: CreateOrderData): Promise<Order> {
  // Validate order data
  if (!orderData.dealer_id) throw new Error('Dealer ID is required');
  if (!orderData.product_id) throw new Error('Product ID is required');
  if (!orderData.product_name) throw new Error('Product name is required');
  if (!orderData.unit) throw new Error('Unit is required');
  if (orderData.quantity <= 0) throw new Error('Quantity must be greater than 0');
  if (orderData.price_per_unit <= 0) throw new Error('Price per unit must be greater than 0');
  if (orderData.total_price <= 0) throw new Error('Total price must be greater than 0');

  console.log('Creating order with data:', JSON.stringify(orderData, null, 2));

  try {
    const createdOrder = await createOrderApi(orderData);
    console.log('Order created successfully:', JSON.stringify(createdOrder, null, 2));
    return createdOrder;
  } catch (error) {
    console.error('Order creation error:', error);
    throw error;
  }
}

export async function fetchDealerOrders(dealerId: string): Promise<Order[]> {
  if (!dealerId) throw new Error('Dealer ID is required');

  console.log('Fetching orders for dealer:', dealerId);

  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('dealer_id', dealerId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching orders:', error);
    throw error;
  }

  console.log('Fetched orders:', JSON.stringify(data, null, 2));
  return data;
}