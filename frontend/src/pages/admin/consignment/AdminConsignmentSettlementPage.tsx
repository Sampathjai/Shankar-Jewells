import React, { useState, useEffect } from 'react';
import { fetchApi } from '../../../api/client';
import {
  FileCheck2,
  Search,
  CheckCircle2,
  Printer,
  AlertCircle,
  Percent,
  RefreshCw,
} from 'lucide-react';

interface ConsignmentItem {
  id: string;
  productId: string;
  sku: string;
  name: string;
  grossWeight: number;
  netWeight: number;
  issuedQuantity: number;
  issuedWeight: number;
  soldQuantity: number;
  soldWeight: number;
  returnedQuantity: number;
  returnedWeight: number;
  balanceQuantity: number;
  balanceWeight: number;
  unitPrice: number;
}

interface Consignment {
  id: string;
  consignmentNumber: string;
  issueDate: string;
  status: string;
  balanceQuantity: number;
  balanceWeight: number;
  partner: {
    id: string;
    businessName: string;
    mobile: string;
    commissionType: string;
    commissionBasis: string;
    commissionValue: number;
  };
  items: ConsignmentItem[];
}

export const AdminConsignmentSettlementPage: React.FC = () => {
  const [consignments, setConsignments] = useState<Consignment[]>([]);
  const [selectedConsignmentId, setSelectedConsignmentId] = useState('');
  const [selectedConsignment, setSelectedConsignment] = useState<Consignment | null>(null);

  const [settlementReport, setSettlementReport] = useState<
    Record<string, { soldQty: number; returnedQty: number }>
  >({});
  const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER');
  const [referenceNo, setReferenceNo] = useState('');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdSettlement, setCreatedSettlement] = useState<any | null>(null);

  useEffect(() => {
    async function loadConsignments() {
      try {
        setLoading(true);
        const res = await fetchApi<{ success: boolean; data: Consignment[] }>('/consignment/issues');
        const activeOnly = res.data.filter(
          (c) => c.status === 'ISSUED' || c.status === 'PARTIALLY_SETTLED'
        );
        setConsignments(activeOnly);
      } catch (err: any) {
        setError(err.message || 'Failed to load consignment issues.');
      } finally {
        setLoading(false);
      }
    }
    loadConsignments();
  }, []);

  useEffect(() => {
    if (selectedConsignmentId) {
      const found = consignments.find((c) => c.id === selectedConsignmentId) || null;
      setSelectedConsignment(found);
      if (found) {
        const initialReport: Record<string, { soldQty: number; returnedQty: number }> = {};
        found.items.forEach((item) => {
          initialReport[item.id] = { soldQty: 0, returnedQty: 0 };
        });
        setSettlementReport(initialReport);
      }
    } else {
      setSelectedConsignment(null);
    }
  }, [selectedConsignmentId, consignments]);

  const updateReportField = (itemId: string, field: 'soldQty' | 'returnedQty', val: number) => {
    if (val < 0) return;
    setSettlementReport((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: val,
      },
    }));
  };

  // Calculations
  let grossSalesValue = 0;
  let totalSoldWt = 0;
  let totalReturnedQty = 0;
  let totalSoldQty = 0;

  if (selectedConsignment) {
    selectedConsignment.items.forEach((item) => {
      const report = settlementReport[item.id] || { soldQty: 0, returnedQty: 0 };
      const sQty = report.soldQty || 0;
      const rQty = report.returnedQty || 0;

      totalSoldQty += sQty;
      totalReturnedQty += rQty;

      const ratio = item.issuedQuantity > 0 ? item.netWeight / item.issuedQuantity : 0;
      totalSoldWt += sQty * ratio;
      grossSalesValue += sQty * item.unitPrice;
    });
  }

  // Calculate commission based on partner policy
  let commissionAmount = 0;
  if (selectedConsignment?.partner) {
    const p = selectedConsignment.partner;
    if (p.commissionType === 'PERCENTAGE') {
      commissionAmount = grossSalesValue * ((p.commissionValue || 5) / 100);
    } else if (p.commissionType === 'PER_GRAM') {
      commissionAmount = totalSoldWt * (p.commissionValue || 100);
    } else if (p.commissionType === 'FIXED') {
      commissionAmount = p.commissionValue || 0;
    }
  }

  const netPayable = Math.max(0, grossSalesValue - commissionAmount);

  const handleSettle = async () => {
    if (!selectedConsignment) return;

    try {
      setLoading(true);
      setError('');

      const itemsPayload = Object.entries(settlementReport).map(([itemId, rep]) => ({
        itemId,
        soldQuantity: rep.soldQty,
        returnedQuantity: rep.returnedQty,
      }));

      const res = await fetchApi<{ success: boolean; data: any }>(
        `/consignment/${selectedConsignment.id}/settlement`,
        {
          method: 'POST',
          body: JSON.stringify({
            items: itemsPayload,
            paymentMethod,
            referenceNo,
            notes,
          }),
        }
      );

      if (res.success) {
        setCreatedSettlement(res.data);
      }
    } catch (err: any) {
      setError(err.message || 'Consignment settlement failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-luxury-gold/20 pb-4">
        <div>
          <h1 className="font-serif text-2xl text-luxury-gold font-bold flex items-center gap-3">
            <FileCheck2 className="w-7 h-7 text-luxury-gold" />
            Consignment Stock Settlement & Returns
          </h1>
          <p className="text-xs text-luxury-ivory/60 mt-1">
            Report sold and returned stock, auto-calculate partner commission & restock store inventory
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Select Issue & Report Form (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-luxury-charcoal/60 border border-luxury-gold/20 rounded-2xl p-5 space-y-4 backdrop-blur-md">
            <h3 className="font-serif text-sm font-bold text-luxury-gold uppercase tracking-wider flex items-center gap-2">
              <FileCheck2 className="w-4 h-4" /> 1. Select Active Consignment Issue
            </h3>

            <select
              value={selectedConsignmentId}
              onChange={(e) => setSelectedConsignmentId(e.target.value)}
              className="w-full bg-luxury-charcoal border border-luxury-gold/30 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-luxury-gold"
            >
              <option value="">-- Choose Consignment Issue Note --</option>
              {consignments.map((c) => (
                <option key={c.id} value={c.id}>
                  #{c.consignmentNumber} - {c.partner.businessName} ({c.balanceQuantity} items / {c.balanceWeight}g remaining)
                </option>
              ))}
            </select>
          </div>

          {selectedConsignment && (
            <div className="bg-luxury-charcoal/60 border border-luxury-gold/20 rounded-2xl p-5 space-y-4 backdrop-blur-md">
              <h3 className="font-serif text-sm font-bold text-luxury-gold uppercase tracking-wider flex items-center gap-2">
                <RefreshCw className="w-4 h-4" /> 2. Enter Sold & Returned Quantities
              </h3>

              <div className="space-y-3 text-xs">
                {selectedConsignment.items.map((item) => {
                  const rep = settlementReport[item.id] || { soldQty: 0, returnedQty: 0 };
                  const invalid = rep.soldQty + rep.returnedQty > item.balanceQuantity;

                  return (
                    <div
                      key={item.id}
                      className={`p-4 rounded-xl border space-y-2 ${
                        invalid ? 'bg-rose-500/10 border-rose-500/40' : 'bg-white/5 border-luxury-gold/10'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-semibold text-white">{item.name}</div>
                        <div className="text-[10px] text-luxury-ivory/50">
                          Issued Balance: <strong className="text-luxury-gold">{item.balanceQuantity}</strong>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-[11px] pt-1">
                        <div>
                          <label className="block text-emerald-400 font-semibold mb-1">Sold Quantity</label>
                          <input
                            type="number"
                            min="0"
                            max={item.balanceQuantity}
                            value={rep.soldQty}
                            onChange={(e) =>
                              updateReportField(item.id, 'soldQty', parseInt(e.target.value) || 0)
                            }
                            className="w-full bg-luxury-charcoal border border-emerald-500/40 rounded px-2 py-1 text-white font-bold"
                          />
                        </div>

                        <div>
                          <label className="block text-cyan-400 font-semibold mb-1">Returned Quantity (To Store)</label>
                          <input
                            type="number"
                            min="0"
                            max={item.balanceQuantity}
                            value={rep.returnedQty}
                            onChange={(e) =>
                              updateReportField(item.id, 'returnedQty', parseInt(e.target.value) || 0)
                            }
                            className="w-full bg-luxury-charcoal border border-cyan-500/40 rounded px-2 py-1 text-white font-bold"
                          />
                        </div>
                      </div>

                      {invalid && (
                        <div className="text-[10px] text-rose-400 font-bold">
                          Sold + Returned cannot exceed remaining balance ({item.balanceQuantity})!
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Settlement Financial Summary (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {selectedConsignment && (
            <div className="bg-luxury-charcoal/60 border border-luxury-gold/20 rounded-2xl p-5 space-y-4 backdrop-blur-md">
              <h3 className="font-serif text-sm font-bold text-luxury-gold uppercase tracking-wider flex items-center justify-between border-b border-luxury-gold/20 pb-3">
                <span>Settlement Breakdown</span>
                <span className="text-xs text-luxury-ivory/60">{selectedConsignment.partner.businessName}</span>
              </h3>

              <div className="space-y-2 text-xs text-luxury-ivory/80">
                <div className="flex justify-between">
                  <span>Gross Sales Value:</span>
                  <span className="font-bold text-white">₹{grossSalesValue.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-amber-300">
                  <span>Commission ({selectedConsignment.partner.commissionValue}%):</span>
                  <span>- ₹{commissionAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-base font-serif font-bold text-white border-t border-luxury-gold/10 pt-2">
                  <span>Net Payable To Partner:</span>
                  <span className="text-emerald-400">₹{netPayable.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="space-y-3 pt-3 border-t border-luxury-gold/20 text-xs">
                <div>
                  <label className="block text-luxury-ivory/70 font-semibold mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full bg-luxury-charcoal border border-luxury-gold/30 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS)</option>
                    <option value="CHEQUE">Cheque</option>
                    <option value="UPI">UPI</option>
                    <option value="CASH">Cash</option>
                  </select>
                </div>

                <button
                  onClick={handleSettle}
                  disabled={loading || grossSalesValue === 0}
                  className="w-full py-3.5 bg-luxury-gold hover:bg-luxury-goldHover text-luxury-charcoal font-bold rounded-xl shadow-luxury text-xs uppercase tracking-wider transition-all disabled:opacity-50"
                >
                  {loading ? 'Executing Settlement...' : 'Finalize Consignment Settlement'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Generated Settlement Receipt Modal */}
      {createdSettlement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-3xl bg-white text-luxury-charcoal rounded-2xl p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-gray-200 pb-4 print:hidden">
              <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5" /> Consignment Settlement Completed!
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-4 py-2 bg-luxury-charcoal text-white rounded-xl text-xs font-semibold hover:bg-black"
                >
                  <Printer className="w-4 h-4" /> Print Settlement Receipt
                </button>
                <button
                  onClick={() => setCreatedSettlement(null)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-300"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Printable Settlement Layout */}
            <div className="p-6 border border-gray-300 rounded-xl space-y-6 text-xs bg-white text-black">
              <div className="flex justify-between items-start border-b-2 border-emerald-600 pb-4">
                <div>
                  <h1 className="font-serif text-2xl font-bold text-emerald-900">SHANKER JEWELLS</h1>
                  <p className="text-[10px] text-gray-600 uppercase tracking-widest font-semibold">
                    CONSIGNMENT SETTLEMENT RECEIPT
                  </p>
                </div>
                <div className="text-right">
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-900 font-bold text-xs rounded uppercase">
                    SETTLEMENT
                  </span>
                  <div className="font-mono font-bold text-sm text-gray-800 mt-2">
                    #{createdSettlement.settlementNumber}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-lg text-xs">
                <div>
                  <span className="text-[10px] text-gray-500 font-bold uppercase">Partner</span>
                  <div className="font-bold text-gray-900">{selectedConsignment?.partner.businessName}</div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-gray-500 font-bold uppercase">Net Payable</span>
                  <div className="font-serif text-lg font-bold text-emerald-800">
                    ₹{createdSettlement.netPayable.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminConsignmentSettlementPage;
