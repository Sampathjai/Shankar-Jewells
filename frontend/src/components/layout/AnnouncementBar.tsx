import React, { useEffect } from 'react';
import { useMetalRateStore } from '../../store/useMetalRateStore';
import { Sparkles, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

export const AnnouncementBar: React.FC = () => {
  const { fetchRates, getRate } = useMetalRateStore();

  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  const k24Rate = getRate('GOLD', 'K24');
  const k22Rate = getRate('GOLD', 'K22');
  const silverRate = getRate('SILVER', 'SILVER_999');

  return (
    <div className="bg-luxury-charcoal text-luxury-ivory text-xs py-2 px-4 border-b border-luxury-gold/20 select-none">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-2">
        <div className="flex items-center gap-4 overflow-x-auto text-[11px] sm:text-xs tracking-wider">
          <span className="flex items-center gap-1 text-luxury-gold font-semibold uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5 text-luxury-gold animate-pulse" /> Live Bullion Rates:
          </span>
          <span className="flex items-center gap-1">
            24K Gold: <strong className="text-luxury-gold">₹{k24Rate.toLocaleString('en-IN')}/g</strong>
          </span>
          <span className="hidden sm:inline text-luxury-gold/40">•</span>
          <span className="flex items-center gap-1">
            22K Gold: <strong className="text-luxury-gold">₹{k22Rate.toLocaleString('en-IN')}/g</strong>
          </span>
          <span className="hidden sm:inline text-luxury-gold/40">•</span>
          <span className="flex items-center gap-1">
            Silver (999): <strong className="text-luxury-gold">₹{silverRate.toLocaleString('en-IN')}/g</strong>
          </span>
        </div>

        <div className="flex items-center gap-3 text-[11px]">
          <Link
            to="/gold-silver-rate"
            className="text-luxury-gold hover:text-luxury-gold-light underline flex items-center gap-1 transition-colors"
          >
            <TrendingUp className="w-3.5 h-3.5" /> Rate History & Trends
          </Link>
        </div>
      </div>
    </div>
  );
};

