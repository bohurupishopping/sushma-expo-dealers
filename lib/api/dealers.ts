import { supabase } from '@/lib/supabase';

export interface DealerData {
  id: string;
  name: string;
  dealer_code: string;
  salesman_id: string | null;
  price_chart_code: string | null;
}

export async function fetchDealerByUserId(userId: string): Promise<DealerData> {
  if (!userId) throw new Error('User ID is required');

  console.log('Fetching dealer by user ID:', userId);

  const { data, error } = await supabase
    .from('dealers')
    .select(`
      id,
      name,
      dealer_code,
      salesman_id,
      price_chart_code
    `)
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('Dealer fetch error:', error);
    if (error.code === 'PGRST116') {
      throw new Error('No dealer found for this user');
    }
    throw error;
  }

  if (!data) {
    throw new Error('Dealer not found');
  }

  console.log('Raw dealer data:', JSON.stringify(data, null, 2));
  return data;
} 