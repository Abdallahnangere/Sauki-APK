import { Product, DataPlan, Transaction, PaymentInitResponse } from '../types';

const API_BASE = '/api';

async function fetcher<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    cache: 'no-store', // Ensure fresh data
  });
  
  if (!res.ok) {
    const errorText = await res.text();
    console.error(`API Error ${res.status}: ${errorText}`);
    throw new Error(errorText || 'An unexpected error occurred');
  }
  
  return res.json();
}

export const api = {
  getProducts: () => fetcher<Product[]>('/products'),
  
  getDataPlans: () => fetcher<DataPlan[]>('/data-plans'),
  
  initiateEcommercePayment: (data: { productId: string; phone: string; name: string; state: string }) => 
    fetcher<PaymentInitResponse>('/ecommerce/initiate-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  initiateDataPayment: (data: { planId: string; phone: string }) => 
    fetcher<PaymentInitResponse>('/data/initiate-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  verifyTransaction: (tx_ref: string) => 
    fetcher<{ status: Transaction['status'] }>('/transactions/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tx_ref }),
    }),

  trackTransactions: (phone: string) => 
    fetcher<{ transactions: Transaction[] }>(`/transactions/track?phone=${phone}`),
    
  generateReceipt: (tx_ref: string) =>
    fetcher<{ url: string }>(`/receipt/generate?tx_ref=${tx_ref}`),
};