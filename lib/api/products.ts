import { supabase } from '@/lib/supabase';

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

export async function fetchPriceChartProducts(priceChartId: string): Promise<Product[]> {
  if (!priceChartId) throw new Error('Price chart ID is required');

  console.log('Fetching products for price chart ID:', priceChartId);

  const { data, error } = await supabase
    .from('price_chart_items')
    .select(`
      id,
      price_per_unit,
      currency,
      effective_date,
      expiry_date,
      product:products (
        id,
        name,
        category,
        unit
      )
    `)
    .eq('price_chart_id', priceChartId)
    .is('expiry_date', null)
    .order('effective_date', { ascending: false });

  if (error) {
    console.error('Error fetching price chart products:', error);
    throw new Error(`Failed to fetch products: ${error.message}`);
  }

  if (!data || data.length === 0) {
    console.log('No products found for price chart:', priceChartId);
    return [];
  }

  // Transform the data to match the Product interface
  const products: Product[] = data.map(item => ({
    id: item.product.id,
    name: item.product.name,
    category: item.product.category || '',
    unit: item.product.unit,
    price_per_unit: item.price_per_unit,
    currency: item.currency,
    effective_date: item.effective_date,
    expiry_date: item.expiry_date
  }));

  console.log('Fetched products:', JSON.stringify(products, null, 2));
  return products;
} 