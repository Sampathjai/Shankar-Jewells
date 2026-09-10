import React, { useEffect, useState } from 'react';
import { useMetalRateStore } from '../../store/useMetalRateStore';
import { fetchApi } from '../../api/client';
import { TrendingUp, ShieldCheck, Clock, AlertCircle } from 'lucide-react';

export const GoldRatePage: React.FC = () => {
  const { fetchRates, rates, getRate } = useMetalRateStore();
  const [history, setHistory] = useState<any[]>([]);
  const [days, setDays] = useState(30);

  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await fetchApi<{ data: any[] }>(`/metal-rates/history?days=${days}`);
        setHistory(res.data);
      } catch (err) {
        console.error('Failed to load rate history:', err);
      }
    }
    loadHistory();
  }, [days]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <div className="text-center space-y-2 max-w-2xl mx-auto">
        <span className="text-xs font-semibold text-luxury-gold uppercase tracking-widest">
          Bullion Market Exchange Transparency
        </span>
        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-luxury-charcoal">
          Live Gold & Silver Rate Index
        </h1>
        <p className="text-xs sm:text-sm text-luxury-gray">
          Updated in real-time based on Trichy Bullion Exchange and Reserve Bank of India benchmark prices.
        </p>
      </div>

      {/* Current Rates Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { name: 'Gold 24K (99.9%)', key: 'K24', metal: 'GOLD', desc: 'Fine Pure Bullion' },
          { name: 'Gold 22K (91.6%)', key: 'K22', metal: 'GOLD', desc: 'Standard Jewellery Gold' },
          { name: 'Gold 18K (75.0%)', key: 'K18', metal: 'GOLD', desc: 'Diamond Jewellery Gold' },
          { name: 'Silver (99.9%)', key: 'SILVER_999', metal: 'SILVER', desc: 'Fine Sterling Silver' },
        ].map((item, idx) => {
          const rateVal = getRate(item.metal, item.key);
          return (
            <div key={idx} className="bg-white p-6 rounded-2xl border border-luxury-border shadow-card space-y-2 text-center">
              <span className="text-xs text-luxury-gray font-semibold uppercase">{item.name}</span>
              <div className="font-serif text-3xl font-bold text-luxury-gold">
                ₹{rateVal.toLocaleString('en-IN')}<span className="text-xs font-sans text-luxury-gray">/g</span>
              </div>
              <p className="text-[10px] text-luxury-gray">{item.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Historical Rates Table */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-luxury-border shadow-card space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="font-serif text-2xl font-bold text-luxury-charcoal flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-luxury-gold" /> Rate History & Trends
          </h2>

          <div className="flex gap-2 text-xs">
            {[7, 30, 90, 365].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-3 py-1.5 rounded-full border ${
                  days === d
                    ? 'bg-luxury-gold text-white border-luxury-gold'
                    : 'bg-white text-luxury-charcoal border-luxury-border'
                }`}
              >
                {d === 365 ? '1 Year' : `${d} Days`}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-luxury-border text-luxury-gold font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Metal & Purity</th>
                <th className="py-3 px-4">Rate Per Gram</th>
                <th className="py-3 px-4">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-luxury-border/50 text-luxury-charcoal">
              {history.map((row) => (
                <tr key={row.id} className="hover:bg-luxury-beige/30 transition-colors">
                  <td className="py-3 px-4 font-mono text-[11px]">
                    {new Date(row.createdAt).toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-4 font-semibold">
                    {row.metalType} ({row.purity})
                  </td>
                  <td className="py-3 px-4 font-bold text-luxury-gold">
                    ₹{row.ratePerGram.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-4 text-luxury-gray text-[10px] uppercase">
                    {row.source}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mandatory Disclaimer */}
      <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />
        <div className="space-y-1">
          <strong className="font-semibold uppercase tracking-wider block">Official Rate Disclaimer</strong>
          <p className="leading-relaxed">
            Displayed rates are indicative bullion market benchmarks. Final jewellery prices may vary based on actual crafted net weight, metal purity, making charges, wastage allowance, gemstone weight, applicable GST (3%), and store billing pricing rules.
          </p>
        </div>
      </div>
    </div>
  );
};

