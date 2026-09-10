import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchApi } from '../../../api/client';
import {
  FileSpreadsheet,
  Printer,
  Building2,
  Phone,
  ArrowLeft,
  DollarSign,
  CheckCircle2,
} from 'lucide-react';

interface Customer {
  id: string;
  businessName: string;
  contactPerson?: string;
  mobile: string;
  gstin?: string;
  creditLimit: number;
  outstandingBalance: number;
  paymentTerms: string;
}

interface LedgerEntry {
  id: string;
  transactionType: string;
  debit: number;
  credit: number;
  balance: number;
  notes?: string;
  createdAt: string;
}

export const AdminWholesaleLedgerPage: React.FC = () => {
  const { customerId } = useParams<{ customerId: string }>();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [ledgers, setLedgers] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadLedger() {
      if (!customerId) return;
      try {
        setLoading(true);
        setError('');
        const res = await fetchApi<{
          success: boolean;
          data: { customer: Customer; ledgers: LedgerEntry[] };
        }>(`/wholesale/ledger/${customerId}`);

        if (res.success) {
          setCustomer(res.data.customer);
          setLedgers(res.data.ledgers);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load customer statement ledger.');
      } finally {
        setLoading(false);
      }
    }
    loadLedger();
  }, [customerId]);

  return (
    <div className="p-8 space-y-6">
      {/* Back Button & Actions */}
      <div className="flex items-center justify-between border-b border-luxury-gold/20 pb-4">
        <Link
          to="/admin/wholesale/customers"
          className="flex items-center gap-2 text-xs font-semibold text-luxury-gold hover:underline"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Wholesale Customers
        </Link>

        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 px-4 py-2 bg-luxury-gold text-luxury-charcoal rounded-xl text-xs font-bold shadow-luxury"
        >
          <Printer className="w-4 h-4" /> Print Customer Statement
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-xs text-luxury-ivory/60">
          Loading customer ledger statement...
        </div>
      ) : error ? (
        <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl">
          {error}
        </div>
      ) : customer ? (
        <div className="space-y-6 bg-white text-black p-8 rounded-2xl shadow-2xl print:p-0 border border-gray-200">
          {/* Statement Header */}
          <div className="flex justify-between items-start border-b-2 border-amber-600 pb-4">
            <div>
              <h1 className="font-serif text-2xl font-bold text-amber-900">SHANKER JEWELLS</h1>
              <p className="text-[10px] text-gray-600 uppercase tracking-widest font-semibold">
                WHOLESALE CUSTOMER LEDGER STATEMENT • TRICHY
              </p>
              <p className="text-[10px] text-gray-500 mt-1">
                No.4 Sandhukadai, Bigbazzar Street, Trichy - 620008 | Phone: +91 9443949192
              </p>
            </div>
            <div className="text-right">
              <span className="px-3 py-1 bg-amber-100 text-amber-900 font-bold text-xs rounded uppercase tracking-wider">
                STATEMENT OF ACCOUNT
              </span>
              <div className="text-[10px] text-gray-500 mt-2">
                As of: {new Date().toLocaleDateString('en-IN')}
              </div>
            </div>
          </div>

          {/* Account Overview Card */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200 text-xs">
            <div>
              <span className="text-[10px] text-gray-500 font-bold uppercase">Business Name</span>
              <div className="font-bold text-sm text-gray-900">{customer.businessName}</div>
              {customer.contactPerson && <div className="text-gray-600">Contact: {customer.contactPerson}</div>}
            </div>

            <div>
              <span className="text-[10px] text-gray-500 font-bold uppercase">Mobile / GSTIN</span>
              <div className="font-medium text-gray-800">{customer.mobile}</div>
              {customer.gstin && <div className="font-mono text-[10px]">GSTIN: {customer.gstin}</div>}
            </div>

            <div>
              <span className="text-[10px] text-gray-500 font-bold uppercase">Credit Limit</span>
              <div className="font-bold text-sm text-gray-900">
                ₹{customer.creditLimit.toLocaleString('en-IN')}
              </div>
              <div className="text-[10px] text-gray-500">Terms: {customer.paymentTerms}</div>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-gray-500 font-bold uppercase">Current Outstanding</span>
              <div className="font-serif text-lg font-bold text-amber-800">
                ₹{customer.outstandingBalance.toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          {/* Ledger Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-300 text-[10px] uppercase text-gray-700 bg-gray-100">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Transaction Type</th>
                  <th className="py-2.5 px-3">Particulars / Ref #</th>
                  <th className="py-2.5 px-3 text-right">Debit (₹)</th>
                  <th className="py-2.5 px-3 text-right">Credit (₹)</th>
                  <th className="py-2.5 px-3 text-right font-bold">Balance (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {ledgers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-500">
                      No ledger transactions recorded yet.
                    </td>
                  </tr>
                ) : (
                  ledgers.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="py-2.5 px-3 font-mono text-[11px]">
                        {new Date(item.createdAt).toLocaleDateString('en-IN')}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                            item.transactionType === 'INVOICE'
                              ? 'bg-amber-100 text-amber-900'
                              : 'bg-emerald-100 text-emerald-900'
                          }`}
                        >
                          {item.transactionType}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-gray-700">{item.notes || '-'}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-rose-700">
                        {item.debit > 0 ? `₹${item.debit.toLocaleString('en-IN')}` : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-emerald-700">
                        {item.credit > 0 ? `₹${item.credit.toLocaleString('en-IN')}` : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-gray-900">
                        ₹{item.balance.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Statement Footer Signature */}
          <div className="pt-8 flex justify-between items-end text-[10px] text-gray-500 border-t border-gray-200">
            <div>
              <p className="font-bold text-gray-700">Shanker Jewells Wholesale Division</p>
              <p>Certified statement generated directly from database ledger.</p>
            </div>
            <div className="text-center">
              <div className="h-10 border-b border-gray-400 w-36 mb-1" />
              <p className="font-bold text-gray-800">Authorized Signatory</p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default AdminWholesaleLedgerPage;

