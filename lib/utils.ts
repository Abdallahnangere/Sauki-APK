import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(amount);
}

export const NETWORK_COLORS: Record<string, string> = {
  MTN: '#FFCC00',
  AIRTEL: '#FF0000',
  GLO: '#00C300',
};

export const NETWORK_BG_COLORS: Record<string, string> = {
  MTN: 'bg-yellow-50 text-yellow-700',
  AIRTEL: 'bg-red-50 text-red-700',
  GLO: 'bg-green-50 text-green-700',
};