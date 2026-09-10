import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchApi } from '../../../api/client';
import { useToast } from '../../../components/common/Toast';
import { CustomerPhotoPreview } from '../../../components/common/CustomerPhotoPreview';
import { WholesalePaymentReceiptModal } from '../../../components/wholesale/WholesalePaymentReceiptModal';
import { formatCurrency } from '../../../utils/formatters';
import { formatGoldGrams, roundGoldGrams, roundCurrency } from '../../../utils/goldEquivalent';
import {
  CreditCard,
  Building2,
  CheckCircle2,
  AlertCircle,
  Plus,
  Search,
  Printer,
  Coins,
  DollarSign,
  Layers,
  Sparkles,
  User,
  Calendar,
  Eye,
  FileSpreadsheet,
} from 'lucide-react';

interface CustomerInfo {
  id: string;
  businessName: string;
  contactPerson?: string;
  mobile: string;
  photoUrl?: string;
}

interface PaymentRecord {
  id: string;
  paymentNumber: string;
  customerId: string;
  customer?: CustomerInfo;
  paymentType: 'GOLD' | 'CASH' | 'MIXED' | string;
  paymentMethod: string;
  rate24K: number;
  goldPurity?: string;
  goldWeightGrams: number;
  goldEquivalent24KGrams: number;
  cashAmount: number;
  cashEquivalent24KGrams: number;
  totalEquivalent24KGrams: number;
  amount: number;
  referenceNo?: string;
  paymentDate: string;
  createdAt: string;
  recordedBy?: string;
  notes?: string;
}

