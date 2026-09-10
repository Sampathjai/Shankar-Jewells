import React, { useState, useEffect } from 'react';
import { fetchApi } from '../../../api/client';
import { useToast } from '../../../components/common/Toast';
import { CustomerPhotoPreview } from '../../../components/common/CustomerPhotoPreview';
import { WholesalePaymentReceiptModal } from '../../../components/wholesale/WholesalePaymentReceiptModal';
import { formatCurrency } from '../../../utils/formatters';
import {
  calculateMixedSettlementFrontend,
  formatGoldGrams,
  roundGoldGrams,
} from '../../../utils/goldEquivalent';
import {
  Coins,
  CheckCircle2,
  AlertTriangle,
  User,
  Search,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Printer,
  DollarSign,
  Layers,
  ShieldCheck,
  Building2,
  FileSpreadsheet,
} from 'lucide-react';

interface WholesaleCustomer {
  id: string;
  businessName: string;
  contactPerson?: string;
  mobile: string;
  creditLimitGoldGrams: number;
  outstandingGoldGrams: number;
  creditLimit: number;
  outstandingBalance: number;
  photoUrl?: string;
}

export const AdminWholesalePaymentPage: React.FC = () => {
  const { showToast } = useToast();
  const [customers, setCustomers] = useState<WholesaleCustomer[]>([]);
  const [activeRate24K, setActiveRate24K] = useState<number>(6830);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [selectedCustomer, setSelectedCustomer] = useState<WholesaleCustomer | null>(null);

  // Settlement Form State
  const [paymentType, setPaymentType] = useState<'GOLD' | 'CASH' | 'MIXED'>('MIXED');
  const [goldPurity, setGoldPurity] = useState<string>('22K');
  const [goldWeightGrams, setGoldWeightGrams] = useState<string>('70');
  const [cashAmount, setCashAmount] = useState<string>('20000');
  const [referenceNo, setReferenceNo] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [authorizeOverpayment, setAuthorizeOverpayment] = useState<boolean>(false);

  // Mobile Step Flow (1: Select Customer/Type, 2: Enter Amounts, 3: Review)
  const [mobileStep, setMobileStep] = useState<number>(1);

  // Status & Receipts
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [receiptData, setReceiptData] = useState<any | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState<boolean>(false);

  // Photo Lightbox State
  const [previewPhotoModal, setPreviewPhotoModal] = useState<{
    isOpen: boolean;
    photoUrl?: string;
    businessName?: string;
    contactPerson?: string;
    mobile?: string;
  }>({ isOpen: false });

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetchApi<{
          success: boolean;
          activeRate24K?: number;
          data: WholesaleCustomer[];
        }>('/wholesale/customers');
        if (res.success) {
          setCustomers(res.data || []);
          if (res.activeRate24K) setActiveRate24K(res.activeRate24K);
        }
      } catch (err: any) {
        showToast(err.message || 'Failed to load wholesale customer list.', 'error');
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    if (selectedCustomerId) {
      const found = customers.find((c) => c.id === selectedCustomerId) || null;
      setSelectedCustomer(found);
    } else {
      setSelectedCustomer(null);
    }
  }, [selectedCustomerId, customers]);

  // Settlement Calculations
  const weightNum = paymentType === 'CASH' ? 0 : parseFloat(goldWeightGrams) || 0;
  const cashNum = paymentType === 'GOLD' ? 0 : parseFloat(cashAmount) || 0;

  const settlement = calculateMixedSettlementFrontend({
    goldWeightGrams: weightNum,
    goldPurity: paymentType === 'CASH' ? '24K' : goldPurity,
    cashAmount: cashNum,
    rate24K: activeRate24K,
  });

  const currentOutstandingGold = selectedCustomer
    ? selectedCustomer.outstandingGoldGrams || (selectedCustomer.outstandingBalance / activeRate24K)
    : 0;

  const remainingOutstandingGold = roundGoldGrams(
    Math.max(0, currentOutstandingGold - settlement.totalEquivalent24KGrams),
    4
  );

  const isOverpayment = settlement.totalEquivalent24KGrams - currentOutstandingGold > 0.0001;

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) {
      showToast('Please select a wholesale customer.', 'error');
      return;
    }

    if (settlement.totalEquivalent24KGrams <= 0) {
      showToast('Please enter either gold weight or cash amount.', 'error');
      return;
    }

    if (isOverpayment && !authorizeOverpayment) {
      showToast('Payment exceeds outstanding balance. Check "Authorize Overpayment" to proceed.', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        customerId: selectedCustomer.id,
        paymentType,
        paymentMethod: paymentType === 'GOLD' ? 'GOLD' : 'CASH',
        goldPurity: paymentType === 'CASH' ? undefined : goldPurity,
        goldWeightGrams: paymentType === 'CASH' ? 0 : weightNum,
        cashAmount: paymentType === 'GOLD' ? 0 : cashNum,
        referenceNo: referenceNo || undefined,
        notes: notes || undefined,
        authorizeOverpayment,
      };

      const res = await fetchApi<{ success: boolean; data: any; settlement: any }>('/wholesale/payments', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res.success && res.data) {
        showToast('Wholesale payment recorded successfully.', 'success');

        setReceiptData({
          paymentNumber: res.data.paymentNumber,
          businessName: selectedCustomer.businessName,
          contactPerson: selectedCustomer.contactPerson,
          mobile: selectedCustomer.mobile,
          paymentType,
          goldPurity,
          goldWeightGrams: weightNum,
          goldEquivalent24KGrams: settlement.goldEquivalent24KGrams,
          cashAmount: cashNum,
          rate24K: activeRate24K,
          cashEquivalent24KGrams: settlement.cashEquivalent24KGrams,
          totalEquivalent24KGrams: settlement.totalEquivalent24KGrams,
          previousOutstandingGoldGrams: currentOutstandingGold,
          remainingOutstandingGoldGrams: Math.max(0, currentOutstandingGold - settlement.totalEquivalent24KGrams),
          referenceNo: res.data.referenceNo,
          recordedBy: res.data.recordedBy,
          paymentDate: res.data.paymentDate,
          notes: res.data.notes,
        });

        setShowReceiptModal(true);

        // Reset form
        setSelectedCustomerId('');
        setSelectedCustomer(null);
        setGoldWeightGrams('');
        setCashAmount('');
        setReferenceNo('');
        setNotes('');
        setAuthorizeOverpayment(false);
        setMobileStep(1);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to record wholesale payment.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-luxury-ivory min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-luxury-border pb-4">
        <div>
          <h1 className="font-serif text-xl sm:text-2xl text-luxury-charcoal font-bold flex items-center gap-3">
            <Coins className="w-6 h-6 sm:w-7 sm:h-7 text-luxury-gold" />
            SETTLE WHOLESALE OUTSTANDING ACCOUNT
          </h1>
          <p className="text-xs text-luxury-gray mt-1">
            Accept Gold, Cash, or Mixed Settlements in 24K Gold Equivalent • Benchmark Rate: <strong className="text-luxury-gold font-mono">{formatCurrency(activeRate24K)}/g</strong>
          </p>
        </div>
      </div>

      {/* Selected Customer Header Banner */}
      {selectedCustomer && (
        <div className="bg-luxury-charcoal text-luxury-ivory p-4 sm:p-6 rounded-2xl border border-luxury-gold/40 shadow-card flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            {selectedCustomer.photoUrl ? (
              <button
                type="button"
                onClick={() =>
                  setPreviewPhotoModal({
                    isOpen: true,
                    photoUrl: selectedCustomer.photoUrl,
                    businessName: selectedCustomer.businessName,
                    contactPerson: selectedCustomer.contactPerson,
                    mobile: selectedCustomer.mobile,
                  })
                }
                className="w-12 h-12 rounded-full border-2 border-luxury-gold overflow-hidden shrink-0 cursor-pointer"
              >
                <img src={selectedCustomer.photoUrl} alt="" className="w-full h-full object-cover" />
              </button>
            ) : (
              <div className="w-12 h-12 rounded-full bg-luxury-gold/20 border border-luxury-gold text-luxury-gold font-serif font-bold text-lg flex items-center justify-center shrink-0">
                {selectedCustomer.businessName.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <span className="text-[10px] text-luxury-gold font-bold uppercase tracking-widest block">RETAILER ACCOUNT</span>
              <h2 className="font-serif text-lg font-bold text-white">{selectedCustomer.businessName}</h2>
              <p className="text-xs text-luxury-ivory/70">{selectedCustomer.contactPerson ? `${selectedCustomer.contactPerson} • ` : ''}{selectedCustomer.mobile}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-white/10 p-3 rounded-xl border border-white/10 text-right">
              <span className="text-[10px] text-amber-400 font-bold uppercase block">CURRENT OUTSTANDING</span>
              <strong className="font-mono text-amber-300 text-sm block">{formatGoldGrams(currentOutstandingGold)} 24K</strong>
              <span className="text-[10px] text-luxury-ivory/60 block">Valuation: {formatCurrency(currentOutstandingGold * activeRate24K)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Settlement Workspace */}
      <form onSubmit={handleRecordPayment} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Input Form (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Step 1: Customer & Payment Method Selector */}
            <div className="bg-white border border-luxury-border rounded-2xl p-6 shadow-card space-y-4">
              <h3 className="font-serif text-base font-bold text-luxury-charcoal uppercase tracking-wider flex items-center justify-between border-b border-luxury-border pb-3">
                <span className="flex items-center gap-2">
                  <User className="w-4 h-4 text-luxury-gold" /> 1. Select Retailer & Settlement Method
                </span>
              </h3>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-luxury-charcoal font-bold mb-1">Retailer Business *</label>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    className="w-full bg-white border border-luxury-border rounded-xl px-4 py-3 text-luxury-charcoal font-medium focus:outline-none focus:border-luxury-gold shadow-sm"
                  >
                    <option value="">-- Select Wholesale Retailer Business --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.businessName} ({c.mobile}) - Dues: {formatGoldGrams(c.outstandingGoldGrams)} 24K
                      </option>
                    ))}
                  </select>
                </div>

                {/* Payment Method Selector (Part 8) */}
                <div>
                  <label className="block text-luxury-charcoal font-bold mb-2">Payment Settlement Method *</label>
                  <div className="grid grid-cols-3 gap-3">
                    {(['GOLD', 'CASH', 'MIXED'] as const).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setPaymentType(m)}
                        className={`p-3.5 rounded-xl border text-xs font-bold uppercase transition-all min-h-[48px] flex items-center justify-center gap-2 ${
                          paymentType === m
                            ? 'bg-luxury-gold text-white border-luxury-gold shadow-luxury'
                            : 'bg-luxury-ivory text-luxury-charcoal border-luxury-border hover:border-luxury-gold'
                        }`}
                      >
                        {m === 'GOLD' && <Coins className="w-4 h-4" />}
                        {m === 'CASH' && <DollarSign className="w-4 h-4" />}
                        {m === 'MIXED' && <Sparkles className="w-4 h-4" />}
                        {m === 'MIXED' ? 'GOLD + CASH' : m}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2: Gold & Cash Input Details */}
            <div className="bg-white border border-luxury-border rounded-2xl p-6 shadow-card space-y-5">
              <h3 className="font-serif text-base font-bold text-luxury-charcoal uppercase tracking-wider border-b border-luxury-border pb-3">
                2. Enter Settlement Amounts
              </h3>

              {/* Gold Payment Section (Parts 6 & 7) */}
              {(paymentType === 'GOLD' || paymentType === 'MIXED') && (
                <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-4 text-xs">
                  <div className="flex justify-between items-center border-b border-amber-200/80 pb-2">
                    <span className="font-bold text-amber-900 uppercase flex items-center gap-1.5">
                      <Coins className="w-4 h-4 text-luxury-gold" /> GOLD PAYMENT
                    </span>
                    <span className="text-[10px] text-amber-800 font-mono font-semibold">
                      Converted via Karat Factor (Weight × Karat / 24)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-amber-900 font-bold mb-1">Gold Purity Karat *</label>
                      <select
                        value={goldPurity}
                        onChange={(e) => setGoldPurity(e.target.value)}
                        className="w-full bg-white border border-amber-300 rounded-xl px-3 py-2.5 font-bold text-luxury-charcoal focus:outline-none focus:border-luxury-gold"
                      >
                        <option value="24K">24K Pure Gold (24/24 = 100% factor)</option>
                        <option value="22K">22K Gold (22/24 ≈ 91.67% factor)</option>
                        <option value="18K">18K Gold (18/24 = 75.00% factor)</option>
                        <option value="14K">14K Gold (14/24 ≈ 58.33% factor)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-amber-900 font-bold mb-1">Gold Weight Received (g) *</label>
                      <input
                        type="number"
                        step="0.0001"
                        min="0"
                        placeholder="70.0000"
                        value={goldWeightGrams}
                        onChange={(e) => setGoldWeightGrams(e.target.value)}
                        className="w-full bg-white border border-amber-300 rounded-xl px-3 py-2.5 font-mono text-luxury-charcoal font-bold focus:outline-none focus:border-luxury-gold"
                      />
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-amber-200 flex justify-between items-center text-xs">
                    <div>
                      <span className="text-[10px] text-luxury-gray uppercase font-bold block">Calculated 24K Equivalent</span>
                      <strong className="font-mono text-luxury-gold text-base">{formatGoldGrams(settlement.goldEquivalent24KGrams)} 24K</strong>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-luxury-gray uppercase font-bold block">Current Gold Value</span>
                      <strong className="font-mono text-amber-900 text-base">{formatCurrency(settlement.goldValueInr)}</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Cash Payment Section (Part 10) */}
              {(paymentType === 'CASH' || paymentType === 'MIXED') && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-4 text-xs">
                  <div className="flex justify-between items-center border-b border-slate-200/80 pb-2">
                    <span className="font-bold text-slate-900 uppercase flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-emerald-600" /> CASH / BANK PAYMENT
                    </span>
                    <span className="text-[10px] text-slate-600 font-mono font-semibold">
                      Converted via 24K Rate (Cash ÷ ₹{activeRate24K}/g)
                    </span>
                  </div>

                  <div>
                    <label className="block text-slate-800 font-bold mb-1">Cash / Bank Received (₹) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="20000.00"
                      value={cashAmount}
                      onChange={(e) => setCashAmount(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 font-mono text-slate-900 font-bold text-base focus:outline-none focus:border-luxury-gold"
                    />
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                    <div>
                      <span className="text-[10px] text-luxury-gray uppercase font-bold block">Equivalent Gold From Cash</span>
                      <strong className="font-mono text-slate-900 text-base">{formatGoldGrams(settlement.cashEquivalent24KGrams)} 24K</strong>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-luxury-gray uppercase font-bold block">Rate Applied</span>
                      <strong className="font-mono text-slate-900 text-base">{formatCurrency(activeRate24K)}/g</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Reference & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
                <div>
                  <label className="block text-luxury-gray font-semibold mb-1">Receipt / Transaction Ref #</label>
                  <input
                    type="text"
                    placeholder="e.g. REC-9842 / UTR-00492"
                    value={referenceNo}
                    onChange={(e) => setReferenceNo(e.target.value)}
                    className="w-full bg-white border border-luxury-border rounded-xl px-3 py-2.5 font-mono text-luxury-charcoal focus:outline-none focus:border-luxury-gold"
                  />
                </div>
                <div>
                  <label className="block text-luxury-gray font-semibold mb-1">Settlement Notes</label>
                  <input
                    type="text"
                    placeholder="e.g. Part gold 22K melting settlement + Cash token"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-white border border-luxury-border rounded-xl px-3 py-2.5 text-luxury-charcoal focus:outline-none focus:border-luxury-gold"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Dynamic Settlement Summary & Confirmation (5 cols - Part 9) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white border border-luxury-border rounded-2xl p-6 shadow-card space-y-5 sticky top-6">
              <h3 className="font-serif text-base font-bold text-luxury-charcoal uppercase tracking-wider flex items-center justify-between border-b border-luxury-border pb-3">
                <span className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-luxury-gold" /> Total Settlement Summary
                </span>
              </h3>

              {/* Summary Items */}
              <div className="space-y-3 text-xs">
                {(paymentType === 'GOLD' || paymentType === 'MIXED') && (
                  <div className="flex justify-between items-center text-luxury-gray">
                    <span>Gold Payment ({settlement.goldPurity} • {settlement.goldWeightGrams}g):</span>
                    <span className="font-mono font-bold text-luxury-charcoal">{formatGoldGrams(settlement.goldEquivalent24KGrams)} 24K</span>
                  </div>
                )}

                {(paymentType === 'CASH' || paymentType === 'MIXED') && (
                  <div className="flex justify-between items-center text-luxury-gray">
                    <span>Cash Payment ({formatCurrency(settlement.cashAmount)}):</span>
                    <span className="font-mono font-bold text-luxury-charcoal">{formatGoldGrams(settlement.cashEquivalent24KGrams)} 24K</span>
                  </div>
                )}

                <div className="p-4 bg-luxury-charcoal text-white rounded-2xl border border-luxury-gold/50 flex justify-between items-center">
                  <div>
                    <span className="text-[10px] text-luxury-gold uppercase font-bold tracking-wider block">
                      TOTAL CREDIT AGAINST BALANCE
                    </span>
                    <span className="text-xs text-luxury-ivory/80">24K Gold Equivalent</span>
                  </div>
                  <div className="font-serif text-2xl font-bold text-luxury-gold font-mono">
                    {formatGoldGrams(settlement.totalEquivalent24KGrams)}
                  </div>
                </div>

                {selectedCustomer && (
                  <div className="border-t border-luxury-border/60 pt-3 space-y-2">
                    <div className="flex justify-between text-luxury-gray">
                      <span>Previous Outstanding:</span>
                      <span className="font-mono font-semibold">{formatGoldGrams(currentOutstandingGold)} 24K</span>
                    </div>

                    <div className="flex justify-between font-bold text-sm text-luxury-charcoal pt-1 border-t border-luxury-border/40">
                      <span>REMAINING OUTSTANDING:</span>
                      <span className="font-serif text-lg text-luxury-gold font-mono">
                        {formatGoldGrams(remainingOutstandingGold)} 24K
                      </span>
                    </div>

                    <div className="flex justify-between text-[11px] text-luxury-gray">
                      <span>Remaining INR Value (@ {formatCurrency(activeRate24K)}/g):</span>
                      <span className="font-mono font-semibold">{formatCurrency(remainingOutstandingGold * activeRate24K)}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Overpayment Warning (Part 12) */}
              {isOverpayment && (
                <div className="p-3.5 bg-rose-50 border border-rose-300 text-rose-800 rounded-xl space-y-2 text-xs">
                  <div className="font-bold flex items-center gap-1.5 text-rose-700">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                    PAYMENT EXCEEDS OUTSTANDING
                  </div>
                  <p className="text-[11px] leading-tight">
                    Outstanding: <strong>{formatGoldGrams(currentOutstandingGold)} 24K</strong>. Settlement: <strong>{formatGoldGrams(settlement.totalEquivalent24KGrams)} 24K</strong>.
                  </p>

                  <label className="flex items-center gap-2 pt-1 cursor-pointer font-bold text-rose-900">
                    <input
                      type="checkbox"
                      checked={authorizeOverpayment}
                      onChange={(e) => setAuthorizeOverpayment(e.target.checked)}
                      className="w-4 h-4 text-rose-700 focus:ring-rose-600 rounded"
                    />
                    <span>AUTHORIZE OVERPAYMENT AS ADVANCE BALANCE</span>
                  </label>
                </div>
              )}

              {/* Record Payment Button */}
              <button
                type="submit"
                disabled={submitting || settlement.totalEquivalent24KGrams <= 0 || !selectedCustomer}
                className="w-full py-4 rounded-full bg-luxury-gold text-white font-semibold text-xs tracking-widest uppercase hover:bg-luxury-gold-dark transition-all flex items-center justify-center gap-2 shadow-luxury disabled:opacity-50 min-h-[48px]"
              >
                <CheckCircle2 className="w-4 h-4" /> {submitting ? 'Recording Settlement...' : 'Record Wholesale Payment'}
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Customer Photo Lightbox */}
      <CustomerPhotoPreview
        isOpen={previewPhotoModal.isOpen}
        onClose={() => setPreviewPhotoModal({ isOpen: false })}
        photoUrl={previewPhotoModal.photoUrl}
        businessName={previewPhotoModal.businessName}
        contactPerson={previewPhotoModal.contactPerson}
        mobile={previewPhotoModal.mobile}
      />

      {/* Printable Receipt Modal */}
      <WholesalePaymentReceiptModal
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
        receiptData={receiptData}
      />
    </div>
  );
};

export default AdminWholesalePaymentPage;
