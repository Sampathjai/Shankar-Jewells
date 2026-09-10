import React, { useState, useEffect } from 'react';
import { fetchApi } from '../../../api/client';
import {
  CreditCard,
  Plus,
  Search,
  Building2,
  CheckCircle2,
  DollarSign,
  Calendar,
  FileText,
} from 'lucide-react';

interface WholesaleCustomer {
  id: string;
  businessName: string;
  mobile: string;
  outstandingBalance: number;
}

interface PaymentRecord {
  id: string;
  paymentNumber: string;
  amount: number;
  paymentMethod: string;
  referenceNo?: string;
  paymentDate: string;
  customer?: WholesaleCustomer;
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
        setCustomers(res.data);
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

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId || !amount || parseFloat(amount) <= 0) {
      alert('Please select a customer and enter a valid positive payment amount.');
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

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId) || null;

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-luxury-gold/20 pb-4">
        <div>
          <h1 className="font-serif text-2xl text-luxury-gold font-bold flex items-center gap-3">
            <CreditCard className="w-7 h-7 text-luxury-gold" />
            Wholesale B2B Payment Collections
          </h1>
          <p className="text-xs text-luxury-ivory/60 mt-1">
            Record customer repayments (Bank Transfer, Cheque, UPI) and automatically clear outstanding balances
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-xl flex items-center gap-2 font-semibold">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {successMsg}
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Payment Entry Form (7 cols) */}
        <div className="lg:col-span-7 bg-luxury-charcoal/60 border border-luxury-gold/20 rounded-2xl p-6 shadow-2xl backdrop-blur-md space-y-4">
          <h3 className="font-serif text-sm font-bold text-luxury-gold uppercase tracking-wider flex items-center gap-2 border-b border-luxury-gold/20 pb-3">
            <DollarSign className="w-4 h-4" /> Record B2B Payment
          </h3>

          <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
            <div>
              <label className="block text-luxury-ivory/70 font-semibold mb-1">
                Select Wholesale Customer *
              </label>
              <select
                required
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full bg-luxury-charcoal border border-luxury-gold/30 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-luxury-gold"
              >
                <option value="">-- Choose Wholesale Business --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.businessName} ({c.mobile}) - Outstanding Dues: ₹{c.outstandingBalance.toLocaleString('en-IN')}
                  </option>
                ))}
              </select>
            </div>

            {selectedCustomer && (
              <div className="p-4 bg-white/5 rounded-xl border border-luxury-gold/20 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-luxury-ivory/50 uppercase font-semibold">Current Outstanding Balance</span>
                  <div className="text-lg font-serif font-bold text-amber-400">
                    ₹{selectedCustomer.outstandingBalance.toLocaleString('en-IN')}
                  </div>
                </div>
                {amount && (
                  <div className="text-right">
                    <span className="text-[10px] text-luxury-ivory/50 uppercase font-semibold">New Balance After Payment</span>
                    <div className="text-sm font-bold text-emerald-400">
                      ₹{Math.max(0, selectedCustomer.outstandingBalance - parseFloat(amount || '0')).toLocaleString('en-IN')}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="block text-luxury-ivory/70 font-semibold mb-1">
                Payment Amount (₹) *
              </label>
              <input
                type="number"
                required
                placeholder="e.g. 50000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-luxury-charcoal border border-luxury-gold/30 rounded-xl px-4 py-2.5 text-white text-base font-bold focus:outline-none focus:border-luxury-gold"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-luxury-ivory/70 font-semibold mb-1">
                  Payment Method *
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full bg-luxury-charcoal border border-luxury-gold/30 rounded-xl px-3 py-2 text-white"
                >
                  <option value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS/IMPS)</option>
                  <option value="CHEQUE">Cheque Clearance</option>
                  <option value="UPI">UPI / GPay / PhonePe</option>
                  <option value="CASH">Cash</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-luxury-ivory/70 font-semibold mb-1">
                  Reference No / Cheque No / UTR
                </label>
                <input
                  type="text"
                  placeholder="e.g. UTR123456789"
                  value={referenceNo}
                  onChange={(e) => setReferenceNo(e.target.value)}
                  className="w-full bg-luxury-charcoal border border-luxury-gold/30 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-luxury-ivory/70 font-semibold mb-1">Payment Notes</label>
              <textarea
                rows={2}
                placeholder="Optional payment remarks..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-luxury-charcoal border border-luxury-gold/30 rounded-xl px-3 py-2 text-white"
              />
            </div>

            <button
              type="submit"
              disabled={saving || !selectedCustomerId || !amount}
              className="w-full py-3 bg-luxury-gold hover:bg-luxury-goldHover text-luxury-charcoal font-bold rounded-xl shadow-luxury text-xs uppercase tracking-wider transition-all disabled:opacity-50"
            >
              {saving ? 'Recording Payment...' : 'Save & Post To Customer Ledger'}
            </button>
          </form>
        </div>

        {/* Customer Accounts Quick List (5 cols) */}
        <div className="lg:col-span-5 bg-luxury-charcoal/60 border border-luxury-gold/20 rounded-2xl p-6 shadow-2xl backdrop-blur-md space-y-4">
          <h3 className="font-serif text-sm font-bold text-luxury-gold uppercase tracking-wider flex items-center justify-between border-b border-luxury-gold/20 pb-3">
            <span>Outstanding Balances</span>
            <span className="text-xs text-luxury-ivory/60">{customers.length} Accounts</span>
          </h3>

          <div className="space-y-3 max-h-[400px] overflow-y-auto text-xs pr-1">
            {customers.map((c) => (
              <div
                key={c.id}
                onClick={() => setSelectedCustomerId(c.id)}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  selectedCustomerId === c.id
                    ? 'bg-luxury-gold/20 border-luxury-gold'
                    : 'bg-white/5 border-luxury-gold/10 hover:bg-white/10'
                }`}
              >
                <div>
                  <div className="font-semibold text-white">{c.businessName}</div>
                  <div className="text-[10px] text-luxury-ivory/50">Mobile: {c.mobile}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-amber-400">
                    ₹{c.outstandingBalance.toLocaleString('en-IN')}
                  </div>
                  <span className="text-[9px] text-luxury-ivory/40">Outstanding</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminWholesalePaymentsPage;
