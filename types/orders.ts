import { Database } from '@/types/supabase';

// Base types from database
export type Dealer = Database['public']['Tables']['dealers']['Row'];
export type PriceChart = Database['public']['Tables']['price_charts']['Row'];
export type PriceChartItem = Database['public']['Tables']['price_chart_items']['Row'];
export type Product = Database['public']['Tables']['products']['Row'];
export type Order = Database['public']['Tables']['orders']['Row'];

// Component interfaces
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

export interface PriceChartItemWithProduct {
  id: string;
  product: {
    id: string;
    name: string;
    category: string | null;
    unit: string;
  };
  price_per_unit: number;
  currency: string;
  effective_date: string;
  expiry_date: string | null;
}

// Supabase response interfaces
export interface SupabaseDealerResponse {
  id: string;
  name: string;
  dealer_code: string;
  salesman_id: string | null;
  price_chart_code: string | null;
  price_charts: {
    id: string;
    name: string;
    price_chart_code: string;
  } | null;
}

export interface SupabasePriceChartItemResponse {
  id: string;
  product: {
    id: string;
    name: string;
    category: string | null;
    unit: string;
  };
  price_per_unit: number;
  currency: string;
  effective_date: string;
  expiry_date: string | null;
}

// Order creation interface
export interface CreateOrderData {
  dealer_id: string;
  product_id: string;
  product_name: string;
  unit: string;
  quantity: number;
  price_chart_id: string | null;
  price_per_unit: number;
  total_price: number;
  status: 'processing' | 'completed' | 'canceled';
  notes?: string | null;
} 