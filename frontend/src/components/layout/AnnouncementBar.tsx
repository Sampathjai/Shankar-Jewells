import React, { useEffect, useState } from 'react';
import { fetchApi } from '../../api/client';
import { formatCurrency } from '../../utils/formatters';
import { Sparkles, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

interface StructuredRates {
  gold24k: { rate: number; purity: string; metal: string };
  gold22k: { rate: number; purity: string; metal: string };
  gold18k: { rate: number; purity: string; metal: string };
  silver999: { rate: number; purity: string; metal: string };
}

export const AnnouncementBar: React.FC = () => {
  const [rates, setRates] = useState<StructuredRates | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string>('');

  useEffect(() => {
    async function loadRates() {
      try {
        const res = await fetchApi<{
          success: boolean;
          rates: StructuredRates;
          updatedAt?: string;
        }>('/metal-rates/current');
        if (res.success && res.rates) {
          setRates(res.rates);
          if (res.updatedAt) {
            setUpdatedAt(new Date(res.updatedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }));
          }
        }
      } catch (err) {
        console.warn('Failed to load announcement bar rates:', err);
      }
    }
    loadRates();
  }, []);

  const rate24K = rates?.gold24k?.rate || 6830;
  const rate22K = rates?.gold22k?.rate || 6260;
  const rateSilver999 = rates?.silver999?.rate || 255;

  return (
    <div className="bg-luxury-charcoal text-luxury-ivory text-xs py-2 px-4 border-b border-luxury-gold/20 select-none">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-2">
        <div className="flex items-center gap-4 overflow-x-auto text-[11px] sm:text-xs tracking-wider">
          <span className="flex items-center gap-1 text-luxury-gold font-bold uppercase tracking-widest shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-luxury-gold animate-pulse" /> Live Rates {updatedAt ? `(${updatedAt})` : ''}:
          </span>
          <span className="flex items-center gap-1">
            <span className="text-luxury-ivory/70">LIVE GOLD 24K:</span>
            <strong className="text-luxury-gold font-mono">{formatCurrency(rate24K)}/g</strong>
          </span>
          <span className="hidden sm:inline text-luxury-gold/40">•</span>
          <span className="flex items-center gap-1">
            <span className="text-luxury-ivory/70">LIVE SILVER 999:</span>
            <strong className="text-luxury-gold font-mono">{formatCurrency(rateSilver999)}/g</strong>
          </span>
          <span className="hidden sm:inline text-luxury-gold/40">•</span>
          <span className="flex items-center gap-1">
            <span className="text-luxury-ivory/70">GOLD 22K:</span>
            <strong className="text-amber-200/90 font-mono">{formatCurrency(rate22K)}/g</strong>
          </span>
        </div>

        <div className="flex items-center gap-3 text-[11px]">
          <Link
            to="/gold-rate"
            className="text-luxury-gold hover:text-luxury-gold-light underline flex items-center gap-1 transition-colors font-semibold"
          >
            <TrendingUp className="w-3.5 h-3.5" /> Rate History & Trends
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementBar;
