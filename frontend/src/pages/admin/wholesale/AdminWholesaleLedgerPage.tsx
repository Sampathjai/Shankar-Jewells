import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchApi } from '../../../api/client';
import { CustomerPhotoPreview } from '../../../components/common/CustomerPhotoPreview';
import { formatCurrency } from '../../../utils/formatters';
import { formatGoldGrams, roundGoldGrams, roundCurrency } from '../../../utils/goldEquivalent';
import {
  FileSpreadsheet,
  Printer,
  Building2,
  Phone,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  Coins,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';

interface Customer {
  id: string;
  businessName: string;
  contactPerson?: string;
  mobile: string;
  gstRegistered?: boolean;
  gstin?: string;
  creditLimit: number;
  outstandingBalance: number;
  creditLimitGoldGrams: number;
  outstandingGoldGrams: number;
  paymentTerms: string;
  photoUrl?: string;
}

interface LedgerEntry {
  id: string;
  transactionType: string;
  debit: number;
  credit: number;
  balance: number;
  debitGoldGrams?: number;
  creditGoldGrams?: number;
  balanceGoldGrams?: number;
  rate24K?: number;
  goldPurity?: string;
  goldWeightGrams?: number;
  cashAmount?: number;
  recordedBy?: string;
  notes?: string;
  createdAt: string;
}

export const AdminWholesaleLedgerPage: React.FC = () => {
  const { customerId } = useParams<{ customerId: string }>();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [ledgers, setLedgers] = useState<LedgerEntry[]>([]);
  const [activeRate24K, setActiveRate24K] = useState<number>(6830);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  // Photo Lightbox State
  const [previewPhotoModal, setPreviewPhotoModal] = useState<{
    isOpen: boolean;
    photoUrl?: string;
    businessName?: string;
    contactPerson?: string;
    mobile?: string;
  }>({ isOpen: false });

  useEffect(() => {
    async function loadLedger() {
      if (!customerId) return;
      try {
        setLoading(true);
        setError('');
        const res = await fetchApi<{
          success: boolean;
          activeRate24K?: number;
          data: { customer: Customer; ledgers: LedgerEntry[] };
        }>(`/wholesale/ledger/${customerId}`);

        if (res.success) {
          setCustomer(res.data.customer);
          setLedgers(res.data.ledgers);
          if (res.activeRate24K) setActiveRate24K(res.activeRate24K);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load customer statement ledger.');
      } finally {
        setLoading(false);
      }
    }
    loadLedger();
  }, [customerId]);

  const outstandingGrams = customer ? roundGoldGrams(customer.outstandingGoldGrams || 0, 4) : 0;
  const limitGrams = customer ? roundGoldGrams(customer.creditLimitGoldGrams || 0, 4) : 0;
  const currentInrValuation = roundCurrency(outstandingGrams * activeRate24K);

  return (
    <div className="p-8 space-y-6 bg-luxury-ivory min-h-screen max-w-6xl mx-auto">
      {/* Back Button & Actions */}
      <div className="flex items-center justify-between border-b border-luxury-border pb-4 no-print">
        <Link
          to="/admin/wholesale/customers"
          className="flex items-center gap-2 text-xs font-bold text-luxury-gold hover:underline"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Wholesale Customers
        </Link>

        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 px-5 py-2.5 bg-luxury-gold hover:bg-luxury-gold/90 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-md transition-all"
        >
          <Printer className="w-4 h-4" /> Print Customer Statement
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-xs text-luxury-gray">
          Loading customer 24K gold ledger statement...
        </div>
      ) : error ? (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          {error}
        </div>
      ) : customer ? (
        <div className="bg-white border border-luxury-border p-8 rounded-2xl shadow-card space-y-6 text-xs text-luxury-charcoal printable-area">
          {/* Statement Header */}
          <div className="flex justify-between items-start border-b border-luxury-border pb-6">
            <div>
              <h1 className="font-serif text-2xl font-bold tracking-wider text-luxury-charcoal">SHANKER JEWELLS</h1>
              <p className="text-[10px] text-luxury-gray uppercase tracking-widest font-semibold mt-0.5">
                WHOLESALE CUSTOMER LEDGER STATEMENT • TRICHY
              </p>
              <p className="text-[11px] text-luxury-gray mt-1">
                No. 4, Sandhukadai, Big Bazzar Street, Trichy - 620008 | Phone: +91 944394912
              </p>
            </div>
            <div className="text-right space-y-1">
              <span className="inline-block text-[10px] font-bold uppercase tracking-widest text-luxury-gold bg-luxury-gold/10 px-3 py-1 rounded border border-luxury-gold/20">
                Official Gold Credit Statement
              </span>
              <div className="text-luxury-gray text-[11px]">Statement Date: {new Date().toLocaleDateString('en-IN')}</div>
              <div className="text-[10px] text-luxury-gold font-bold">LIVE 24K RATE: ₹{activeRate24K.toLocaleString('en-IN')}/g</div>
            </div>
          </div>

          {/* Account Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-luxury-ivory/60 p-5 rounded-xl border border-luxury-border items-center">
            <div className="flex items-center gap-3">
              {customer.photoUrl ? (
                <button
                  type="button"
                  onClick={() =>
                    setPreviewPhotoModal({
                      isOpen: true,
                      photoUrl: customer.photoUrl,
                      businessName: customer.businessName,
                      contactPerson: customer.contactPerson,
                      mobile: customer.mobile,
                    })
                  }
                  className="w-12 h-12 rounded-full border border-luxury-border overflow-hidden shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                  title="Click to preview customer photo"
                >
                  <img src={customer.photoUrl} alt="" className="w-full h-full object-cover" />
                </button>
              ) : (
                <div className="w-12 h-12 rounded-full bg-luxury-gold/10 border border-luxury-gold/30 flex items-center justify-center text-luxury-gold font-bold text-base">
                  {customer.businessName.charAt(0)}
                </div>
              )}
              <div>
                <span className="text-[10px] uppercase font-bold text-luxury-gray">Retailer Account Name</span>
                <div className="font-bold text-sm text-luxury-charcoal mt-0.5">{customer.businessName}</div>
                <div className="text-[11px] text-luxury-gray">Contact: {customer.contactPerson || 'N/A'} ({customer.mobile})</div>
                <div className="text-[10px] text-luxury-gray">
                  GST: {customer.gstRegistered || customer.gstin ? (
                    <span className="font-bold font-mono text-emerald-700">{customer.gstin || 'Registered'}</span>
                  ) : (
                    <span className="text-slate-500 font-medium">Not Registered (Optional)</span>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-luxury-gray">Approved Gold Credit Limit</span>
              <div className="font-serif font-bold text-base text-luxury-charcoal">
                {formatGoldGrams(limitGrams)} <span className="text-xs font-sans text-luxury-gold font-bold">24K</span>
              </div>
              <div className="text-[11px] text-luxury-gray">
                INR Equivalent: {formatCurrency(limitGrams * activeRate24K)}
              </div>
              <div className="text-[10px] text-luxury-gray">Payment Terms: {customer.paymentTerms}</div>
            </div>

            <div className="text-right space-y-1">
              <span className="text-[10px] uppercase font-bold text-luxury-gray">Current Net Gold Dues</span>
              <div className="font-serif text-xl font-bold text-amber-800">
                {formatGoldGrams(outstandingGrams)} <span className="text-xs font-sans text-luxury-gold font-bold">24K</span>
              </div>
              <div className="text-[11px] text-emerald-700 font-bold">
                Current Valuation: {formatCurrency(currentInrValuation)}
              </div>
              <div className="text-[10px] font-bold text-emerald-700">Account Active</div>
            </div>
          </div>

          {/* Ledger Transactions Table */}
          <div className="space-y-3">
            <h3 className="font-serif text-sm font-bold text-luxury-charcoal uppercase tracking-wider flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-luxury-gold" /> Gold-Equivalent Ledger Register (24K Grams)
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-luxury-border text-luxury-gray uppercase text-[10px] font-bold text-left bg-luxury-ivory/50">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Transaction Details & Particulars</th>
                    <th className="py-2.5 px-3 text-center">Type</th>
                    <th className="py-2.5 px-3 text-right">Debit (24K g)</th>
                    <th className="py-2.5 px-3 text-right">Credit (24K g)</th>
                    <th className="py-2.5 px-3 text-right">Balance (24K g)</th>
                    <th className="py-2.5 px-3 text-right">INR Valuation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-luxury-border/60 text-xs">
                  {ledgers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-luxury-gray">
                        No ledger transactions recorded yet for this customer.
                      </td>
                    </tr>
                  ) : (
                    ledgers.map((l) => {
                      const debitGrams = l.debitGoldGrams !== undefined && l.debitGoldGrams !== null && l.debitGoldGrams > 0
                        ? l.debitGoldGrams
                        : (l.debit && l.rate24K ? l.debit / l.rate24K : 0);

                      const creditGrams = l.creditGoldGrams !== undefined && l.creditGoldGrams !== null && l.creditGoldGrams > 0
                        ? l.creditGoldGrams
                        : (l.credit && l.rate24K ? l.credit / l.rate24K : 0);

                      const balanceGrams = l.balanceGoldGrams !== undefined && l.balanceGoldGrams !== null
                        ? l.balanceGoldGrams
                        : (l.balance && l.rate24K ? l.balance / l.rate24K : 0);

                      const rate = l.rate24K || activeRate24K;
                      const rowValuation = balanceGrams * rate;

                      return (
                        <tr key={l.id} className="hover:bg-luxury-ivory/30 transition-all">
                          <td className="py-2.5 px-3 font-mono text-luxury-gray">
                            {new Date(l.createdAt).toLocaleDateString('en-IN')}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-semibold text-luxury-charcoal">{l.notes || l.transactionType}</div>
                            {l.recordedBy && (
                              <div className="text-[10px] text-luxury-gray">Recorded by: {l.recordedBy}</div>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                                l.transactionType === 'INVOICE' || l.debit > 0
                                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              }`}
                            >
                              {l.transactionType}
                            </span>
                          </td>

                          <td className="py-2.5 px-3 text-right font-mono font-semibold text-amber-800">
                            {debitGrams > 0 ? formatGoldGrams(debitGrams) : '-'}
                          </td>

                          <td className="py-2.5 px-3 text-right font-mono font-semibold text-emerald-700">
                            {creditGrams > 0 ? formatGoldGrams(creditGrams) : '-'}
                          </td>

                          <td className="py-2.5 px-3 text-right font-mono font-bold text-luxury-charcoal text-sm">
                            {formatGoldGrams(balanceGrams)}
                          </td>

                          <td className="py-2.5 px-3 text-right font-mono font-semibold text-emerald-700">
                            {formatCurrency(rowValuation)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Statement Footer */}
          <div className="pt-8 border-t border-luxury-border flex justify-between items-end text-[10px] text-luxury-gray">
            <div>
              * Computer generated B2B Gold-Equivalent ledger statement. Quantities expressed in 24K Fine Gold Grams. Issued by Shanker Jewells Accounts Team, Trichy.
            </div>
            <div className="text-center w-48 border-t border-luxury-border pt-2 font-bold text-luxury-charcoal">
              Authorized Accounts Signature
            </div>
          </div>
        </div>
      ) : null}

      {/* Photo Lightbox */}
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

export default AdminWholesaleLedgerPage;
