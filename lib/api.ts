import { Platform } from 'react-native';

const API_URL = 'https://sushma.bohurupi.com/api';

export async function fetchDealers() {
  const response = await fetch(`${API_URL}/dealers`);
  if (!response.ok) {
    throw new Error('Failed to fetch dealers');
  }
  return response.json();
}

export async function fetchDealerDetails(dealerId: string) {
  const response = await fetch(`${API_URL}/dealers/${dealerId}/details`);
  if (!response.ok) {
    throw new Error('Failed to fetch dealer details');
  }
  return response.json();
}

export async function fetchPriceChartProducts(priceChartId: string) {
  const response = await fetch(`${API_URL}/price-charts/${priceChartId}/items`);
  if (!response.ok) {
    throw new Error('Failed to fetch price chart products');
  }
  return response.json();
}

export async function createOrder(orderData: any) {
  const response = await fetch(`${API_URL}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(orderData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create order');
  }

  return response.json();
}