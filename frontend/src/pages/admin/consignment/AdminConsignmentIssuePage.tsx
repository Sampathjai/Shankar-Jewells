import React, { useState, useEffect } from 'react';
import { fetchApi } from '../../../api/client';
import { Product } from '../../../types';
import {
  Truck,
  Plus,
  Search,
  Trash2,
  AlertCircle,
  Printer,
  CheckCircle2,
  Layers,
  FileCheck2,
} from 'lucide-react';

interface ConsignmentPartner {
  id: string;
  businessName: string;
  contactPerson?: string;
  mobile: string;
  commissionType: string;
  commissionValue: number;
}

interface IssueItem {
  product: Product;
  quantity: number;
  unitPrice: number;
}

export const AdminConsignmentIssuePage: React.FC = () => {
  const [partners, setPartners] = useState<ConsignmentPartner[]>([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState('');
  const [selectedPartner, setSelectedPartner] = useState<ConsignmentPartner | null>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState('');

  const [issueItems, setIssueItems] = useState<IssueItem[]>([]);
  const [expectedSettlementDate, setExpectedSettlementDate] = useState('');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdConsignment, setCreatedConsignment] = useState<any | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const pRes = await fetchApi<{ success: boolean; data: ConsignmentPartner[] }>('/consignment/partners');
        setPartners(pRes.data);

        const prodRes = await fetchApi<{ data: Product[] }>('/products');
        setProducts(prodRes.data);
      } catch (err: any) {
        setError(err.message || 'Failed to load consignment data.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    if (selectedPartnerId) {
      const found = partners.find((p) => p.id === selectedPartnerId) || null;
      setSelectedPartner(found);
    } else {
      setSelectedPartner(null);
    }
  }, [selectedPartnerId, partners]);

  const addProductToIssue = (product: Product) => {
    const existingIndex = issueItems.findIndex((item) => item.product.id === product.id);
    if (existingIndex > -1) {
      const updated = [...issueItems];
      updated[existingIndex].quantity += 1;
      setIssueItems(updated);
    } else {
      setIssueItems([
        ...issueItems,
        {
          product,
          quantity: 1,
          unitPrice: product.displayPrice || product.sellingPrice,
        },
      ]);
    }
  };

  const removeIssueItem = (index: number) => {
    setIssueItems(issueItems.filter((_, i) => i !== index));
  };

  const updateItemQty = (index: number, qty: number) => {
    if (qty <= 0) return;
    const updated = [...issueItems];
    updated[index].quantity = qty;
    setIssueItems(updated);
  };

  const totalQuantity = issueItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalNetWeight = issueItems.reduce((sum, item) => sum + item.quantity * item.product.netWeight, 0);
  const totalValue = issueItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  const handleIssueStock = async () => {
    if (!selectedPartner) {
      alert('Please select a consignment partner.');
      return;
    }
    if (issueItems.length === 0) {
      alert('Please add at least one stock item to issue.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const payload = {
        partnerId: selectedPartner.id,
        expectedSettlementDate: expectedSettlementDate || undefined,
        notes,
        items: issueItems.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      };

      const res = await fetchApi<{ success: boolean; data: any }>('/consignment/issues', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res.success) {
        setCreatedConsignment(res.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to issue consignment stock.');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.sku.toLowerCase().includes(productSearch.toLowerCase())
  );

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-luxury-gold/20 pb-4">
        <div>
          <h1 className="font-serif text-2xl text-luxury-gold font-bold flex items-center gap-3">
            <Truck className="w-7 h-7 text-luxury-gold" />
            Consignment Bulk Stock Issue Module
          </h1>
          <p className="text-xs text-luxury-ivory/60 mt-1">
            Place stock with retail partners (transfers stock without immediate sales recognition)
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Partner Select & Product Search (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Partner Select */}
          <div className="bg-luxury-charcoal/60 border border-luxury-gold/20 rounded-2xl p-5 space-y-4 backdrop-blur-md">
            <h3 className="font-serif text-sm font-bold text-luxury-gold uppercase tracking-wider flex items-center gap-2">
              <Truck className="w-4 h-4" /> 1. Select Consignment Partner
            </h3>

            <div className="space-y-3 text-xs">
              <select
                value={selectedPartnerId}
                onChange={(e) => setSelectedPartnerId(e.target.value)}
                className="w-full bg-luxury-charcoal border border-luxury-gold/30 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-luxury-gold"
              >
                <option value="">-- Choose Consignment Retail Partner --</option>
                {partners.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.businessName} ({p.mobile}) - Policy: {p.commissionValue}% {p.commissionType}
                  </option>
                ))}
              </select>

              {selectedPartner && (
                <div className="p-3 bg-white/5 rounded-xl border border-luxury-gold/20 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-luxury-ivory/50 uppercase font-semibold">Consignment Policy</span>
                    <div className="text-sm font-bold text-white">
                      Commission: {selectedPartner.commissionValue}% ({selectedPartner.commissionType})
                    </div>
                  </div>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-full font-bold uppercase">
                    Partner Active
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Product Manual Selection Grid */}
          <div className="bg-luxury-charcoal/60 border border-luxury-gold/20 rounded-2xl p-5 space-y-4 backdrop-blur-md">
            <h3 className="font-serif text-sm font-bold text-luxury-gold uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4" /> 2. Add Stock Items To Issue Note
            </h3>

            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-luxury-ivory/40" />
              <input
                type="text"
                placeholder="Search products by name or SKU..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="w-full bg-luxury-charcoal border border-luxury-gold/30 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-luxury-gold"
              />
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2 pr-1 text-xs">
              {filteredProducts.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-luxury-gold/10 transition-all"
                >
                  <div>
                    <div className="font-semibold text-white">{p.name}</div>
                    <div className="text-[10px] text-luxury-ivory/50 font-mono">
                      SKU: {p.sku} • {p.purity} {p.metalType} • {p.netWeight}g Net
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="font-bold text-luxury-gold">
                        ₹{(p.displayPrice || p.sellingPrice).toLocaleString('en-IN')}
                      </div>
                      <div className="text-[9px] text-luxury-ivory/40">Vault Stock: {p.stockQuantity}</div>
                    </div>
                    <button
                      onClick={() => addProductToIssue(p)}
                      className="p-1.5 rounded-lg bg-luxury-gold text-luxury-charcoal font-bold hover:bg-luxury-goldHover transition-all"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Issued Items Summary (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-luxury-charcoal/60 border border-luxury-gold/20 rounded-2xl p-5 space-y-4 backdrop-blur-md">
            <h3 className="font-serif text-sm font-bold text-luxury-gold uppercase tracking-wider flex items-center justify-between border-b border-luxury-gold/20 pb-3">
              <span>Consignment Issue Note</span>
              <span className="text-xs text-luxury-ivory/70">{issueItems.length} Products</span>
            </h3>

            <div className="space-y-3 max-h-64 overflow-y-auto text-xs">
              {issueItems.length === 0 ? (
                <div className="text-center py-10 text-luxury-ivory/40">
                  No stock items added to issue note yet.
                </div>
              ) : (
                issueItems.map((item, idx) => (
                  <div key={idx} className="p-3 bg-white/5 rounded-xl border border-luxury-gold/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-white">{item.product.name}</div>
                      <button
                        onClick={() => removeIssueItem(idx)}
                        className="text-rose-400 hover:text-rose-300"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <span className="text-luxury-ivory/60">Issue Qty:</span>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItemQty(idx, parseInt(e.target.value) || 1)}
                          className="w-14 bg-luxury-charcoal border border-luxury-gold/30 rounded px-1.5 py-0.5 text-center text-white font-bold"
                        />
                      </div>

                      <div className="text-right">
                        <div className="text-luxury-ivory/60">
                          Total Net Weight: <strong>{(item.quantity * item.product.netWeight).toFixed(2)}g</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Totals Summary */}
            <div className="border-t border-luxury-gold/20 pt-4 space-y-2 text-xs text-luxury-ivory/80">
              <div className="flex justify-between">
                <span>Total Issued Units:</span>
                <span className="font-bold text-white">{totalQuantity}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Net Metal Weight:</span>
                <span className="font-bold text-white">{totalNetWeight.toFixed(2)} grams</span>
              </div>
              <div className="flex justify-between text-base font-serif font-bold text-white border-t border-luxury-gold/10 pt-2">
                <span>Est. Consignment Value:</span>
                <span className="text-luxury-gold">₹{totalValue.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="space-y-3 pt-2 text-xs border-t border-luxury-gold/20">
              <div>
                <label className="block text-luxury-ivory/70 font-semibold mb-1">
                  Expected Settlement Date
                </label>
                <input
                  type="date"
                  value={expectedSettlementDate}
                  onChange={(e) => setExpectedSettlementDate(e.target.value)}
                  className="w-full bg-luxury-charcoal border border-luxury-gold/30 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <button
                onClick={handleIssueStock}
                disabled={loading || issueItems.length === 0 || !selectedPartner}
                className="w-full py-3.5 bg-luxury-gold hover:bg-luxury-goldHover text-luxury-charcoal font-bold rounded-xl shadow-luxury text-xs uppercase tracking-wider transition-all disabled:opacity-50"
              >
                {loading ? 'Issuing Stock...' : 'Issue Consignment Stock Note'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Generated Consignment Issue Note Modal */}
      {createdConsignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-3xl bg-white text-luxury-charcoal rounded-2xl p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-gray-200 pb-4 print:hidden">
              <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5" /> Consignment Stock Issued Successfully!
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-4 py-2 bg-luxury-charcoal text-white rounded-xl text-xs font-semibold hover:bg-black"
                >
                  <Printer className="w-4 h-4" /> Print Issue Note
                </button>
                <button
                  onClick={() => setCreatedConsignment(null)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-300"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Printable Consignment Issue Note Layout */}
            <div className="p-6 border border-gray-300 rounded-xl space-y-6 text-xs bg-white text-black">
              <div className="flex justify-between items-start border-b-2 border-emerald-600 pb-4">
                <div>
                  <h1 className="font-serif text-2xl font-bold text-emerald-900">SHANKER JEWELLS</h1>
                  <p className="text-[10px] text-gray-600 uppercase tracking-widest font-semibold">
                    CONSIGNMENT STOCK ISSUE NOTE (BULK PLACEMENT)
                  </p>
                  <p className="text-[10px] text-gray-500 mt-1">
                    No.4 Sandhukadai, Bigbazzar Street, Trichy - 620008 | Phone: +91 9443949192
                  </p>
                </div>
                <div className="text-right">
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-900 font-bold text-xs rounded uppercase tracking-wider">
                    STOCK ISSUE NOTE
                  </span>
                  <div className="font-mono font-bold text-sm text-gray-800 mt-2">
                    #{createdConsignment.consignmentNumber}
                  </div>
                  <div className="text-[10px] text-gray-500">
                    Issue Date: {new Date(createdConsignment.issueDate).toLocaleDateString('en-IN')}
                  </div>
                </div>
              </div>

              {/* Partner Details */}
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <span className="text-[10px] text-gray-500 uppercase font-bold">Consignment Partner / Retailer</span>
                <div className="font-bold text-sm text-gray-900">{createdConsignment.partner?.businessName}</div>
                <div className="text-gray-600">Mobile: {createdConsignment.partner?.mobile}</div>
              </div>

              {/* Items Table */}
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-300 text-[10px] uppercase text-gray-700 bg-gray-100">
                    <th className="py-2 px-2">SKU</th>
                    <th className="py-2 px-2">Product Name</th>
                    <th className="py-2 px-2 text-right">Issued Qty</th>
                    <th className="py-2 px-2 text-right">Issued Net Wt (g)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {createdConsignment.items?.map((item: any) => (
                    <tr key={item.id}>
                      <td className="py-2 px-2 font-mono text-[10px]">{item.sku}</td>
                      <td className="py-2 px-2 font-medium">{item.name}</td>
                      <td className="py-2 px-2 text-right font-bold">{item.issuedQuantity}</td>
                      <td className="py-2 px-2 text-right font-mono font-bold">{item.issuedWeight}g</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Footer Terms */}
              <div className="pt-8 flex justify-between items-end text-[10px] text-gray-500 border-t border-gray-200">
                <div>
                  <p className="font-bold text-gray-700">Notice:</p>
                  <p>Stock remains property of Shanker Jewells until sold & settled.</p>
                </div>
                <div className="text-center">
                  <div className="h-10 border-b border-gray-400 w-36 mb-1" />
                  <p className="font-bold text-gray-800">Partner Acknowledgment</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminConsignmentIssuePage;
