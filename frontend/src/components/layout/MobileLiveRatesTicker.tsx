import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchApi } from '../../api/client';
import { Sparkles, TrendingUp } from 'lucide-react';

interface MetalRate {
  id: string;
  metalType: string;
  purity: string;
  ratePerGram: number;
}

export const MobileLiveRatesTicker: React.FC = () => {
  const [rates, setRates] = useState<MetalRate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRates() {
      try {
        const res = await fetchApi<{ success: boolean; data: MetalRate[] }>('/metal-rates');
        if (res.success && res.data) {
          setRates(res.data);
        }
      } catch (err) {
        console.warn('Unable to load live rates ticker:', err);
      } finally {
        setLoading(false);
      }
    }
    loadRates();
  }, []);

  const rate22K = rates.find((r) => r.purity === 'K22')?.ratePerGram || 14145;
  const rate24K = rates.find((r) => r.purity === 'K24')?.ratePerGram || 15431;
  const rate18K = rates.find((r) => r.purity === 'K18' || r.purity === '18K')?.ratePerGram || 11915;
  const rateSilver = rates.find((r) => r.metalType === 'SILVER')?.ratePerGram || 255;

  return (
    <div className="bg-luxury-charcoal text-luxury-ivory border-b border-luxury-gold/30 text-[11px] py-1.5 px-3 overflow-x-auto custom-admin-scrollbar">
      <div className="flex items-center justify-between min-w-max gap-4">
        <div className="flex items-center gap-1.5 text-luxury-gold font-bold uppercase tracking-wider shrink-0">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <TrendingUp className="w-3.5 h-3.5" /> LIVE RATES:
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1">
            <span className="text-luxury-ivory/70 text-[10px] uppercase font-sans">22K Gold</span>
            <span className="font-bold text-amber-300">₹{rate22K.toLocaleString('en-IN')}/g</span>
          </div>

          <span className="text-luxury-gold/40">•</span>

          <div className="flex items-center gap-1">
            <span className="text-luxury-ivory/70 text-[10px] uppercase font-sans">24K Gold</span>
            <span className="font-bold text-amber-300">₹{rate24K.toLocaleString('en-IN')}/g</span>
          </div>

          <span className="text-luxury-gold/40">•</span>

          <div className="flex items-center gap-1">
            <span className="text-luxury-ivory/70 text-[10px] uppercase font-sans">18K Gold</span>
            <span className="font-bold text-amber-300">₹{rate18K.toLocaleString('en-IN')}/g</span>
          </div>

          <span className="text-luxury-gold/40">•</span>

          <div className="flex items-center gap-1">
            <span className="text-luxury-ivory/70 text-[10px] uppercase font-sans">Silver 999</span>
            <span className="font-bold text-slate-200">₹{rateSilver.toLocaleString('en-IN')}/g</span>
          </div>
        </div>

        <Link
          to="/gold-calculator"
          className="shrink-0 text-[10px] text-luxury-gold font-bold hover:underline uppercase flex items-center gap-1 ml-2"
        >
          <Sparkles className="w-3 h-3" /> Calculator
        </Link>
      </div>
    </div>
  );
};

export default MobileLiveRatesTicker;
