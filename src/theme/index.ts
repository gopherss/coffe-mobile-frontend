import { useColorScheme } from 'react-native';

import type { OrderStatus } from '@/lib/constants';

export interface Theme {
  scheme: 'light' | 'dark';
  bg: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  text: string;
  textMuted: string;
  primary: string;
  onPrimary: string;
  accent: string;
  success: string;
  warning: string;
  danger: string;
  pending: string;
  preparing: string;
  ready: string;
  overlay: string;
}

const light: Theme = {
  scheme: 'light',
  bg: '#F5EFE6',
  surface: '#FFFFFF',
  surfaceAlt: '#EBE2D5',
  border: '#DFD2C0',
  text: '#231A12',
  textMuted: '#7C6A59',
  primary: '#6F4E37',
  onPrimary: '#FFFFFF',
  accent: '#C07A3C',
  success: '#2E7D53',
  warning: '#B07A17',
  danger: '#AE3B2C',
  pending: '#B07A17',
  preparing: '#2C6C9E',
  ready: '#2E7D53',
  overlay: 'rgba(35, 26, 18, 0.45)',
};

const dark: Theme = {
  scheme: 'dark',
  bg: '#15100C',
  surface: '#221A14',
  surfaceAlt: '#2E241C',
  border: '#3B2E23',
  text: '#F4ECE3',
  textMuted: '#A59486',
  primary: '#C08A5E',
  onPrimary: '#1A120C',
  accent: '#E0A36B',
  success: '#5CBA8B',
  warning: '#DFAE4A',
  danger: '#E3705F',
  pending: '#DFAE4A',
  preparing: '#69A9DA',
  ready: '#5CBA8B',
  overlay: 'rgba(0, 0, 0, 0.6)',
};

export function useTheme(): Theme {
  return useColorScheme() === 'dark' ? dark : light;
}

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 18,
  pill: 999,
} as const;

export function statusColor(theme: Theme, status: OrderStatus): string {
  switch (status) {
    case 'pending':
      return theme.pending;
    case 'preparing':
      return theme.preparing;
    case 'ready':
      return theme.ready;
    case 'completed':
      return theme.success;
    case 'cancelled':
      return theme.textMuted;
  }
}
