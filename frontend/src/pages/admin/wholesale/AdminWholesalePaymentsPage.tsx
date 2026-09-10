import React, { useState, useEffect } from 'react';
import { fetchApi } from '../../../api/client';
import { useToast } from '../../../components/common/Toast';
import {
  CreditCard,
  Building2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface WholesaleCustomer {
  id: string;
  businessName: string;
  mobile: string;
  outstandingBalance: number;
}

export const AdminWholesalePaymentsPage: React.FC = () => {
  const [customers, setCustomers] = useState<WholesaleCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Payment Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER');
  const [referenceNo, setReferenceNo] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetchApi<{ success: boolean; data: WholesaleCustomer[] }>('/wholesale/customers');
      if (res.success) {
        setCustomers(res.data || []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load wholesale customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const { showToast } = useToast();

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId || !amount || parseFloat(amount) <= 0) {
      showToast('Please select a customer and enter a valid positive payment amount.', 'error');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccessMsg('');

      const res = await fetchApi<{ success: boolean; message: string }>('/wholesale/payments', {
        method: 'POST',
        body: JSON.stringify({
          customerId: selectedCustomerId,
          amount: parseFloat(amount),
          paymentMethod,
          referenceNo,
          notes,
        }),
      });

      if (res.success) {
        setSuccessMsg(res.message || 'Payment recorded successfully!');
        setAmount('');
        setReferenceNo('');
        setNotes('');
        fetchCustomers();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to record payment');
    } finally {
      setSaving(false);
    }
  };

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  return (
    <div className="p-8 space-y-6 bg-luxury-ivory min-h-screen max-w-4xl mx-auto">
      {/* Header */}
      <div className="border-b border-luxury-border pb-4">
        <h1 className="font-serif text-2xl text-luxury-charcoal font-bold flex items-center gap-3">
          <CreditCard className="w-7 h-7 text-luxury-gold" />
          Record B2B Wholesale Payment Receipt
        </h1>
        <p className="text-xs text-luxury-gray mt-1">
          Receive credit settlements, bank transfers, cheques, or cash payments from registered wholesale retailers.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          {error}
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          {successMsg}
        </div>
      )}

      {/* Payment Entry Form Card */}
      <div className="bg-white border border-luxury-border rounded-2xl p-6 shadow-card space-y-6">
        <h3 className="font-serif text-base font-bold text-luxury-charcoal uppercase tracking-wider flex items-center gap-2 border-b border-luxury-border pb-3">
          <Building2 className="w-4 h-4 text-luxury-gold" /> Payment Voucher Details
        </h3>

        <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
          <div>
            <label className="block text-luxury-charcoal font-bold mb-1">Select Retailer Customer *</label>
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              required
              className="w-full bg-white border border-luxury-border rounded-xl px-4 py-3 text-luxury-charcoal font-medium focus:outline-none focus:border-luxury-gold shadow-sm"
            >
              <option value="">-- Choose Retailer Account --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.businessName} ({c.mobile}) - Outstanding Dues: ₹{c.outstandingBalance.toLocaleString('en-IN')}
                </option>
              ))}
            </select>
          </div>

          {selectedCustomer && (
            <div className="p-4 bg-luxury-ivory/60 rounded-xl border border-luxury-border flex justify-between items-center">
              <div>
                <span className="text-[10px] uppercase font-bold text-luxury-gray">Current Account Outstanding</span>
                <div className="text-xl font-serif font-bold text-amber-700 mt-0.5">
                  ₹{selectedCustomer.outstandingBalance.toLocaleString('en-IN')}
                </div>
              </div>
              <span className="text-xs bg-amber-50 text-amber-700 px-3 py-1 rounded-full font-bold border border-amber-200">
                Credit Account Active
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-luxury-charcoal font-bold mb-1">Payment Amount (₹) *</label>
              <input
                type="number"
                required
                min="1"
                step="any"
                placeholder="50000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-white border border-luxury-border rounded-xl px-3 py-2.5 font-mono text-sm font-bold text-emerald-700 focus:outline-none focus:border-luxury-gold shadow-sm"
              />
            </div>

            <div>
              <label className="block text-luxury-charcoal font-bold mb-1">Payment Method *</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full bg-white border border-luxury-border rounded-xl px-3 py-2.5 text-luxury-charcoal font-medium focus:outline-none focus:border-luxury-gold shadow-sm"
              >
                <option value="BANK_TRANSFER">Bank Transfer (NEFT / RTGS / IMPS)</option>
                <option value="CHEQUE">Cheque / Demand Draft</option>
                <option value="UPI">UPI / GPay / PhonePe</option>
                <option value="CASH">Cash Deposit</option>
              </select>
            </div>

            <div>
              <label className="block text-luxury-gray font-semibold mb-1">Bank Ref No. / UTR / Cheque No.</label>
              <input
                type="text"
                placeholder="UTR123456789"
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
                className="w-full bg-white border border-luxury-border rounded-xl px-3 py-2.5 font-mono text-luxury-charcoal focus:outline-none focus:border-luxury-gold shadow-sm"
              />
            </div>

            <div>
              <label className="block text-luxury-gray font-semibold mb-1">Staff Notes / Payment Remarks</label>
              <input
                type="text"
                placeholder="e.g. Received partial settlement against Invoice #INV-2026-0001"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-white border border-luxury-border rounded-xl px-3 py-2.5 text-luxury-charcoal focus:outline-none focus:border-luxury-gold shadow-sm"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-luxury-border flex justify-end">
            <button
              type="submit"
              disabled={saving || !selectedCustomerId || !amount}
              className="px-6 py-3 bg-luxury-gold hover:bg-luxury-gold/90 text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-sm transition-all disabled:opacity-50 flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" /> {saving ? 'Recording Voucher...' : 'Record Payment Receipt'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminWholesalePaymentsPage;
