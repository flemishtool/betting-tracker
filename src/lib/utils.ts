import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = 'GBP'): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
  }).format(amount);
}

export function formatPercentage(value: number, decimals: number = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

export function formatOdds(odds: number): string {
  return odds.toFixed(2);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
}

export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'won':
    case 'active':
    case 'completed':
      return 'text-green-500';
    case 'lost':
    case 'failed':
      return 'text-red-500';
    case 'pending':
      return 'text-yellow-500';
    default:
      return 'text-gray-400';
  }
}

export function getStatusBgColor(status: string): string {
  switch (status) {
    case 'won':
    case 'active':
    case 'completed':
      return 'bg-green-500/20 text-green-500';
    case 'lost':
    case 'failed':
      return 'bg-red-500/20 text-red-500';
    case 'pending':
      return 'bg-yellow-500/20 text-yellow-500';
    default:
      return 'bg-gray-500/20 text-gray-400';
  }
}

export function generateStreamName(): string {
  const adjectives = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Theta'];
  const randomAdj = adjectives[Math.floor(Math.random() * adjectives.length)];
  return `Stream ${randomAdj}`;
}