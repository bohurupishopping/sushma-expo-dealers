import { supabase } from '@/lib/supabase';
import type { CreateOrderData, Order } from '@/types/orders';

export async function createOrder(orderData: CreateOrderData): Promise<Order> {
  try {
    // Validate required fields
    if (!orderData.dealer_id || !orderData.product_id || !orderData.quantity || 
        !orderData.price_chart_id || !orderData.price_per_unit || !orderData.product_name || !orderData.unit) {
      throw new Error('Missing required fields. Please ensure all required data is provided.');
    }

    console.log('Creating order with data:', orderData);

    // First, get the dealer's salesman_id
    const { data: dealerData, error: dealerError } = await supabase
      .from('dealers')
      .select('salesman_id')
      .eq('id', orderData.dealer_id)
      .single();

    if (dealerError) {
      console.error('Error fetching dealer:', dealerError);
      throw new Error('Failed to fetch dealer details');
    }

    // Create the order with the provided data
    // Note: We don't specify an ID - the database will generate it using generate_order_id()
    const { data: createdOrder, error: orderError } = await supabase
      .from('orders')
      .insert({
        dealer_id: orderData.dealer_id,
        salesman_id: dealerData?.salesman_id || null,
        product_id: orderData.product_id,
        product_name: orderData.product_name,
        unit: orderData.unit,
        quantity: Number(orderData.quantity),
        price_chart_id: orderData.price_chart_id,
        price_per_unit: Number(orderData.price_per_unit),
        total_price: Number(orderData.quantity) * Number(orderData.price_per_unit),
        status: 'processing',
        notes: orderData.notes || null
      })
      .select(`
        *,
        dealer:dealers(
          id,
          name,
          dealer_code
        ),
        salesman:profiles!orders_salesman_id_fkey(
          user_id,
          display_name
        ),
        product:products(
          id,
          name,
          category,
          unit
        )
      `)
      .single();

    if (orderError) {
      console.error('Error creating order:', orderError);
      throw new Error(`Failed to create order: ${orderError.message}`);
    }

    if (!createdOrder) {
      throw new Error('Order was not created');
    }

    console.log('Order created successfully:', createdOrder);
    return createdOrder;
  } catch (error) {
    console.error('Error in createOrder:', error);
    throw error;
  }
} 