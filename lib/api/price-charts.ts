import { supabase } from '@/lib/supabase';

export interface PriceChartData {
  id: string;
  name: string;
  price_chart_code: string;
}

interface SupabasePriceChartItem {
  id: string;
  product: {
    id: string;
    name: string;
    category: string;
    unit: string;
  };
  price_per_unit: number;
  currency: string;
  effective_date: string;
  expiry_date: string | null;
}

export interface PriceChartItem {
  id: string;
  product: {
    id: string;
    name: string;
    category: string;
    unit: string;
  };
  price_per_unit: number;
  currency: string;
  effective_date: string;
  expiry_date: string | null;
}

export async function fetchPriceChartByCode(priceChartId: string): Promise<PriceChartData> {
  if (!priceChartId) throw new Error('Price chart ID is required');

  console.log('Fetching price chart by ID:', priceChartId);

  const { data, error } = await supabase
    .from('price_charts')
    .select('id, name, price_chart_code')
    .eq('id', priceChartId)
    .single();

  if (error) {
    console.error('Price chart fetch error:', error);
    throw new Error(`Failed to fetch price chart: ${error.message}`);
  }

  if (!data) {
    throw new Error('Price chart not found');
  }

  console.log('Price chart data:', JSON.stringify(data, null, 2));
  return data;
}

export async function fetchPriceChartItems(priceChartId: string): Promise<PriceChartItem[]> {
  if (!priceChartId) throw new Error('Price chart ID is required');

  console.log('Fetching price chart items for ID:', priceChartId);

  const { data, error } = await supabase
    .from('price_chart_items')
    .select(`
      id,
      product:product_id (
        id,
        name,
        category,
        unit
      ),
      price_per_unit,
      currency,
      effective_date,
      expiry_date
    `)
    .eq('price_chart_id', priceChartId)
    .is('expiry_date', null)
    .order('effective_date', { ascending: false });

  if (error) {
    console.error('Price chart items fetch error:', error);
    throw new Error(`Failed to fetch price chart items: ${error.message}`);
  }

  if (!data || data.length === 0) {
    console.log('No price chart items found for price chart:', priceChartId);
    throw new Error('No active price chart items found');
  }

  // Transform the data to match the PriceChartItem interface
  const transformedData: PriceChartItem[] = (data as unknown as SupabasePriceChartItem[]).map(item => ({
    id: item.id,
    product: {
      id: item.product.id,
      name: item.product.name,
      category: item.product.category,
      unit: item.product.unit
    },
    price_per_unit: item.price_per_unit,
    currency: item.currency,
    effective_date: item.effective_date,
    expiry_date: item.expiry_date
  }));

  console.log('Price chart items:', JSON.stringify(transformedData, null, 2));
  return transformedData;
} 