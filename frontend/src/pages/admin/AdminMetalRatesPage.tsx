import React, { useEffect, useState } from 'react';
import { fetchApi } from '../../api/client';
import { useToast } from '../../components/common/Toast';
import { formatCurrency } from '../../utils/formatters';
import {
  TrendingUp,
  RefreshCw,
  Plus,
  ShieldCheck,
  Edit3,
  Calendar,
  Clock,
  FileText,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react';

interface MetalRateCardItem {
  id?: string;
  metalType: string;
  purity: string;
  label: string;
  ratePerGram: number;
  updatedAt?: string;
}

interface MetalRateHistoryItem {
  id: string;
  metalType: string;
  purity: string;
  ratePerGram: number;
  effectiveFrom: string;
  effectiveTime?: string;
  source?: string;
  notes?: string;
  active?: boolean;
  createdBy?: string;
  createdAt: string;
}

export const AdminMetalRatesPage: React.FC = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState<boolean>(true);
  const [history, setHistory] = useState<MetalRateHistoryItem[]>([]);
  const [ratesData, setRatesData] = useState<{
    gold24k: number;
    gold22k: number;
    gold18k: number;
    silver999: number;
  }>({
    gold24k: 15431,
    gold22k: 14145,
    gold18k: 11915,
    silver999: 255,
  });

  // Modal State
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [selectedRate, setSelectedRate] = useState<{
    metalType: string;
    purity: string;
    label: string;
    currentRate: number;
  }>({
    metalType: 'GOLD',
    purity: 'K24',
    label: '24K GOLD',
    currentRate: 15431,
  });

  // Form State
  const [rateInput, setRateInput] = useState<string>('15431.00');
  const [sourceInput, setSourceInput] = useState<string>('Manual Store Rate');
  const [effectiveDate, setEffectiveDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [effectiveTime, setEffectiveTime] = useState<string>(
    new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })
  );
  const [notesInput, setNotesInput] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string>('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [curRes, histRes] = await Promise.all([
        fetchApi<{
          success: boolean;
          rates: {
            gold24k: { rate: number };
            gold22k: { rate: number };
            gold18k: { rate: number };
            silver999: { rate: number };
          };
        }>('/metal-rates/current'),
        fetchApi<{ success: boolean; data: MetalRateHistoryItem[] }>('/metal-rates/history?limit=100'),
      ]);

      if (curRes.success && curRes.rates) {
        setRatesData({
          gold24k: curRes.rates.gold24k.rate,
          gold22k: curRes.rates.gold22k.rate,
          gold18k: curRes.rates.gold18k.rate,
          silver999: curRes.rates.silver999.rate,
        });
      }

      if (histRes.success) {
        setHistory(histRes.data || []);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load metal rates data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openEditModal = (metalType: string, purity: string, label: string, currentRate: number) => {
    setSelectedRate({ metalType, purity, label, currentRate });
    setRateInput(currentRate.toFixed(2));
    setSourceInput('Manual Store Rate');
    setEffectiveDate(new Date().toISOString().split('T')[0]);
    setEffectiveTime(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false }));
    setNotesInput('');
    setValidationError('');
    setShowEditModal(true);
  };

  const handleSaveRate = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    const parsedRate = parseFloat(rateInput);
    if (isNaN(parsedRate) || parsedRate <= 0) {
      setValidationError('Please enter a valid positive numeric rate per gram.');
      return;
    }

    try {
      setSaving(true);
      const res = await fetchApi<{ success: boolean; message: string }>('/metal-rates', {
        method: 'POST',
        body: JSON.stringify({
          metalType: selectedRate.metalType,
          purity: selectedRate.purity,
          ratePerGram: parsedRate,
          effectiveDate,
          effectiveTime,
          source: sourceInput,
          notes: notesInput,
        }),
      });

      if (res.success) {
        showToast(res.message || 'Metal rate updated successfully!', 'success');
        setShowEditModal(false);
        loadData();
      }
    } catch (err: any) {
      setValidationError(err.message || 'Failed to update rate. Please check input values.');
    } finally {
      setSaving(false);
    }
  };

  const rateCardsList: MetalRateCardItem[] = [
    { metalType: 'GOLD', purity: 'K24', label: '24K GOLD', ratePerGram: ratesData.gold24k },
    { metalType: 'GOLD', purity: 'K22', label: '22K GOLD', ratePerGram: ratesData.gold22k },
    { metalType: 'GOLD', purity: 'K18', label: '18K GOLD', ratePerGram: ratesData.gold18k },
    { metalType: 'SILVER', purity: 'SILVER_999', label: 'SILVER 999', ratePerGram: ratesData.silver999 },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-8 bg-luxury-ivory min-h-screen max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-luxury-border pb-4">
        <div>
          <span className="text-xs font-bold text-luxury-gold uppercase tracking-widest">
            Core Pricing Engine • Central Source of Truth
          </span>
          <h1 className="font-serif text-3xl font-bold text-luxury-charcoal">
            Editable Metal Rate Board
          </h1>
          <p className="text-xs text-luxury-gray mt-1">
            Real-time daily store rates for Gold & Silver. Updates propagate across Public Live Rates, Retail POS, Wholesale & Quotations.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="px-4 py-2.5 rounded-xl border border-luxury-border bg-white text-luxury-charcoal font-bold text-xs uppercase tracking-wider hover:border-luxury-gold transition-all flex items-center gap-2 shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 text-luxury-gold ${loading ? 'animate-spin' : ''}`} /> Refresh Board
        </button>
      </div>

      {/* Rate Cards Grid (24K Gold, 22K Gold, 18K Gold, Silver 999) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {rateCardsList.map((card) => (
          <div
            key={`${card.metalType}-${card.purity}`}
            className="bg-white p-6 rounded-2xl border border-luxury-border shadow-card flex flex-col justify-between space-y-4 hover:border-luxury-gold/50 transition-all"
          >
            <div className="space-y-1">
              <span className="text-xs text-luxury-gray font-bold uppercase tracking-wider block">
                {card.label}
              </span>
              <div className="font-serif text-3xl font-bold text-luxury-gold">
                ₹{card.ratePerGram.toLocaleString('en-IN', { minimumFractionDigits: 2 })} <span className="text-sm font-sans font-normal text-luxury-gray">/ g</span>
              </div>
            </div>

            <button
              onClick={() => openEditModal(card.metalType, card.purity, card.label, card.ratePerGram)}
              className="w-full py-2.5 px-4 bg-luxury-gold/10 hover:bg-luxury-gold text-luxury-gold hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 border border-luxury-gold/30"
            >
              <Edit3 className="w-4 h-4" /> Edit Rate
            </button>
          </div>
        ))}
      </div>

      {/* Rate History Audit Log */}
      <div className="bg-white rounded-2xl p-6 border border-luxury-border shadow-card space-y-4">
        <div className="flex justify-between items-center border-b border-luxury-border pb-3">
          <h3 className="font-serif text-lg font-bold text-luxury-charcoal flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-luxury-gold" /> Rate History & Immutable Audit Trail
          </h3>
          <span className="text-[11px] text-luxury-gray font-semibold">
            {history.length} historical rate changes logged
          </span>
        </div>

        {loading ? (
          <div className="text-center py-12 text-xs text-luxury-gray">
            Loading rate audit history...
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-12 text-xs text-luxury-gray">
            No historical rate logs recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-luxury-border text-luxury-gray font-bold uppercase text-[10px] bg-luxury-ivory/50">
                  <th className="py-3 px-4">Effective Date & Time</th>
                  <th className="py-3 px-4">Metal & Purity</th>
                  <th className="py-3 px-4 text-right">Rate Per Gram</th>
                  <th className="py-3 px-4">Source</th>
                  <th className="py-3 px-4">Updated By</th>
                  <th className="py-3 px-4">Notes / Purpose</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-luxury-border/60">
                {history.map((h, idx) => (
                  <tr key={h.id || idx} className="hover:bg-luxury-ivory/40 transition-all">
                    <td className="py-3 px-4 font-mono text-luxury-gray">
                      {new Date(h.createdAt || h.effectiveFrom).toLocaleDateString('en-IN')} {h.effectiveTime || new Date(h.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 px-4 font-bold text-luxury-charcoal">
                      {h.metalType} ({h.purity})
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-luxury-gold text-sm">
                      ₹{h.ratePerGram.toLocaleString('en-IN', { minimumFractionDigits: 2 })}/g
                    </td>
                    <td className="py-3 px-4 text-luxury-gray font-medium">
                      {h.source || 'Manual Store Rate'}
                    </td>
                    <td className="py-3 px-4 text-luxury-charcoal font-semibold">
                      {h.createdBy || 'Super Admin'}
                    </td>
                    <td className="py-3 px-4 text-luxury-gray italic">
                      {h.notes || '-'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {idx === 0 || h.active ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                          Active
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium uppercase bg-slate-100 text-slate-600 border border-slate-200">
                          Archived
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Professional Edit Rate Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 border border-luxury-gold/40 shadow-2xl relative">
            <div className="flex justify-between items-center border-b border-luxury-border pb-4">
              <h3 className="font-serif text-xl font-bold text-luxury-charcoal flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-luxury-gold" />
                EDIT {selectedRate.label} RATE
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1.5 text-luxury-gray hover:text-luxury-charcoal rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {validationError && (
              <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                {validationError}
              </div>
            )}

            <form onSubmit={handleSaveRate} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-luxury-charcoal mb-1">
                  Rate per gram (₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  min="0.01"
                  value={rateInput}
                  onChange={(e) => setRateInput(e.target.value)}
                  placeholder="e.g. 15431.00"
                  className="w-full bg-luxury-ivory/50 border border-luxury-border rounded-xl px-4 py-3 font-mono font-bold text-base text-luxury-gold focus:outline-none focus:border-luxury-gold shadow-sm"
                />
                <span className="text-[10px] text-luxury-gray mt-1 block">
                  Current preview: ₹{parseFloat(rateInput || '0').toLocaleString('en-IN', { minimumFractionDigits: 2 })}/g
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-luxury-charcoal mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-luxury-gold" /> Effective Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={effectiveDate}
                    onChange={(e) => setEffectiveDate(e.target.value)}
                    className="w-full bg-luxury-ivory/50 border border-luxury-border rounded-xl px-3 py-2.5 text-luxury-charcoal font-medium focus:outline-none focus:border-luxury-gold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-luxury-charcoal mb-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-luxury-gold" /> Effective Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={effectiveTime}
                    onChange={(e) => setEffectiveTime(e.target.value)}
                    className="w-full bg-luxury-ivory/50 border border-luxury-border rounded-xl px-3 py-2.5 text-luxury-charcoal font-medium focus:outline-none focus:border-luxury-gold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-luxury-charcoal mb-1">
                  Source Provider *
                </label>
                <input
                  type="text"
                  required
                  value={sourceInput}
                  onChange={(e) => setSourceInput(e.target.value)}
                  placeholder="e.g. Manual Store Rate / Trichy Bullion Exchange"
                  className="w-full bg-luxury-ivory/50 border border-luxury-border rounded-xl px-4 py-2.5 text-luxury-charcoal focus:outline-none focus:border-luxury-gold"
                />
              </div>

              <div>
                <label className="block font-bold text-luxury-gray mb-1 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-luxury-gold" /> Staff Notes / Update Reason (Optional)
                </label>
                <textarea
                  rows={2}
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  placeholder="e.g. Adjusted evening market closing rate update"
                  className="w-full bg-luxury-ivory/50 border border-luxury-border rounded-xl px-4 py-2 text-luxury-charcoal focus:outline-none focus:border-luxury-gold"
                />
              </div>

              <div className="pt-4 border-t border-luxury-border flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-5 py-2.5 border border-luxury-border rounded-xl font-bold text-luxury-gray hover:text-luxury-charcoal uppercase tracking-wider text-[11px]"
                >
                  CANCEL
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-luxury-gold hover:bg-luxury-gold/90 text-white rounded-xl font-bold uppercase tracking-wider text-[11px] shadow-md transition-all flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {saving ? 'SAVING...' : 'SAVE RATE'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMetalRatesPage;
