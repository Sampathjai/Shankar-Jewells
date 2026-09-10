import React, { useEffect, useState } from 'react';
import { CustomRequest } from '../../types';
import { fetchApi } from '../../api/client';
import { Sparkles, FileText, CheckCircle2, Send, Download } from 'lucide-react';

export const AdminCustomRequestsPage: React.FC = () => {
  const [requests, setRequests] = useState<CustomRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReq, setSelectedReq] = useState<CustomRequest | null>(null);
  const [showQuoteModal, setShowQuoteModal] = useState(false);

  const [quoteForm, setQuoteForm] = useState({
    metalType: 'GOLD',
    purity: 'K22',
    grossWeight: '34.2',
    netWeight: '31.5',
    wastage: '3.5',
    makingCharges: '14175',
    stoneCharges: '18500',
    otherCharges: '1200',
    discount: '2000',
    terms: '50% advance required upon design confirmation. Delivery within 14 working days.',
  });

  useEffect(() => {
    loadRequests();
  }, []);

  async function loadRequests() {
    try {
      setLoading(true);
      const res = await fetchApi<{ data: CustomRequest[] }>('/custom-requests');
      setRequests(res.data);
    } catch (err) {
      console.error('Failed to load custom requests:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await fetchApi(`/custom-requests/${id}/status`, {
        method: 'POST',
        body: JSON.stringify({ status }),
      });
      loadRequests();
    } catch (err: any) {
      alert(err.message || 'Status update failed.');
    }
  };

  const handleCreateQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReq) return;

    try {
      await fetchApi('/quotations', {
        method: 'POST',
        body: JSON.stringify({
          customRequestId: selectedReq.id,
          ...quoteForm,
        }),
      });

      setShowQuoteModal(false);
      loadRequests();
      alert('Quotation generated successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to generate quotation.');
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <span className="text-xs font-semibold text-luxury-gold uppercase tracking-widest">
          Bespoke Custom Atelier
        </span>
        <h1 className="font-serif text-3xl font-bold text-luxury-charcoal">
          Custom Jewellery Requests & Quotations
        </h1>
      </div>

      {/* Requests Pipeline List */}
      <div className="grid grid-cols-1 gap-4">
        {requests.map((req) => (
          <div key={req.id} className="bg-white rounded-2xl p-6 border border-luxury-border shadow-card space-y-4 text-xs">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-luxury-border pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <strong className="font-serif text-xl font-bold text-luxury-charcoal">{req.requestNumber}</strong>
                  <span className="px-2.5 py-0.5 rounded bg-luxury-gold/20 text-luxury-gold font-bold uppercase text-[10px]">
                    {req.status}
                  </span>
                </div>
                <p className="text-luxury-gray">
                  Customer: <strong>{req.name}</strong> ({req.phone}) • {req.jewelleryType} ({req.purity} {req.metalType})
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <select
                  value={req.status}
                  onChange={(e) => handleUpdateStatus(req.id, e.target.value)}
                  className="p-1.5 border rounded bg-white font-semibold"
                >
                  <option value="NEW">Status: NEW</option>
                  <option value="REVIEWING">Status: REVIEWING</option>
                  <option value="QUOTATION_SENT">Status: QUOTATION_SENT</option>
                  <option value="CUSTOMER_APPROVED">Status: CUSTOMER_APPROVED</option>
                  <option value="IN_PRODUCTION">Status: IN_PRODUCTION</option>
                  <option value="READY">Status: READY</option>
                  <option value="DELIVERED">Status: DELIVERED</option>
                </select>

                <button
                  onClick={() => {
                    setSelectedReq(req);
                    setShowQuoteModal(true);
                  }}
                  className="px-4 py-1.5 rounded-full bg-luxury-gold text-white font-semibold uppercase hover:bg-luxury-gold-dark"
                >
                  Build / Revise Quotation
                </button>
              </div>
            </div>

            {/* Design Image & Requirements */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              {req.images[0] && (
                <img
                  src={req.images[0].url}
                  alt=""
                  className="w-full h-32 object-cover rounded-xl border"
                />
              )}
              <div className="sm:col-span-3 space-y-1">
                <div>Budget: <strong>{req.approxBudget ? `₹${req.approxBudget.toLocaleString('en-IN')}` : 'Flexible'}</strong></div>
                <div>Target Weight: <strong>{req.approxWeight ? `${req.approxWeight}g` : 'Standard'}</strong></div>
                <div>Customer Notes: <em>{req.notes || 'None'}</em></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quotation Builder Modal */}
      {showQuoteModal && selectedReq && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <form onSubmit={handleCreateQuotation} className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-4 text-xs">
            <h3 className="font-serif text-xl font-bold border-b pb-2">
              Quotation Builder ({selectedReq.requestNumber})
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold block mb-1">Metal</label>
                <select
                  value={quoteForm.metalType}
                  onChange={(e) => setQuoteForm({ ...quoteForm, metalType: e.target.value })}
                  className="w-full p-2 border rounded"
                >
                  <option value="GOLD">Gold</option>
                  <option value="SILVER">Silver</option>
                </select>
              </div>

              <div>
                <label className="font-semibold block mb-1">Purity</label>
                <select
                  value={quoteForm.purity}
                  onChange={(e) => setQuoteForm({ ...quoteForm, purity: e.target.value })}
                  className="w-full p-2 border rounded"
                >
                  <option value="K22">22K Gold</option>
                  <option value="K18">18K Gold</option>
                  <option value="K24">24K Pure</option>
                  <option value="SILVER_925">925 Silver</option>
                </select>
              </div>

              <div>
                <label className="font-semibold block mb-1">Gross Weight (g)</label>
                <input
                  type="number"
                  step="0.01"
                  value={quoteForm.grossWeight}
                  onChange={(e) => setQuoteForm({ ...quoteForm, grossWeight: e.target.value })}
                  className="w-full p-2 border rounded"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Net Weight (g)</label>
                <input
                  type="number"
                  step="0.01"
                  value={quoteForm.netWeight}
                  onChange={(e) => setQuoteForm({ ...quoteForm, netWeight: e.target.value })}
                  className="w-full p-2 border rounded"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Making Charges (₹)</label>
                <input
                  type="number"
                  value={quoteForm.makingCharges}
                  onChange={(e) => setQuoteForm({ ...quoteForm, makingCharges: e.target.value })}
                  className="w-full p-2 border rounded"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Gemstones Charges (₹)</label>
                <input
                  type="number"
                  value={quoteForm.stoneCharges}
                  onChange={(e) => setQuoteForm({ ...quoteForm, stoneCharges: e.target.value })}
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold block mb-1">Terms & Conditions</label>
              <textarea
                rows={2}
                value={quoteForm.terms}
                onChange={(e) => setQuoteForm({ ...quoteForm, terms: e.target.value })}
                className="w-full p-2 border rounded"
              />
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowQuoteModal(false)}
                className="px-4 py-2 border rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-luxury-gold text-white font-semibold rounded"
              >
                Generate Versioned Quotation
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

