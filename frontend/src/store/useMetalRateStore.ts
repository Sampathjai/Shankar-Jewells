import { create } from 'zustand';
import { MetalRate } from '../types';
import { fetchApi } from '../api/client';

interface MetalRateState {
  rates: MetalRate[];
  loading: boolean;
  fetchRates: () => Promise<void>;
  getRate: (metalType: string, purity: string) => number;
}

export const useMetalRateStore = create<MetalRateState>((set, get) => ({
  rates: [],
  loading: false,
  fetchRates: async () => {
    try {
      set({ loading: true });
      const res = await fetchApi<{ data?: MetalRate[]; rates?: any }>('/metal-rates/current');
      if (res.data && Array.isArray(res.data)) {
        set({ rates: res.data, loading: false });
      } else {
        set({ loading: false });
      }
    } catch (err) {
      console.error('Failed to load current metal rates:', err);
      set({ loading: false });
    }
  },
  getRate: (metalType, purity) => {
    const targetMetal = (metalType || '').toUpperCase().trim();
    const targetPurity = (purity || '').toUpperCase().trim();
    const currentRates = get().rates;

    const found = currentRates.find((r) => {
      if (r.metalType.toUpperCase() !== targetMetal) return false;
      const dbPurity = r.purity.toUpperCase().trim();
      if (dbPurity === targetPurity) return true;
      if ((targetPurity === '24K' || targetPurity === 'K24') && (dbPurity === '24K' || dbPurity === 'K24')) return true;
      if ((targetPurity === '22K' || targetPurity === 'K22') && (dbPurity === '22K' || dbPurity === 'K22')) return true;
      if ((targetPurity === '18K' || targetPurity === 'K18') && (dbPurity === '18K' || dbPurity === 'K18')) return true;
      if ((targetPurity === '999' || targetPurity === 'SILVER_999') && (dbPurity === '999' || dbPurity === 'SILVER_999')) return true;
      if ((targetPurity === '925' || targetPurity === 'SILVER_925') && (dbPurity === '925' || dbPurity === 'SILVER_925')) return true;
      return false;
    });

    if (found && found.ratePerGram > 0) return found.ratePerGram;

    // Fallbacks to Trichy Bullion Exchange benchmark rates (INR/gram)
    if (targetMetal === 'GOLD') {
      if (targetPurity === '24K' || targetPurity === 'K24') return 15431;
      if (targetPurity === '22K' || targetPurity === 'K22') return 14145;
      if (targetPurity === '18K' || targetPurity === 'K18') return 11915;
      if (targetPurity === '80') return 12345;
      if (targetPurity === '70') return 10800;
    }
    if (targetMetal === 'SILVER') {
      if (targetPurity === '925' || targetPurity === 'SILVER_925') return 236;
      return 255;
    }
    return 14145;
  },
}));

