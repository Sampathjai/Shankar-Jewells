import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchApi } from '../../api/client';
import { useLanguage } from '../../i18n';
import { Sparkles, TrendingUp } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

interface StructuredRates {
  gold24k: { rate: number; purity: string; metal: string };
  gold22k: { rate: number; purity: string; metal: string };
  gold18k: { rate: number; purity: string; metal: string };
  silver999: { rate: number; purity: string; metal: string };
}

export const MobileLiveRatesTicker: React.FC = () => {
  const { t } = useLanguage();
  const [rates, setRates] = useState<StructuredRates | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string>('');
  const [loading, setLoading] = useState(true);

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
        console.warn('Unable to load live rates ticker:', err);
      } finally {
        setLoading(false);
      }
    }
    loadRates();
  }, []);

  const rate24K = rates?.gold24k?.rate || 6830;
  const rateSilver999 = rates?.silver999?.rate || 255;
  const rate22K = rates?.gold22k?.rate || 6260;

  return (
    <div className="bg-luxury-charcoal text-luxury-ivory border-b border-luxury-gold/30 text-[11px] py-1.5 px-3 overflow-x-auto custom-admin-scrollbar">
      <div className="flex items-center justify-between min-w-max gap-4">
        <div className="flex items-center gap-1.5 text-luxury-gold font-bold uppercase tracking-wider shrink-0">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <TrendingUp className="w-3.5 h-3.5" /> {t('header.liveMetalRates')} {updatedAt ? `(${updatedAt})` : ''}:
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1">
            <span className="text-luxury-gold text-[10px] uppercase font-sans font-bold">{t('header.gold24k')}</span>
            <span className="font-bold text-amber-300">{formatCurrency(rate24K)}{t('header.perGram')}</span>
          </div>

          <span className="text-luxury-gold/40">•</span>

          <div className="flex items-center gap-1">
            <span className="text-luxury-ivory/80 text-[10px] uppercase font-sans font-bold">{t('header.silver999')}</span>
            <span className="font-bold text-slate-200">{formatCurrency(rateSilver999)}{t('header.perGram')}</span>
          </div>

          <span className="text-luxury-gold/40">•</span>

          <div className="flex items-center gap-1">
            <span className="text-luxury-ivory/60 text-[10px] uppercase font-sans">GOLD 22K</span>
            <span className="font-semibold text-amber-200/80">{formatCurrency(rate22K)}/g</span>
          </div>
        </div>

        <Link
          to="/gold-rate"
          className="shrink-0 text-[10px] text-luxury-gold font-bold hover:underline uppercase flex items-center gap-1 ml-2"
        >
          <Sparkles className="w-3 h-3" /> Rates Page
        </Link>
      </div>
    </div>
  );
};

export default MobileLiveRatesTicker;
