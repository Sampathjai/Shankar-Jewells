import React, { useEffect, useState } from 'react';
import { fetchApi } from '../../api/client';
import { TrendingUp, RefreshCw, Plus, ShieldCheck } from 'lucide-react';

export const AdminMetalRatesPage: React.FC = () => {
  const [rates, setRates] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    metalType: 'GOLD',
    purity: 'K22',
    ratePerGram: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [curRes, histRes] = await Promise.all([
        fetchApi<{ data: any[] }>('/metal-rates/current'),
        fetchApi<{ data: any[] }>('/metal-rates/history?days=30'),
      ]);
      setRates(curRes.data);
      setHistory(histRes.data);
    } catch (err) {
      console.error('Failed to load metal rates:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleSyncAPI = async () => {
    try {
      setSyncing(true);
      await fetchApi('/metal-rates/sync', { method: 'POST' });
      loadData();
    } catch (err: any) {
      alert(err.message || 'Sync failed.');
    } finally {
      setSyncing(false);
    }
  };

  const handleUpdateRate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetchApi('/metal-rates', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      setShowModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to update rate.');
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs font-semibold text-luxury-gold uppercase tracking-widest">
            Core Pricing Engine
          </span>
          <h1 className="font-serif text-3xl font-bold text-luxury-charcoal">
            Bullion & Metal Rates Management
          </h1>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleSyncAPI}
            disabled={syncing}
            className="px-4 py-2.5 rounded-full border border-luxury-gold text-luxury-gold font-semibold text-xs uppercase tracking-wider hover:bg-luxury-gold hover:text-white transition-all flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} /> Sync Bullion API
          </button>

          <button
            onClick={() => setShowModal(true)}
            className="px-5 py-2.5 rounded-full bg-luxury-gold text-white font-semibold text-xs tracking-widest uppercase hover:bg-luxury-gold-dark transition-all flex items-center gap-2 shadow-luxury"
          >
            <Plus className="w-4 h-4" /> Override Metal Rate
          </button>
        </div>
      </div>

      {/* Active Rate Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {rates.map((r) => (
          <div key={r.id} className="bg-white p-5 rounded-2xl border border-luxury-border shadow-card space-y-1">
            <span className="text-xs text-luxury-gray font-semibold uppercase">{r.metalType} ({r.purity})</span>
            <div className="font-serif text-3xl font-bold text-luxury-gold">
              ₹{r.ratePerGram.toLocaleString('en-IN')}/g
            </div>
            <span className="text-[10px] text-luxury-gray block">
              Updated: {new Date(r.createdAt).toLocaleTimeString('en-IN')}
            </span>
          </div>
        ))}
      </div>

      {/* Rate History Audit Trail */}
      <div className="bg-white rounded-2xl p-6 border border-luxury-border shadow-card space-y-4">
        <h3 className="font-serif text-xl font-bold text-luxury-charcoal flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-luxury-gold" /> Rate Change History Log
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-luxury-border text-luxury-gold font-semibold uppercase">
                <th className="py-2.5 px-4">Timestamp</th>
                <th className="py-2.5 px-4">Metal / Purity</th>
                <th className="py-2.5 px-4">Rate Per Gram</th>
                <th className="py-2.5 px-4">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-luxury-border/50">
              {history.map((h) => (
                <tr key={h.id} className="hover:bg-luxury-beige/20">
                  <td className="py-2.5 px-4 font-mono text-[11px]">
                    {new Date(h.createdAt).toLocaleString('en-IN')}
                  </td>
                  <td className="py-2.5 px-4 font-semibold">
                    {h.metalType} ({h.purity})
                  </td>
                  <td className="py-2.5 px-4 font-bold text-luxury-gold">
                    ₹{h.ratePerGram.toLocaleString('en-IN')}
                  </td>
                  <td className="py-2.5 px-4 text-luxury-gray text-[10px] uppercase">
                    {h.source}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Override Rate Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <form onSubmit={handleUpdateRate} className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 text-xs">
            <h3 className="font-serif text-xl font-bold border-b pb-2">Set Manual Metal Rate</h3>

            <div>
              <label className="font-semibold block mb-1">Metal</label>
              <select
                value={formData.metalType}
                onChange={(e) => setFormData({ ...formData, metalType: e.target.value })}
                className="w-full p-2 border rounded"
              >
                <option value="GOLD">Gold</option>
                <option value="SILVER">Silver</option>
              </select>
            </div>

            <div>
              <label className="font-semibold block mb-1">Purity</label>
              <select
                value={formData.purity}
                onChange={(e) => setFormData({ ...formData, purity: e.target.value })}
                className="w-full p-2 border rounded"
              >
                <option value="K24">24K Gold</option>
                <option value="K22">22K Gold</option>
                <option value="K18">18K Gold</option>
                <option value="SILVER_999">999 Fine Silver</option>
              </select>
            </div>

            <div>
              <label className="font-semibold block mb-1">New Rate Per Gram (₹)</label>
              <input
                type="number"
                step="0.1"
                required
                placeholder="e.g. 6850"
                value={formData.ratePerGram}
                onChange={(e) => setFormData({ ...formData, ratePerGram: e.target.value })}
                className="w-full p-2 border rounded"
              />
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-luxury-gold text-white font-semibold rounded"
              >
                Save Rate
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