export const AdminWholesalePaymentsPage: React.FC = () => {
  const { showToast } = useToast();
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [activeRate24K, setActiveRate24K] = useState<number>(6830);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('ALL');

  // Receipt Modal State
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState<boolean>(false);

  // Photo Lightbox State
  const [previewPhotoModal, setPreviewPhotoModal] = useState<{
    isOpen: boolean;
    photoUrl?: string;
    businessName?: string;
    contactPerson?: string;
    mobile?: string;
  }>({ isOpen: false });

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetchApi<{
        success: boolean;
        activeRate24K?: number;
        data: PaymentRecord[];
      }>('/wholesale/payments');

      if (res.success) {
        setPayments(res.data || []);
        if (res.activeRate24K) setActiveRate24K(res.activeRate24K);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load wholesale payments.');
      showToast(err.message || 'Failed to load wholesale payments.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const filteredPayments = payments.filter((p) => {
    const custName = p.customer?.businessName?.toLowerCase() || '';
    const mobile = p.customer?.mobile || '';
    const pNo = p.paymentNumber?.toLowerCase() || '';
    const matchesSearch =
      custName.includes(searchTerm.toLowerCase()) ||
      mobile.includes(searchTerm) ||
      pNo.includes(searchTerm.toLowerCase());

    const matchesType = filterType === 'ALL' || p.paymentType === filterType;
    return matchesSearch && matchesType;
  });

  const totalSettled24KGrams = roundGoldGrams(
    filteredPayments.reduce((acc, p) => acc + (p.totalEquivalent24KGrams || 0), 0),
    4
  );

  const totalCashAmount = roundCurrency(
    filteredPayments.reduce((acc, p) => acc + (p.cashAmount || p.amount || 0), 0)
  );

  const openReceipt = (payment: PaymentRecord) => {
    setSelectedPayment(payment);
    setShowReceiptModal(true);
  };

  return (
    <div className="p-8 space-y-6 bg-luxury-ivory min-h-screen max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-luxury-border pb-4">
        <div>
          <h1 className="font-serif text-2xl text-luxury-charcoal font-bold flex items-center gap-3">
            <CreditCard className="w-7 h-7 text-luxury-gold" />
            Wholesale Settlement & Payment Vouchers
          </h1>
          <p className="text-xs text-luxury-gray mt-1">
            Gold-Equivalent settlement records (Gold bullion/ornaments, Cash & Mixed payments) for registered retailers.
          </p>
        </div>

        <Link
          to="/admin/wholesale/payment"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-luxury-gold hover:bg-luxury-gold/90 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition-all shrink-0"
        >
          <Plus className="w-4 h-4" /> Record Wholesale Payment
        </Link>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          {error}
        </div>
      )}

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-luxury-border rounded-2xl p-5 shadow-card space-y-2">
          <div className="flex justify-between items-center text-luxury-gray text-[10px] uppercase font-bold tracking-wider">
            <span>Total 24K Settlement Received</span>
            <Sparkles className="w-4 h-4 text-luxury-gold" />
          </div>
          <div className="text-2xl font-serif font-bold text-luxury-charcoal">
            {formatGoldGrams(totalSettled24KGrams)} <span className="text-sm font-sans font-semibold text-luxury-gold">24K</span>
          </div>
          <div className="text-[11px] text-emerald-700 font-medium">
            ≈ {formatCurrency(totalSettled24KGrams * activeRate24K)} @ ₹{activeRate24K}/g
          </div>
        </div>

        <div className="bg-white border border-luxury-border rounded-2xl p-5 shadow-card space-y-2">
          <div className="flex justify-between items-center text-luxury-gray text-[10px] uppercase font-bold tracking-wider">
            <span>Cash Component Received</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-serif font-bold text-emerald-700">
            {formatCurrency(totalCashAmount)}
          </div>
          <div className="text-[11px] text-luxury-gray">
            Converted to 24K Gold at transaction-time metal rates
          </div>
        </div>

        <div className="bg-white border border-luxury-border rounded-2xl p-5 shadow-card space-y-2">
          <div className="flex justify-between items-center text-luxury-gray text-[10px] uppercase font-bold tracking-wider">
            <span>Total Vouchers Issued</span>
            <Coins className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-serif font-bold text-luxury-charcoal">
            {filteredPayments.length} <span className="text-xs font-sans text-luxury-gray font-normal">vouchers</span>
          </div>
          <div className="text-[11px] text-luxury-gray">
            Showing filtered voucher records
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-luxury-border rounded-2xl p-4 shadow-card flex flex-col md:flex-row gap-4 justify-between items-center text-xs">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-luxury-gray absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by customer name, mobile or voucher #..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-luxury-ivory/50 border border-luxury-border rounded-xl pl-9 pr-4 py-2.5 text-luxury-charcoal focus:outline-none focus:border-luxury-gold"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-luxury-gray font-bold text-[11px] uppercase tracking-wider shrink-0">Filter:</span>
          <div className="flex gap-1.5 overflow-x-auto w-full md:w-auto">
            {['ALL', 'GOLD', 'CASH', 'MIXED'].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                  filterType === type
                    ? 'bg-luxury-gold text-white shadow-sm'
                    : 'bg-luxury-ivory/80 text-luxury-gray hover:bg-luxury-border/40'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Payment Voucher Table */}
      <div className="bg-white border border-luxury-border rounded-2xl p-6 shadow-card space-y-4">
        <h3 className="font-serif text-base font-bold text-luxury-charcoal uppercase tracking-wider flex items-center gap-2 border-b border-luxury-border pb-3">
          <FileSpreadsheet className="w-4 h-4 text-luxury-gold" /> Payment History Register
        </h3>

        {loading ? (
          <div className="text-center py-12 text-xs text-luxury-gray">
            Loading wholesale settlement vouchers...
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="text-center py-12 text-xs text-luxury-gray">
            No payment vouchers match your search criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="border-b border-luxury-border text-luxury-gray uppercase text-[10px] font-bold text-left bg-luxury-ivory/50">
                  <th className="py-3 px-3">Date & Voucher</th>
                  <th className="py-3 px-3">Wholesale Retailer</th>
                  <th className="py-3 px-3 text-center">Settlement Type</th>
                  <th className="py-3 px-3 text-right">Gold Component</th>
                  <th className="py-3 px-3 text-right">Cash Component</th>
                  <th className="py-3 px-3 text-right">24K Equivalent</th>
                  <th className="py-3 px-3 text-right">Current Valuation</th>
                  <th className="py-3 px-3 text-center">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-luxury-border/60">
                {filteredPayments.map((p) => {
                  const pType = (p.paymentType || 'CASH').toUpperCase();
                  const rate = p.rate24K || activeRate24K;
                  const totalGrams = p.totalEquivalent24KGrams || 0;
                  const inrValue = totalGrams * activeRate24K;

                  return (
                    <tr key={p.id} className="hover:bg-luxury-ivory/40 transition-all">
                      <td className="py-3 px-3">
                        <div className="font-mono font-bold text-luxury-charcoal">{p.paymentNumber}</div>
                        <div className="text-[10px] text-luxury-gray flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3 text-luxury-gold" />
                          {new Date(p.paymentDate || p.createdAt).toLocaleDateString('en-IN')}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          {p.customer?.photoUrl ? (
                            <button
                              type="button"
                              onClick={() =>
                                setPreviewPhotoModal({
                                  isOpen: true,
                                  photoUrl: p.customer?.photoUrl,
                                  businessName: p.customer?.businessName,
                                  contactPerson: p.customer?.contactPerson,
                                  mobile: p.customer?.mobile,
                                })
                              }
                              className="w-8 h-8 rounded-full border border-luxury-border overflow-hidden shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                              title="Click to preview customer photo"
                            >
                              <img src={p.customer.photoUrl} alt="" className="w-full h-full object-cover" />
                            </button>
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-luxury-ivory border border-luxury-border flex items-center justify-center text-luxury-gold text-xs font-bold">
                              {p.customer?.businessName?.charAt(0) || 'C'}
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-luxury-charcoal">{p.customer?.businessName || 'Wholesale Account'}</div>
                            <div className="text-[10px] text-luxury-gray">{p.customer?.mobile}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            pType === 'GOLD'
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : pType === 'CASH'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-purple-100 text-purple-800 border border-purple-300'
                          }`}
                        >
                          {pType === 'GOLD' && <Coins className="w-3 h-3" />}
                          {pType === 'CASH' && <DollarSign className="w-3 h-3" />}
                          {pType === 'MIXED' && <Layers className="w-3 h-3" />}
                          {pType}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right font-mono">
                        {p.goldWeightGrams > 0 ? (
                          <div>
                            <div className="font-bold text-amber-800">{formatGoldGrams(p.goldWeightGrams)}</div>
                            <div className="text-[10px] text-luxury-gray">@ {p.goldPurity || '22K'} ({formatGoldGrams(p.goldEquivalent24KGrams)} 24K)</div>
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-right font-mono">
                        {p.cashAmount > 0 || p.amount > 0 ? (
                          <div>
                            <div className="font-bold text-emerald-700">{formatCurrency(p.cashAmount || p.amount)}</div>
                            <div className="text-[10px] text-luxury-gray">({formatGoldGrams(p.cashEquivalent24KGrams)} 24K)</div>
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-right font-mono">
                        <div className="font-bold text-luxury-charcoal text-sm">{formatGoldGrams(totalGrams)}</div>
                        <div className="text-[10px] text-luxury-gold font-bold">24K EQUIVALENT</div>
                      </td>

                      <td className="py-3 px-3 text-right font-mono">
                        <div className="font-bold text-emerald-700">{formatCurrency(inrValue)}</div>
                        <div className="text-[10px] text-luxury-gray">@ ₹{activeRate24K}/g</div>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => openReceipt(p)}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-luxury-ivory hover:bg-luxury-gold hover:text-white border border-luxury-border text-luxury-charcoal rounded-lg font-bold transition-all shadow-sm"
                        >
                          <Printer className="w-3.5 h-3.5" /> Voucher
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment Receipt Modal */}
      {selectedPayment && (
        <WholesalePaymentReceiptModal
          isOpen={showReceiptModal}
          onClose={() => {
            setShowReceiptModal(false);
            setSelectedPayment(null);
          }}
          receiptData={{
            paymentNumber: selectedPayment.paymentNumber,
            paymentDate: selectedPayment.paymentDate || selectedPayment.createdAt,
            customerName: selectedPayment.customer?.businessName || 'Retail Customer',
            contactPerson: selectedPayment.customer?.contactPerson,
            mobile: selectedPayment.customer?.mobile,
            paymentType: selectedPayment.paymentType,
            paymentMethod: selectedPayment.paymentMethod,
            referenceNo: selectedPayment.referenceNo,
            rate24K: selectedPayment.rate24K || activeRate24K,
            goldPurity: selectedPayment.goldPurity,
            goldWeightGrams: selectedPayment.goldWeightGrams,
            goldEquivalent24KGrams: selectedPayment.goldEquivalent24KGrams,
            cashAmount: selectedPayment.cashAmount || selectedPayment.amount,
            cashEquivalent24KGrams: selectedPayment.cashEquivalent24KGrams,
            totalEquivalent24KGrams: selectedPayment.totalEquivalent24KGrams,
            notes: selectedPayment.notes,
            recordedBy: selectedPayment.recordedBy || 'Staff',
          }}
        />
      )}

      {/* Customer Photo Lightbox */}
      <CustomerPhotoPreview
        isOpen={previewPhotoModal.isOpen}
        onClose={() => setPreviewPhotoModal({ ...previewPhotoModal, isOpen: false })}
        photoUrl={previewPhotoModal.photoUrl}
        businessName={previewPhotoModal.businessName}
        contactPerson={previewPhotoModal.contactPerson}
        mobile={previewPhotoModal.mobile}
      />
    </div>
  );
};

export default AdminWholesalePaymentsPage;
