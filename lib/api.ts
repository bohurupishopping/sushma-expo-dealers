import { Platform } from 'react-native';

const API_URL = 'https://sushma.bohurupi.com/api';

// Helper to add timeout and retries
async function fetchWithTimeout(resource: RequestInfo, options: RequestInit = {}, timeout = 10000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  const mergedOptions = { ...options, signal: controller.signal };
  try {
    const response = await fetch(resource, mergedOptions);
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

async function fetchWithRetry(
  resource: RequestInfo,
  options: RequestInit = {},
  retries = 2,
  timeout = 10000
): Promise<any> {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetchWithTimeout(resource, options, timeout);
      if (!response.ok) {
        let errorMsg = 'Unknown error';
        try {
          const err = await response.json();
          errorMsg = err.message || JSON.stringify(err);
        } catch (e) {
          errorMsg = response.statusText || 'Request failed';
        }
        throw new Error(`[${response.status}] ${errorMsg}`);
      }
      return response.json();
    } catch (err) {
      lastError = err;
      if (attempt === retries) throw new Error(`Request failed after ${retries + 1} attempts: ${err instanceof Error ? err.message : err}`);
      // Only retry on network errors or abort
      if (!(err instanceof Error && (err.name === 'AbortError' || err.message.includes('Network')))) {
        throw err;
      }
    }
  }
  throw lastError;
}


export async function fetchDealers() {
  return fetchWithRetry(`${API_URL}/dealers`);
}

export async function fetchDealerDetails(dealerId: string) {
  return fetchWithRetry(`${API_URL}/dealers/${dealerId}/details`);
}

export async function fetchPriceChartProducts(priceChartId: string) {
  return fetchWithRetry(`${API_URL}/price-charts/${priceChartId}/items`);
}

export async function createOrder(orderData: any) {
  return fetchWithRetry(`${API_URL}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(orderData),
  });
}